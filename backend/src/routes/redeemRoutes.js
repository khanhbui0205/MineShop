const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { redeemCode, getRedeemHistory } = require('../controllers/redeemController');

router.post('/', protect, redeemCode);
router.get('/history', protect, getRedeemHistory);

module.exports = router;
