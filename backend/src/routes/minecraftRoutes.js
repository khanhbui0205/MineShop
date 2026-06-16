const express = require('express');
const router = express.Router();
const { getPlayerBalance, checkPlayer } = require('../controllers/minecraftController');
const { protect } = require('../middleware/authMiddleware');

// GET balance of a player — requires login, only own balance or admin
router.get('/balance/:username', protect, getPlayerBalance);

// POST check if player exists on server — used during registration pre-check
router.post('/check-player', checkPlayer);

module.exports = router;
