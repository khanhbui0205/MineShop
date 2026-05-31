const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getStoreItems,
  purchaseItem,
  getTransactions,
  seedStore,
} = require('../controllers/storeController');

router.get('/', getStoreItems);
router.post('/purchase/:id', protect, purchaseItem);
router.get('/transactions', protect, getTransactions);
router.post('/seed', protect, admin, seedStore);

module.exports = router;
