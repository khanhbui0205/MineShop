const minecraftService = require('../services/minecraftService');
const User = require('../models/User');
const { resolveMinecraftUsername } = require('../utils/userHelpers');

// @desc    Get Minecraft player balance (verify player exists first)
// @route   GET /api/minecraft/balance/:username
// @access  Private
exports.getPlayerBalance = async (req, res) => {
  try {
    const { username } = req.params;

    const linkedMcName = resolveMinecraftUsername(req.user);
    if (
      req.user.role !== 'admin'
      && linkedMcName.toLowerCase() !== username.toLowerCase()
    ) {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập số dư này' });
    }

    // Step 1: Verify player exists on the server first
    const verification = await minecraftService.verifyPlayerExists(username);
    if (!verification.exists) {
      return res.status(404).json({ success: false, message: 'Nhân vật không tồn tại trên server.' });
    }

    // Step 2: Get real-time balance from server
    const balance = await minecraftService.getPlayerBalance(verification.realName);

    res.json({
      success: true,
      username: verification.realName,
      balance,
      syncedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[MINECRAFT CONTROLLER] getPlayerBalance error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Minecraft player existence (requires login)
// @route   POST /api/minecraft/verify
// @access  Private
exports.verifyPlayer = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ success: false, playerExists: false, error: 'MISSING_USERNAME' });
    }

    // Check if duplicate in database first
    const existingUser = await User.findOne({ 
      minecraftUsername: { $regex: new RegExp(`^${username}$`, 'i') } 
    });
    
    if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        playerExists: false,
        error: "USERNAME_ALREADY_REGISTERED",
        message: 'Tên nhân vật này đã được liên kết với tài khoản khác.'
      });
    }

    const result = await minecraftService.verifyPlayerExists(username);

    if (!result.exists) {
      return res.status(404).json({ 
        success: false, 
        playerExists: false, 
        error: 'PLAYER_NOT_FOUND',
        message: 'Tên nhân vật không tồn tại trong server.' 
      });
    }

    // Cross-check with balance to ensure absolute existence (prevents false positives)
    try {
      await minecraftService.getPlayerBalance(result.realName);
    } catch (err) {
      if (err.message === 'PLAYER_NOT_FOUND') {
        return res.status(404).json({ 
          success: false, 
          playerExists: false, 
          error: 'PLAYER_NOT_FOUND',
          message: 'Tên nhân vật không tồn tại trong hệ thống server.' 
        });
      }
    }

    res.json({
      success: true,
      playerExists: true,
      username: result.realName,
      message: 'Xác minh nhân vật thành công'
    });
  } catch (error) {
    console.error('[MINECRAFT CONTROLLER] verifyPlayer error:', error.message);
    res.status(500).json({ success: false, playerExists: false, error: 'SERVER_ERROR', message: error.message });
  }
};

// @desc    Check if a player exists on the server (no auth required — used in purchase flow)
// @route   POST /api/minecraft/check-player
// @access  Public
exports.checkPlayer = async (req, res) => {
  try {
    const { playerName } = req.body;
    if (!playerName) {
      return res.status(400).json({ success: false, playerExists: false, error: 'MISSING_PLAYERNAME' });
    }

    console.log(`[MINECRAFT CONTROLLER] Check Player Request: ${playerName}`);

    // Check if Minecraft username is already registered to another website account
    const existingUser = await User.findOne({
      minecraftUsername: { $regex: new RegExp(`^${playerName}$`, 'i') },
    });
    const isRegistered = !!existingUser;

    const result = await minecraftService.verifyPlayerExists(playerName);

    if (!result.exists) {
      console.log(`[MINECRAFT CONTROLLER] Check Player Reject: ${playerName} (Reason: NOT_FOUND in search)`);
      return res.status(404).json({
        success: false,
        playerExists: false,
        error: 'PLAYER_NOT_FOUND',
        message: 'Nhân vật không tồn tại trên server.'
      });
    }

    // Step 2: Cross-verify with balance (Essential for catching logic failures)
    let balance = 0;
    let rank = 'Member';
    try {
      const [bal, rnk] = await Promise.all([
        minecraftService.getPlayerBalance(result.realName),
        minecraftService.getPlayerRank(result.realName)
      ]);
      balance = bal;
      rank = rnk;
    } catch (err) {
      if (err.message === 'PLAYER_NOT_FOUND') {
        console.log(`[MINECRAFT CONTROLLER] Check Player Reject: ${result.realName} (Reason: NOT_FOUND in balance cross-check)`);
        return res.status(404).json({
          success: false,
          playerExists: false,
          error: 'PLAYER_NOT_FOUND',
          message: 'Nhân vật không tồn tại trên hệ thống server.'
        });
      }
    }

    console.log(`[MINECRAFT CONTROLLER] Check Player Success: ${result.realName}`);
    res.json({
      success: true,
      playerExists: true,
      username: result.realName,
      balance,
      rank,
      isRegistered,
      message: `Nhân vật ${result.realName} đã được xác nhận`
    });
  } catch (error) {
    console.error('[MINECRAFT CONTROLLER] checkPlayer error:', error.message);
    res.status(500).json({ success: false, playerExists: false, error: 'SERVER_ERROR' });
  }
};
