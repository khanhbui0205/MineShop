let PayOS = require('@payos/node');
if (PayOS.PayOS) PayOS = PayOS.PayOS;

const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Package = require('../models/Package');
const PaymentConfig = require('../models/PaymentConfig');
const PackageExecutionLog = require('../models/PackageExecutionLog');
const rconService = require('./rconService');

const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
};

const STATUS_ALIASES = {
  pending: PAYMENT_STATUS.PENDING,
  PENDING: PAYMENT_STATUS.PENDING,
  paid: PAYMENT_STATUS.PAID,
  PAID: PAYMENT_STATUS.PAID,
  completed: PAYMENT_STATUS.PAID,
  Completed: PAYMENT_STATUS.PAID,
  cancelled: PAYMENT_STATUS.CANCELLED,
  canceled: PAYMENT_STATUS.CANCELLED,
  CANCELLED: PAYMENT_STATUS.CANCELLED,
  CANCELED: PAYMENT_STATUS.CANCELLED,
  expired: PAYMENT_STATUS.CANCELLED,
  EXPIRED: PAYMENT_STATUS.CANCELLED,
  failed: PAYMENT_STATUS.FAILED,
  FAILED: PAYMENT_STATUS.FAILED,
};

const STATUS_QUERY_ALIASES = {
  [PAYMENT_STATUS.PENDING]: ['PENDING', 'pending'],
  [PAYMENT_STATUS.PAID]: ['PAID', 'paid', 'completed', 'Completed'],
  [PAYMENT_STATUS.CANCELLED]: ['CANCELLED', 'CANCELED', 'EXPIRED', 'cancelled', 'canceled', 'expired'],
  [PAYMENT_STATUS.FAILED]: ['FAILED', 'failed'],
};

function logPayment(event, payload = {}) {
  console.log(`[${event}]`, JSON.stringify(payload));
}

function normalizePaymentStatus(status) {
  return STATUS_ALIASES[String(status || '')] || PAYMENT_STATUS.PENDING;
}

function getStatusQuery(status) {
  const normalized = normalizePaymentStatus(status);
  return { $in: STATUS_QUERY_ALIASES[normalized] || [normalized] };
}

function isPendingStatus(status) {
  return normalizePaymentStatus(status) === PAYMENT_STATUS.PENDING;
}

function isPaidStatus(status) {
  return normalizePaymentStatus(status) === PAYMENT_STATUS.PAID;
}

function isFailureStatus(status) {
  const normalized = normalizePaymentStatus(status);
  return normalized === PAYMENT_STATUS.FAILED || normalized === PAYMENT_STATUS.CANCELLED;
}

function normalizePayOSStatus(payosData = {}) {
  if (payosData.code === '00' || payosData.status === 'PAID') {
    return PAYMENT_STATUS.PAID;
  }

  const rawStatus = String(payosData.status || '').toUpperCase();
  if (['CANCELLED', 'CANCELED', 'EXPIRED'].includes(rawStatus)) {
    return PAYMENT_STATUS.CANCELLED;
  }

  if (['FAILED', 'ERROR'].includes(rawStatus)) {
    return PAYMENT_STATUS.FAILED;
  }

  return PAYMENT_STATUS.PENDING;
}

async function getPayOSInstance() {
  const config = await PaymentConfig.findOne({ isActive: true });
  if (!config || !config.clientId || !config.apiKey || !config.checksumKey) {
    throw new Error('PayOS configuration is missing or inactive');
  }

  return new PayOS({
    clientId: config.clientId,
    apiKey: config.apiKey,
    checksumKey: config.checksumKey,
  });
}

async function verifyPayOSWebhook(webhookBody) {
  const payos = await getPayOSInstance();
  if (!payos.webhooks || typeof payos.webhooks.verify !== 'function') {
    throw new Error('PayOS webhook verifier is not available');
  }

  const data = await payos.webhooks.verify(webhookBody);
  logPayment('WEBHOOK_VERIFIED', {
    orderCode: data?.orderCode,
    amount: data?.amount,
    code: data?.code,
    status: data?.status,
  });
  return data;
}

function validateWebhookData(data, transaction) {
  if (!data || data.orderCode === undefined || data.orderCode === null) {
    throw new Error('Webhook data is missing orderCode');
  }

  const orderCode = Number(data.orderCode);
  if (!Number.isSafeInteger(orderCode) || orderCode <= 0) {
    throw new Error('Webhook orderCode is invalid');
  }

  if (!transaction) {
    throw new Error(`Transaction not found for orderCode ${orderCode}`);
  }

  if (Number(data.amount) !== Number(transaction.amount)) {
    throw new Error(`Webhook amount mismatch for orderCode ${orderCode}`);
  }
}

