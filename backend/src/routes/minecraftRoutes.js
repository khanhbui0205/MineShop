const express = require('express');
const router = express.Router();
const { checkPlayer, verifyPlayer } = require('../controllers/minecraftController');
const { protect } = require('../middleware/authMiddleware');

router.post('/check-player', protect, checkPlayer);
router.get('/check-player/:username', protect, checkPlayer);
router.post('/verify-player', protect, verifyPlayer);

module.exports = router;
