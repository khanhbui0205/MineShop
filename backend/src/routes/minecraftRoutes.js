const express = require('express');
const router = express.Router();
const { getPlayerBalance, verifyPlayer, checkPlayer } = require('../controllers/minecraftController');
const { protect } = require('../middleware/authMiddleware');

// GET balance of a player — requires login, only own balance or admin
router.get('/balance/:username', protect, getPlayerBalance);

// POST verify a player exists — requires login (e.g. when linking account)
router.post('/verify', protect, verifyPlayer);

// POST check if player exists on server — NO auth required (used in purchase flow before login)
router.post('/check-player', checkPlayer);

module.exports = router;
