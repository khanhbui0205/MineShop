let PayOS = require('@payos/node');
if (PayOS.PayOS) PayOS = PayOS.PayOS;

const Transaction = require('../models/Transaction');
const Package = require('../models/Package');
const User = require('../models/User');
const PaymentConfig = require('../models/PaymentConfig');

// Utility to get PayOS instance
const getPayOSInstance = async () => {
  const config = await PaymentConfig.findOne({ isActive: true });
  if (!config || !config.clientId || !config.apiKey || !config.checksumKey) {
    throw new Error('Cấu hình PayOS chưa được thiết lập');
  }
  return new PayOS({
    clientId: config.clientId,
    apiKey: config.apiKey,
    checksumKey: config.checksumKey
  });
};

// @desc    Create payment link
// @route   POST /api/payment/create
// @access  Private
exports.createPayment = async (req, res) => {
  try {
    const { packageId } = req.body;
    const pkg = await Package.findById(packageId);
    if (!pkg) {
      return res.status(404).json({ message: 'Không tìm thấy gói nạp' });
    }

    const config = await PaymentConfig.findOne({ isActive: true });
    if (!config) {
      return res.status(400).json({ message: 'Hệ thống thanh toán đang bảo trì' });
    }

    const payos = await getPayOSInstance();
    console.log('PayOS Methods:', Object.keys(payos));
    console.log('paymentRequests:', payos.paymentRequests ? Object.keys(payos.paymentRequests) : 'undefined');
    const orderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 1000));


    const domain = process.env.NODE_ENV === 'production' ? config.webhookUrl.split('/api')[0] : 'http://localhost:5173';
    
    const body = {
      orderCode: orderCode,
      amount: pkg.price,
      description: `Nap ${pkg.coinAmount} Xu - ${req.user.username}`,
      items: [
        {
          name: pkg.name,
          quantity: 1,
          price: pkg.price,
        },
      ],
      returnUrl: config.returnUrl || `${domain}/payment/success`,
      cancelUrl: config.cancelUrl || `${domain}/payment/failed`,
    };

    const paymentLinkRes = await payos.paymentRequests.create(body);
    console.log('PayOS Create Successful. OrderCode:', orderCode);
    console.log('PayOS Create Response Keys:', Object.keys(paymentLinkRes));
    console.log('PayOS id/paymentRequestId:', paymentLinkRes.id, paymentLinkRes.paymentRequestId);
    
    if (!paymentLinkRes.qrCode) {
      console.warn('PayOS did not return qrCode. Full response keys:', Object.keys(paymentLinkRes));
    }

    // Store the PayOS ID for later querying - try multiple fields
    const payosId = paymentLinkRes.id || paymentLinkRes.paymentRequestId || String(orderCode);

    const transaction = await Transaction.create({
      user: req.user._id,
      package: pkg._id,
      type: 'Deposit',
      item: pkg.name,
      amount: pkg.price,
      coinsChange: pkg.coinAmount + (pkg.bonusCoin || 0),
      orderCode: orderCode,
      payosOrderId: payosId,
      paymentUrl: paymentLinkRes.checkoutUrl,
      qrCode: paymentLinkRes.qrCode || '',
      status: 'pending',
    });


    res.json({
      checkoutUrl: paymentLinkRes.checkoutUrl,
      qrCode: paymentLinkRes.qrCode || '',
      orderCode: orderCode,
      transactionId: transaction._id,
      paymentRequestId: paymentLinkRes.paymentRequestId
    });
  } catch (error) {
    console.error('PayOS Create error details:', {
      message: error.message,
      code: error.code,
      desc: error.desc,
      data: error.data
    });
    res.status(500).json({ 
      message: error.desc || error.message || 'Lỗi khi tạo giao dịch thanh toán',
      error: error
    });
  }
};


