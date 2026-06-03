const minecraftService = require('../services/minecraftService');
const User = require('../models/User');

// @desc    Get Minecraft player balance
// @route   GET /api/minecraft/balance/:username
// @access  Private
exports.getPlayerBalance = async (req, res) => {
  try {
    const { username } = req.params;
    
    // Safety check: only allow users to check their own balance OR admin
    if (req.user.role !== 'admin' && req.user.minecraftUsername !== username) {
      return res.status(403).json({ message: 'Không có quyền truy cập số dư này' });
    }

    const balance = await minecraftService.getPlayerBalance(username);
    
    res.json({
      success: true,
      username,
      balance
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Minecraft player existence
// @route   POST /api/minecraft/verify
// @access  Private
exports.verifyPlayer = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
        return res.status(400).json({ message: 'Vui lòng cung cấp tên nhân vật' });
    }

    const result = await minecraftService.verifyPlayerExists(username);
    
    if (!result.exists) {
      return res.status(404).json({ exists: false, message: 'Tên nhân vật không tồn tại trong server.' });
    }

    res.json({
      exists: true,
      realName: result.realName,
      message: 'Xác minh nhân vật thành công'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