async function markPaymentFailure(transaction, status = PAYMENT_STATUS.FAILED, meta = {}) {
  const normalized = normalizePaymentStatus(status);
  const targetStatus = normalized === PAYMENT_STATUS.CANCELLED ? PAYMENT_STATUS.CANCELLED : PAYMENT_STATUS.FAILED;

  const updated = await Transaction.findOneAndUpdate(
    {
      _id: transaction._id,
      balanceCredited: { $ne: true },
      status: { $nin: STATUS_QUERY_ALIASES[PAYMENT_STATUS.PAID] },
    },
    {
      $set: {
        status: targetStatus,
        failedAt: new Date(),
        transactionId: meta.transactionId || transaction.transactionId || '',
      },
    },
    { new: true }
  );

  logPayment('PAYMENT_FAILED', {
    orderCode: transaction.orderCode,
    status: updated?.status || transaction.status,
    source: meta.source,
  });

  return updated || transaction;
}

async function processSuccessfulPayment(transaction, meta = {}) {
  const now = meta.paidAt ? new Date(meta.paidAt) : new Date();
  const transactionId = meta.transactionId || transaction.transactionId || '';

  const claimed = await Transaction.findOneAndUpdate(
    {
      _id: transaction._id,
      balanceCredited: { $ne: true },
      status: { $nin: STATUS_QUERY_ALIASES[PAYMENT_STATUS.PAID] },
    },
    {
      $set: {
        status: PAYMENT_STATUS.PAID,
        paidAt: transaction.paidAt || now,
        balanceCredited: true,
        transactionId,
      },
    },
    { new: true }
  );

  if (!claimed) {
    await Transaction.updateOne(
      { _id: transaction._id, status: { $nin: STATUS_QUERY_ALIASES[PAYMENT_STATUS.PAID] } },
      { $set: { status: PAYMENT_STATUS.PAID, paidAt: transaction.paidAt || now, transactionId } }
    );

    logPayment('DUPLICATE_PAYMENT_IGNORED', {
      orderCode: transaction.orderCode,
      source: meta.source,
    });
    return false;
  }

  logPayment('PAYMENT_SUCCESS', {
    orderCode: claimed.orderCode,
    amount: claimed.amount,
    coinsChange: claimed.coinsChange,
    source: meta.source,
  });

  const user = await User.findByIdAndUpdate(
    claimed.user,
    {
      $inc: {
        balance: Number(claimed.coinsChange) || 0,
        totalDeposited: Number(claimed.amount) || 0,
      },
    },
    { new: true }
  );

  if (user) {
    console.log(`[PAYMENT SERVICE] Credited ${claimed.coinsChange} coins to ${user.username}.`);
  }

  if (claimed.package && claimed.playerName && !claimed.rewardDelivered) {
    const pkg = await Package.findById(claimed.package);
    if (pkg && Array.isArray(pkg.commands) && pkg.commands.length > 0) {
      let allSuccess = true;

      for (const cmdTemplate of pkg.commands) {
        const command = cmdTemplate.replace(/{player}/g, claimed.playerName);
        try {
          const response = await rconService.sendCommand(command);
          await PackageExecutionLog.create({
            paymentId: claimed._id,
            packageId: pkg._id,
            playerName: claimed.playerName,
            command,
            success: true,
            response: response || 'Success',
          });
        } catch (error) {
          allSuccess = false;
          console.error(`[RCON SERVICE] Error executing ${command}:`, error.message);
          await PackageExecutionLog.create({
            paymentId: claimed._id,
            packageId: pkg._id,
            playerName: claimed.playerName,
            command,
            success: false,
            response: error.message,
          });
        }
      }

      if (allSuccess) {
        claimed.rewardDelivered = true;
        await claimed.save();
      }
    }
  }

  return true;
}

async function syncTransactionWithPayOS(transaction, meta = {}) {
  if (isPaidStatus(transaction.status) || isFailureStatus(transaction.status)) {
    return transaction;
  }

  const payos = await getPayOSInstance();
  const payosData = await payos.paymentRequests.get(transaction.orderCode);
  const status = normalizePayOSStatus(payosData);

  logPayment('PAYMENT_PENDING', {
    orderCode: transaction.orderCode,
    payosStatus: payosData?.status,
    source: meta.source,
  });

  if (status === PAYMENT_STATUS.PAID) {
    await processSuccessfulPayment(transaction, {
      source: meta.source,
      transactionId: payosData.reference || payosData.id || transaction.transactionId || '',
      paidAt: payosData.paidAt || payosData.updatedAt,
    });
  } else if (status === PAYMENT_STATUS.CANCELLED || status === PAYMENT_STATUS.FAILED) {
    await markPaymentFailure(transaction, status, {
      source: meta.source,
      transactionId: payosData.reference || payosData.id || transaction.transactionId || '',
    });
  }

  return Transaction.findById(transaction._id).populate('package', 'name price');
}

function buildPaymentPayload(transaction) {
  const payload = typeof transaction.toObject === 'function' ? transaction.toObject() : transaction;
  return {
    ...payload,
    status: normalizePaymentStatus(payload.status),
    id: payload._id,
    transactionId: payload.transactionId || '',
  };
}

module.exports = {
  PAYMENT_STATUS,
  getPayOSInstance,
  getStatusQuery,
  isPendingStatus,
  logPayment,
  normalizePaymentStatus,
  normalizePayOSStatus,
  processSuccessfulPayment,
  syncTransactionWithPayOS,
  markPaymentFailure,
  verifyPayOSWebhook,
  validateWebhookData,
  buildPaymentPayload,
};
