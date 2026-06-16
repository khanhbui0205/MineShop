const Transaction = require('../models/Transaction');
const Package = require('../models/Package');
const minecraftService = require('../services/minecraftService');
const { resolveMinecraftUsername } = require('../utils/userHelpers');
const {
  PAYMENT_STATUS,
  buildPaymentPayload,
  getPayOSInstance,
  getStatusQuery,
  isPendingStatus,
  logPayment,
  markPaymentFailure,
  normalizePaymentStatus,
  normalizePayOSStatus,
  processSuccessfulPayment,
  syncTransactionWithPayOS,
  validateWebhookData,
  verifyPayOSWebhook,
} = require('../services/paymentProcessingService');

function getFrontendDomain() {
  if (process.env.NODE_ENV === 'production') {
    return process.env.FRONTEND_URL_PROD || 'https://mineshop.khanhbui0205.workers.dev';
  }
  return process.env.FRONTEND_URL_DEV || 'http://localhost:5173';
}

function getTransactionUserId(transaction) {
  return transaction.user?._id ? transaction.user._id.toString() : transaction.user?.toString();
}

function canAccessTransaction(req, transaction) {
  return req.user.role === 'admin' || getTransactionUserId(transaction) === req.user._id.toString();
}

function buildStatusResponse(transaction) {
  const payload = buildPaymentPayload(transaction);
  return {
    id: payload._id,
    _id: payload._id,
    orderCode: payload.orderCode,
    status: payload.status,
    amount: payload.amount,
    item: payload.item,
    packageName: payload.package?.name || payload.item,
    paidAt: payload.paidAt,
    createdAt: payload.createdAt,
    transactionId: payload.transactionId || '',
    paymentUrl: payload.paymentUrl || '',
    payosOrderId: payload.payosOrderId || '',
  };
}

async function refreshIfPending(transaction, source) {
  if (!isPendingStatus(transaction.status)) {
    return transaction;
  }

  try {
    return await syncTransactionWithPayOS(transaction, { source });
  } catch (error) {
    console.warn(`[PAYMENT STATUS] PayOS sync failed for ${transaction.orderCode}:`, error.message);
    return transaction;
  }
}

async function loadStatusByOrderCode(req, res, source) {
  const transaction = await Transaction.findOne({ orderCode: Number(req.params.orderCode) })
    .populate('package', 'name price')
    .populate('user', 'username minecraftUsername');

  if (!transaction) {
    return res.status(404).json({ message: 'Transaction not found' });
  }

  if (!canAccessTransaction(req, transaction)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const refreshed = await refreshIfPending(transaction, source);
  return res.json(buildStatusResponse(refreshed || transaction));
}

async function generateOrderCode() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const suffix = Math.floor(Math.random() * 100);
    const orderCode = Number(`${Date.now()}${suffix.toString().padStart(2, '0')}`);
    const exists = await Transaction.exists({ orderCode });
    if (!exists) return orderCode;
  }

  throw new Error('Could not generate a unique PayOS orderCode');
}

