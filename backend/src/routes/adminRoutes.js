const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getStats,
  getRevenueAnalytics,
  getUsers,
  getUserById,
  getUserTransactions,
  banUser,
  unbanUser,
  resetPassword,
  getPackages,
  createPackage,
  updatePackage,
  deletePackage,
  togglePackage,
  getPaymentConfig,
  updatePaymentConfig,
  testPaymentConfig,
  getAllTransactions,
  testRcon,
} = require('../controllers/adminController');
const { createNotification } = require('../controllers/notificationController');
const {
  getCodes,
  createCode,
  updateCode,
  deleteCode,
} = require('../controllers/adminRedeemController');

// Tất cả routes admin đều cần xác thực + quyền admin
router.use(protect, admin);

// ─── Stats ─────────────────────────────
router.get('/stats', getStats);
router.get('/stats/revenue', getRevenueAnalytics);
router.get('/stats/transactions', getAllTransactions);

// ─── User Management ───────────────────
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.get('/users/:id/transactions', getUserTransactions);
router.post('/users/:id/ban', banUser);
router.post('/users/:id/unban', unbanUser);
router.post('/users/:id/reset-password', resetPassword);

// ─── Package Management ─────────────────
router.get('/packages', getPackages);
router.post('/packages', createPackage);
router.put('/packages/:id', updatePackage);
router.delete('/packages/:id', deletePackage);
router.patch('/packages/:id/toggle', togglePackage);

// ─── Payment Config ─────────────────────
router.get('/payment-config', getPaymentConfig);
router.put('/payment-config', updatePaymentConfig);
router.post('/payment-config/test', testPaymentConfig);
router.post('/test-rcon', testRcon);

// Redeem code management
router.get('/codes', getCodes);
router.post('/codes', createCode);
router.put('/codes/:id', updateCode);
router.delete('/codes/:id', deleteCode);

// Notifications
router.post('/notifications', createNotification);

module.exports = router;
