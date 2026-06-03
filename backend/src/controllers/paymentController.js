let PayOS = require('@payos/node');
if (PayOS.PayOS) PayOS = PayOS.PayOS;

const Transaction = require('../models/Transaction');
const Package = require('../models/Package');
const User = require('../models/User');
const PaymentConfig = require('../models/PaymentConfig');
const PackageExecutionLog = require('../models/PackageExecutionLog');
const rconService = require('../services/rconService');

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
    const { packageId, playerName } = req.body;
    
    if (!playerName) {
      return res.status(400).json({ message: 'Vui lòng nhập tên người chơi Minecraft' });
    }

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


    // Dynamic domains for redirect URLs
    const domain = process.env.NODE_ENV === 'production' 
      ? (process.env.FRONTEND_URL_PROD || 'https://mineshop.khanhbui0205.workers.dev')
      : (process.env.FRONTEND_URL_DEV || 'http://localhost:5173');
    
    const body = {
      orderCode: orderCode,
      amount: pkg.price,
      description: `MS${orderCode}`,
      items: [
        {
          name: pkg.name,
          quantity: 1,
          price: pkg.price,
        },
      ],
      returnUrl: `${domain}/payment/success`,
      cancelUrl: `${domain}/payment/cancel`,
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
      playerName: playerName,
      accountNumber: paymentLinkRes.accountNumber,
      accountName: paymentLinkRes.accountName,
      description: paymentLinkRes.description || body.description, // Use the description returned by PayOS or fallback to body.description
      bankName: paymentLinkRes.bin || 'VietQR',
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
// @desc    Handle PayOS Webhook
// @route   POST /api/payos/webhook
// @access  Public
exports.handleWebhook = async (req, res) => {
  try {
    console.log('[WEBHOOK RECEIVED]', JSON.stringify(req.body));
    const payos = await getPayOSInstance();
    
    // Verify Webhook Data using SDK
    const webhookData = payos.verifyPaymentWebhookData(req.body.data);
    console.log('[WEBHOOK VERIFIED] OrderCode:', webhookData?.orderCode, 'Status:', req.body.data?.status);

    if (!webhookData) {
      return res.status(400).json({ message: 'Webhook data verification failed' });
    }

    const transaction = await Transaction.findOne({ orderCode: webhookData.orderCode }).populate('user');
    if (!transaction) {
      console.log('[WEBHOOK] Transaction not found for orderCode:', webhookData.orderCode);
      return res.json({ success: true }); // Return Success to PayOS even if not found locally to stop retries if it's an old/unknown order
    }

    // Anti Duplicate - If already completed, skip
    if (transaction.status === 'completed' || transaction.status === 'paid') {
      console.log('[WEBHOOK] Already processed, skipping');
      return res.json({ success: true });
    }

    const payosStatus = req.body.data?.status;

    if (payosStatus === 'PAID') {
      transaction.transactionId = webhookData.reference || transaction.transactionId;
      await processSuccessfulPayment(transaction);
    } else if (payosStatus === 'CANCELLED' || payosStatus === 'EXPIRED') {
      transaction.status = 'cancelled';
      await transaction.save();
      console.log(`[WEBHOOK] Order ${transaction.orderCode} was ${payosStatus}`);
    } else {
      console.log(`[WEBHOOK] Order ${transaction.orderCode} status: ${payosStatus}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[WEBHOOK ERROR]', error.message);
    // Don't return error to PayOS or it will keep retrying even if it's just a local logic issue
    res.json({ success: false, message: error.message });
  }
};

// Helper: Process a paid transaction
const processSuccessfulPayment = async (transaction) => {
  // 1. Mark as completed in DB
  if (transaction.status === 'completed' || transaction.status === 'paid') {
    return false; // Already processed
  }
  
  transaction.status = 'completed';
  transaction.paidAt = new Date();
  await transaction.save();

  // 2. Update User Balance
  const user = await User.findById(transaction.user._id || transaction.user);
  if (user) {
    user.balance += transaction.coinsChange;
    user.totalDeposited += Number(transaction.amount) || 0;
    await user.save();
    console.log(`[PAYMENT CONFIRMED] Order ${transaction.orderCode} → User ${user.username} +${transaction.coinsChange} coins`);
  }

  // 3. Execute Minecraft Package Commands (Requirement 10 & 11)
  if (transaction.package && transaction.playerName && !transaction.rewardDelivered) {
    const pkg = await Package.findById(transaction.package);
    if (pkg && pkg.commands && pkg.commands.length > 0) {
      console.log(`[RCON] Delivering package ${pkg.name} to ${transaction.playerName}`);
      
      let allSuccess = true;
      for (const cmdTemplate of pkg.commands) {
        const command = cmdTemplate.replace(/{player}/g, transaction.playerName);
        try {
          const response = await rconService.sendCommand(command);
          await PackageExecutionLog.create({
            paymentId: transaction._id,
            packageId: pkg._id,
            playerName: transaction.playerName,
            command: command,
            success: true,
            response: response || 'Success'
          });
        } catch (error) {
          allSuccess = false;
          console.error(`[RCON] Error executing ${command}:`, error.message);
          await PackageExecutionLog.create({
            paymentId: transaction._id,
            packageId: pkg._id,
            playerName: transaction.playerName,
            command: command,
            success: false,
            response: error.message
          });
        }
      }
      
      if (allSuccess) {
        transaction.rewardDelivered = true;
        await transaction.save();
        console.log(`[RCON] All commands executed successfully for ${transaction.orderCode}`);
      }
    }
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
      return res.json({ status: transaction.status });
    }

    // If pending and too old (30 mins), auto-cancel
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    if (transaction.status === 'pending' && transaction.createdAt < thirtyMinsAgo) {
      transaction.status = 'cancelled';
      await transaction.save();
      return res.json({ status: 'cancelled' });
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
          return res.json({ status: 'paid', transactionId: transaction.transactionId });
        }

        if (payosData && (payosData.status === 'CANCELLED' || payosData.status === 'EXPIRED')) {
          const newStatus = payosData.status.toLowerCase() === 'expired' ? 'expired' : 'cancelled';
          transaction.status = newStatus;
          await transaction.save();
          return res.json({ status: newStatus });
        }
      } catch (payosErr) {
        // If PayOS query fails, fall through to return DB status
        console.warn('[STATUS API] PayOS query error (non-fatal):', payosErr.message);
      }
    }

    console.log('[STATUS API] Returning DB status:', transaction.status, 'OrderCode:', transaction.orderCode);
    res.json({ 
      status: transaction.status,
      transactionId: transaction.transactionId || '',
      orderCode: transaction.orderCode,
      payosOrderId: transaction.payosOrderId || '',
      paymentUrl: transaction.paymentUrl || ''
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Resume payment for existing pending transaction
// @route   GET /api/payment/resume/:id
// @access  Private
exports.resumePayment = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Không tìm thấy giao dịch' });
    }

    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: `Giao dịch đã ở trạng thái ${transaction.status}` });
    }

    // Optional: Refresh from PayOS first to make sure it's actually still pending
    try {
      const payos = await getPayOSInstance();
      const payosData = await payos.paymentRequests.get(transaction.payosOrderId);
      
      if (payosData.status === 'PAID') {
        await processSuccessfulPayment(transaction);
        return res.status(400).json({ message: 'Giao dịch đã được thanh toán' });
      }
      
      if (payosData.status === 'CANCELLED' || payosData.status === 'EXPIRED') {
        transaction.status = payosData.status.toLowerCase();
        await transaction.save();
        return res.status(400).json({ message: 'Giao dịch đã hết hạn hoặc bị hủy' });
      }
    } catch (err) {
      console.warn('PayOS check failed during resume:', err.message);
    }

    res.json({
      orderCode: transaction.orderCode,
      checkoutUrl: transaction.paymentUrl,
      qrCode: transaction.qrCode,
      transactionId: transaction._id,
      status: transaction.status
    });
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

    // SYNC LOGIC (Requirement 18):
    // Identify transactions that are still 'pending' to sync with PayOS
    const pendingTransactions = await Transaction.find({ 
      user: req.user._id, 
      status: 'pending' 
    }).limit(5); // Limit sync to prevent overloading for very old accounts

    if (pendingTransactions.length > 0) {
      const payos = await getPayOSInstance();
      for (const tx of pendingTransactions) {
        try {
          const payosData = await payos.paymentRequests.get(tx.payosOrderId);
          console.log(`[SYNC] Order ${tx.orderCode} status: ${payosData.status}`);
          
          if (payosData.status === 'PAID') {
            tx.transactionId = payosData.reference || tx.transactionId;
            await processSuccessfulPayment(tx);
          } else if (payosData.status === 'CANCELLED' || payosData.status === 'EXPIRED') {
            tx.status = 'cancelled';
            await tx.save();
          } else {
            // Check if too old (30 mins) and not PAID/CANCELLED in PayOS
            const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
            if (tx.createdAt < thirtyMinsAgo) {
              tx.status = 'cancelled';
              await tx.save();
            }
          }
        } catch (syncErr) {
          console.warn(`[SYNC ERR] Order ${tx.orderCode}:`, syncErr.message);
        }
      }
    }

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
