const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getProfile, claimDaily, deposit, linkMinecraft } = require('../controllers/userController');

router.get('/profile', protect, getProfile);
router.post('/claim-daily', protect, claimDaily);
router.post('/deposit', protect, deposit);
router.post('/link-minecraft', protect, linkMinecraft);

module.exports = router;
