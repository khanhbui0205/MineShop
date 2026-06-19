const express = require('express');
const router = express.Router();
const { getPlayerBalance, getPlayerRank, checkPlayer, handlePlayerLogin } = require('../controllers/minecraftController');
const { protect } = require('../middleware/authMiddleware');

// GET balance of a player — requires login, only own balance or admin
router.get('/balance/:username', protect, getPlayerBalance);
router.get('/rank/:username', protect, getPlayerRank);

// POST check if player exists on server — used during registration pre-check
router.post('/check-player', checkPlayer);
router.post('/player-login', handlePlayerLogin);

module.exports = router;
