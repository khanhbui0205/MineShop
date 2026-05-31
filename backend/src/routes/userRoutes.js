const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getProfile, claimDaily, deposit } = require('../controllers/userController');

router.get('/profile', protect, getProfile);
router.post('/claim-daily', protect, claimDaily);
router.post('/deposit', protect, deposit);

module.exports = router;
