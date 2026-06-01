const express = require('express');
const router = express.Router();
const {
  createPayment,
  handleWebhook,
  getPaymentStatus,
  getPaymentHistory,
  getPaymentById,
  resumePayment,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// Public Webhook (PayOS calls this)
router.post('/webhook', handleWebhook);

// Protected routes
router.post('/create', protect, createPayment);
router.get('/status/:orderCode', protect, getPaymentStatus);
router.get('/history', protect, getPaymentHistory);
router.get('/resume/:id', protect, resumePayment);
router.get('/:id', protect, getPaymentById);

module.exports = router;
