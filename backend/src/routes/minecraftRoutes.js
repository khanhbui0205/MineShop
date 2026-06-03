const express = require('express');
const router = express.Router();
const { getPlayerBalance, verifyPlayer } = require('../controllers/minecraftController');
const { protect } = require('../middleware/authMiddleware');

router.get('/balance/:username', protect, getPlayerBalance);
router.post('/verify', protect, verifyPlayer);

module.exports = router;