exports.createPayment = async (req, res) => {
  try {
    const { packageId } = req.body;
    let playerName = resolveMinecraftUsername(req.user);

    if (!playerName) {
      return res.status(400).json({ success: false, message: 'Minecraft username is not verified' });
    }

    logPayment('PAYMENT_CREATED', {
      step: 'REQUEST_RECEIVED',
      userId: req.user._id,
      playerName,
      packageId,
    });

    try {
      const verification = await minecraftService.verifyPlayerExists(playerName);
      if (!verification.exists) {
        return res.status(400).json({
          success: false,
          error: 'PLAYER_NOT_FOUND',
          message: 'Minecraft player not found on the server',
        });
      }

      await minecraftService.getPlayerBalance(verification.realName || playerName);
      playerName = verification.realName || playerName;
    } catch (error) {
      if (error.message === 'PLAYER_NOT_FOUND') {
        return res.status(400).json({
          success: false,
          error: 'PLAYER_NOT_FOUND',
          message: 'Minecraft player not found on the server',
        });
      }

      return res.status(500).json({
        success: false,
        error: 'RCON_ERROR',
        message: 'Could not verify Minecraft player',
      });
    }

    const pkg = await Package.findById(packageId);
    if (!pkg) {
      return res.status(404).json({ message: 'Package not found' });
    }

    const payos = await getPayOSInstance();
    const orderCode = await generateOrderCode();
    const domain = getFrontendDomain();

    const paymentBody = {
      orderCode,
      amount: Number(pkg.price),
      description: `MS${orderCode}`,
      items: [
        {
          name: pkg.name,
          quantity: 1,
          price: Number(pkg.price),
        },
      ],
      returnUrl: `${domain}/payment/success?orderCode=${orderCode}`,
      cancelUrl: `${domain}/payment/cancel?orderCode=${orderCode}`,
    };

    const paymentLinkRes = await payos.paymentRequests.create(paymentBody);
    const payosId = paymentLinkRes.id || paymentLinkRes.paymentRequestId || String(orderCode);

    const transaction = await Transaction.create({
      user: req.user._id,
      package: pkg._id,
      type: 'Deposit',
      item: pkg.name,
      amount: Number(pkg.price),
      coinsChange: Number(pkg.coinAmount || 0) + Number(pkg.bonusCoin || 0),
      orderCode,
      payosOrderId: payosId,
      paymentUrl: paymentLinkRes.checkoutUrl,
      qrCode: paymentLinkRes.qrCode || '',
      status: PAYMENT_STATUS.PENDING,
      playerName,
      minecraftUsername: playerName,
      accountNumber: paymentLinkRes.accountNumber,
      accountName: paymentLinkRes.accountName,
      description: paymentLinkRes.description || paymentBody.description,
      bankName: paymentLinkRes.bin || 'VietQR',
      balanceCredited: false,
    });

    logPayment('PAYMENT_CREATED', {
      orderCode,
      transactionId: transaction._id,
      amount: transaction.amount,
      packageName: pkg.name,
    });
    logPayment('PAYMENT_PENDING', { orderCode, source: 'CREATE_PAYMENT' });

    return res.json({
      checkoutUrl: paymentLinkRes.checkoutUrl,
      qrCode: paymentLinkRes.qrCode || '',
      orderCode,
      transactionId: transaction._id,
      paymentRequestId: paymentLinkRes.paymentRequestId,
    });
  } catch (error) {
    console.error('[PAYMENT CREATE ERROR]', {
      message: error.message,
      code: error.code,
      desc: error.desc,
      data: error.data,
    });

    return res.status(500).json({
      message: error.desc || error.message || 'Could not create PayOS payment',
    });
  }
};

