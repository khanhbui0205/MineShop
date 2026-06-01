const express = require('express');
const router = express.Router();
const { checkPlayer } = require('../controllers/minecraftController');
const { protect } = require('../middleware/authMiddleware');

router.post('/check-player', protect, checkPlayer);

module.exports = router;
