const express = require('express');
const router = express.Router();
const {
  createPayment,
  handleWebhook,
  getPaymentStatus,
  getPaymentHistory,
  getMonthlyTopDonators,
  getPaymentById,
  resumePayment,
  checkPaymentStatus
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// Public Webhook (PayOS calls this)
router.post('/webhook', handleWebhook);
router.get('/webhook', (req, res) => {
  res.json({
    success: true,
    message: 'PayOS webhook endpoint is online. Use POST for payment notifications.',
  });
});

// Protected routes
router.post('/create', protect, createPayment);
router.get('/status/:orderCode', protect, getPaymentStatus);
router.get('/check/:orderCode', protect, checkPaymentStatus);
router.get('/history', protect, getPaymentHistory);
router.get('/top-donators/monthly', protect, getMonthlyTopDonators);
router.get('/resume/:id', protect, resumePayment);
router.get('/:id', protect, getPaymentById);

module.exports = router;
