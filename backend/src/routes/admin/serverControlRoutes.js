const express = require('express');
const router = express.Router();
const { executeCommand, getServerStatus, getCommandHistory } = require('../../controllers/admin/serverControlController');
const { protect, admin } = require('../../middleware/authMiddleware');

router.use(protect);
router.use(admin);

router.post('/execute', executeCommand);
router.get('/status', getServerStatus);
router.get('/history', getCommandHistory);

module.exports = router;