// @desc    Handle PayOS Webhook
// @route   POST /api/payment/webhook
// @access  Public
exports.handleWebhook = async (req, res) => {
  try {
    console.log('[WEBHOOK RECEIVED]', JSON.stringify(req.body).substring(0, 300));
    const { code } = req.body;
    
    // Verify Webhook Data (Checksum)
    const payos = await getPayOSInstance();
    const webhookData = await payos.webhooks.verify(req.body);
    console.log('[WEBHOOK VERIFIED] OrderCode:', webhookData?.orderCode);

    if (!webhookData) {
      console.log('[WEBHOOK] Verification failed');
      return res.status(400).json({ message: 'Webhook data verification failed' });
    }

    const transaction = await Transaction.findOne({ orderCode: webhookData.orderCode }).populate('user');
    if (!transaction) {
      console.log('[WEBHOOK] Transaction not found for orderCode:', webhookData.orderCode);
      return res.status(404).json({ message: 'Không tìm thấy giao dịch' });
    }

    console.log('[WEBHOOK] TRANSACTION BEFORE UPDATE:', { id: transaction._id, status: transaction.status });

    // Anti Duplicate
    if (transaction.status === 'paid' || transaction.status === 'Completed') {
      console.log('[WEBHOOK] Already processed, skipping');
      return res.json({ success: true, message: 'Transaction already processed' });
    }

    if (code === '00') {
      transaction.status = 'paid';
      transaction.transactionId = webhookData.reference;
      await transaction.save();
      console.log('[WEBHOOK] TRANSACTION AFTER UPDATE:', { id: transaction._id, status: transaction.status });

      const user = await User.findById(transaction.user._id);
      if (user) {
        user.balance += transaction.coinsChange;
        user.totalDeposited += Number(transaction.amount) || 0;
        await user.save();
        console.log(`[WEBHOOK] Payment Success: Order ${webhookData.orderCode} for User ${user.username}, +${transaction.coinsChange} coins`);
      }
    } else {
      transaction.status = 'failed';
      await transaction.save();
      console.log('[WEBHOOK] Payment failed, code:', code);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[WEBHOOK ERROR]', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Helper: Process a paid transaction (shared between webhook and active polling)
const processSuccessfulPayment = async (transaction) => {
  if (transaction.status === 'paid' || transaction.status === 'Completed') {
    return false; // Already processed
  }
  
  transaction.status = 'paid';
  await transaction.save();

  const user = await User.findById(transaction.user._id || transaction.user);
  if (user) {
    user.balance += transaction.coinsChange;
    user.totalDeposited += Number(transaction.amount) || 0;
    await user.save();
    console.log(`[PAYMENT CONFIRMED] Order ${transaction.orderCode} → User ${user.username} +${transaction.coinsChange} coins`);
  }
  return true;
};

// @desc    Get payment status by orderCode (ACTIVE POLLING from PayOS if still pending)
// @route   GET /api/payment/status/:orderCode
// @access  Private
exports.getPaymentStatus = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ orderCode: req.params.orderCode });
    if (!transaction) {
      return res.status(404).json({ message: 'Không tìm thấy giao dịch' });
    }

    // If already paid/completed in our DB, return immediately
    if (transaction.status === 'paid' || transaction.status === 'Completed') {
      console.log('[STATUS API] Already paid in DB. OrderCode:', transaction.orderCode);
      return res.json({ status: transaction.status });
    }

    // ACTIVE POLLING: If still pending, query PayOS API directly
    if (transaction.status === 'pending' && transaction.payosOrderId) {
      try {
        const payos = await getPayOSInstance();
        const payosData = await payos.paymentRequests.get(transaction.payosOrderId);
        console.log('[STATUS API] PayOS query result:', { orderCode: transaction.orderCode, payosStatus: payosData?.status });

        if (payosData && (payosData.status === 'PAID' || payosData.status === 'paid')) {
          // PayOS confirms PAID → Update our DB
          console.log('[STATUS API] PayOS confirmed PAID! Updating DB...');
          transaction.transactionId = payosData.reference || payosData.id || '';
          await processSuccessfulPayment(transaction);
          return res.json({ status: 'paid' });
        }

        if (payosData && (payosData.status === 'CANCELLED' || payosData.status === 'EXPIRED')) {
          transaction.status = 'cancelled';
          await transaction.save();
          return res.json({ status: 'cancelled' });
        }
      } catch (payosErr) {
        // If PayOS query fails, fall through to return DB status
        console.warn('[STATUS API] PayOS query error (non-fatal):', payosErr.message);
      }
    }

    console.log('[STATUS API] Returning DB status:', transaction.status, 'OrderCode:', transaction.orderCode);
    res.json({ status: transaction.status });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user payment history
// @route   GET /api/payment/history
// @access  Private
exports.getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { user: req.user._id, type: 'Deposit' };
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const transactions = await Transaction.find(query)
      .populate('package', 'name price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get payment by ID
// @route   GET /api/payment/:id
// @access  Private
exports.getPaymentById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('package')
      .populate('user', 'username');
    
    if (!transaction) {
      return res.status(404).json({ message: 'Không tìm thấy giao dịch' });
    }

    if (transaction.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
