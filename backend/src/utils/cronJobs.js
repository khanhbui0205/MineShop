const cron = require('node-cron');
const Transaction = require('../models/Transaction');
const PaymentConfig = require('../models/PaymentConfig');
const { processSuccessfulPayment } = require('../services/paymentProcessingService');
let PayOS = require('@payos/node');
if (PayOS.PayOS) PayOS = PayOS.PayOS;

/**
 * Initialize all cron jobs
 */
const initCronJobs = () => {
  // Sync PayOS transactions every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('[CRON] Starting PayOS status synchronization...');
    try {
      const config = await PaymentConfig.findOne({ isActive: true });
      if (!config || !config.clientId || !config.apiKey || !config.checksumKey) {
        console.warn('[CRON] PayOS config not found or inactive. Skipping sync.');
        return;
      }

      const payos = new PayOS({
        clientId: config.clientId,
        apiKey: config.apiKey,
        checksumKey: config.checksumKey
      });

      // Find all pending transactions
      const pendingTxs = await Transaction.find({ status: 'pending' });
      console.log(`[CRON] Found ${pendingTxs.length} pending transactions to check.`);

      for (const tx of pendingTxs) {
        try {
          const payosData = await payos.paymentRequests.get(tx.orderCode);
          console.log(`[CRON] Order ${tx.orderCode} status on PayOS: ${payosData.status}`);

          if (payosData.status === 'PAID') {
            tx.transactionId = payosData.reference || tx.transactionId;
            await processSuccessfulPayment(tx);
            console.log(`[CRON] Order ${tx.orderCode} synced to completed`);
          } else if (payosData.status === 'CANCELLED' || payosData.status === 'EXPIRED') {
            tx.status = 'cancelled';
            await tx.save();
            console.log(`[CRON] Order ${tx.orderCode} synced to cancelled (PayOS: ${payosData.status})`);
          } else {
             // If still pending but too old (e.g. > 1 hour)
             const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
             if (tx.createdAt < oneHourAgo) {
               tx.status = 'cancelled';
               await tx.save();
               console.log(`[CRON] Order ${tx.orderCode} stale (pending > 1h), marking as cancelled.`);
             }
          }
        } catch (err) {
          console.error(`[CRON ERR] Failed to sync order ${tx.orderCode}:`, err.message);
          // If PayOS says it doesn't exist (Code 101), mark as cancelled locally
          if (err.message.includes('101') || err.message.includes('không tồn tại')) {
            tx.status = 'cancelled';
            await tx.save();
          }
        }
      }
    } catch (error) {
      console.error('[CRON ERROR]', error.message);
    }
  });

  console.log('[CRON] PayOS Sync Job scheduled (every 5 minutes)');
};

module.exports = {
  initCronJobs
};
