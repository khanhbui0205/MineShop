const cron = require('node-cron');
const Transaction = require('../models/Transaction');
const {
  PAYMENT_STATUS,
  getStatusQuery,
  logPayment,
  markPaymentFailure,
  syncTransactionWithPayOS,
} = require('../services/paymentProcessingService');

const initCronJobs = () => {
  cron.schedule('*/5 * * * *', async () => {
    console.log('[CRON] Starting PayOS status synchronization...');

    try {
      const pendingTxs = await Transaction.find({
        status: getStatusQuery(PAYMENT_STATUS.PENDING),
      }).limit(100);

      console.log(`[CRON] Found ${pendingTxs.length} pending transactions to check.`);

      for (const tx of pendingTxs) {
        try {
          await syncTransactionWithPayOS(tx, { source: 'CRON' });
        } catch (error) {
          console.error(`[CRON ERR] Failed to sync order ${tx.orderCode}:`, error.message);

          if (String(error.message).includes('101') || String(error.message).includes('not found')) {
            await markPaymentFailure(tx, PAYMENT_STATUS.CANCELLED, { source: 'CRON_NOT_FOUND' });
          }
        }
      }

      logPayment('PAYMENT_PENDING', { source: 'CRON_DONE', checked: pendingTxs.length });
    } catch (error) {
      console.error('[CRON ERROR]', error.message);
    }
  });

  console.log('[CRON] PayOS sync job scheduled (every 5 minutes)');
};

module.exports = {
  initCronJobs,
};