exports.handleWebhook = async (req, res) => {
  logPayment('WEBHOOK_RECEIVED', {
    orderCode: req.body?.data?.orderCode,
    code: req.body?.data?.code,
    status: req.body?.data?.status,
  });

  try {
    const data = await verifyPayOSWebhook(req.body);
    const orderCode = Number(data.orderCode);
    const transaction = await Transaction.findOne({ orderCode }).populate('user');

    validateWebhookData(data, transaction);

    if (!transaction) {
      console.warn('[PAYOS WEBHOOK] Verified webhook ignored because orderCode was not found:', orderCode);
      return res.json({ success: true });
    }

    const payosStatus = normalizePayOSStatus(data);
    if (payosStatus === PAYMENT_STATUS.PAID) {
      await processSuccessfulPayment(transaction, {
        source: 'WEBHOOK',
        transactionId: data.reference || transaction.transactionId || '',
        paidAt: data.transactionDateTime || data.paidAt,
      });
    } else if (payosStatus === PAYMENT_STATUS.CANCELLED || payosStatus === PAYMENT_STATUS.FAILED) {
      await markPaymentFailure(transaction, payosStatus, {
        source: 'WEBHOOK',
        transactionId: data.reference || transaction.transactionId || '',
      });
    } else {
      logPayment('PAYMENT_PENDING', { orderCode, source: 'WEBHOOK', payosStatus: data.status });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('[PAYOS WEBHOOK ERROR]', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.checkPaymentStatus = async (req, res) => {
  try {
    return await loadStatusByOrderCode(req, res, 'MANUAL_CHECK');
  } catch (error) {
    console.error('[PAYMENT CHECK ERROR]', error.message);
    return res.status(500).json({ message: 'Could not check PayOS payment status' });
  }
};

exports.getPaymentStatus = async (req, res) => {
  try {
    return await loadStatusByOrderCode(req, res, 'POLLING');
  } catch (error) {
    console.error('[PAYMENT STATUS ERROR]', error.message);
    return res.status(500).json({ message: error.message });
  }
};

exports.resumePayment = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id).populate('package', 'name price');
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (!canAccessTransaction(req, transaction)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const refreshed = await refreshIfPending(transaction, 'RESUME');
    return res.json(buildPaymentPayload(refreshed || transaction));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { user: req.user._id, type: 'Deposit' };
    if (status) {
      query.status = getStatusQuery(status);
    }

    const pendingTransactions = await Transaction.find({
      user: req.user._id,
      type: 'Deposit',
      status: getStatusQuery(PAYMENT_STATUS.PENDING),
    }).limit(5);

    for (const tx of pendingTransactions) {
      try {
        await syncTransactionWithPayOS(tx, { source: 'HISTORY_SYNC' });
      } catch (error) {
        console.warn(`[HISTORY SYNC] Order ${tx.orderCode}:`, error.message);
      }
    }

    const numericPage = Number(page);
    const numericLimit = Number(limit);
    const skip = (numericPage - 1) * numericLimit;
    const linkedMcName = resolveMinecraftUsername(req.user);

    const transactions = await Transaction.find(query)
      .populate('package', 'name price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(numericLimit)
      .lean();

    const total = await Transaction.countDocuments(query);
    const enriched = transactions.map((tx) => ({
      ...buildPaymentPayload(tx),
      playerName: tx.playerName || tx.minecraftUsername || linkedMcName,
      minecraftUsername: tx.minecraftUsername || tx.playerName || linkedMcName,
    }));

    return res.json({
      transactions: enriched,
      page: numericPage,
      totalPages: Math.ceil(total / numericLimit),
      total,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getMonthlyTopDonators = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const rows = await Transaction.aggregate([
      {
        $match: {
          type: 'Deposit',
          status: getStatusQuery(PAYMENT_STATUS.PAID),
          createdAt: { $gte: startOfMonth, $lt: startOfNextMonth },
        },
      },
      {
        $group: {
          _id: '$user',
          totalAmount: {
            $sum: {
              $convert: {
                input: '$amount',
                to: 'double',
                onError: 0,
                onNull: 0,
              },
            },
          },
        },
      },
      { $match: { totalAmount: { $gt: 0 } } },
      { $sort: { totalAmount: -1 } },
      { $limit: 3 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          userId: '$user._id',
          username: '$user.username',
          minecraftUsername: '$user.minecraftUsername',
          totalAmount: 1,
        },
      },
    ]);

    const topDonators = rows.map((row, index) => {
      const displayName = row.minecraftUsername || row.username || 'Player';
      return {
        rank: index + 1,
        userId: row.userId,
        username: row.username,
        displayName,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4f46e5&color=fff&bold=true`,
        totalAmount: row.totalAmount,
      };
    });

    return res.json({
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      topDonators,
    });
  } catch (error) {
    console.error('[MONTHLY TOP DONATORS ERROR]', error.message);
    return res.status(500).json({ message: error.message });
  }
};

exports.getPaymentById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('package')
      .populate('user', 'username minecraftUsername');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (!canAccessTransaction(req, transaction)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const refreshed = await refreshIfPending(transaction, 'GET_BY_ID');
    const payload = buildPaymentPayload(refreshed || transaction);
    const linkedMcName = resolveMinecraftUsername(transaction.user);

    payload.playerName = payload.playerName || payload.minecraftUsername || linkedMcName;
    payload.minecraftUsername = payload.minecraftUsername || payload.playerName || linkedMcName;

    return res.json(payload);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
