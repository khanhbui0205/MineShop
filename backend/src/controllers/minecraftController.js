const minecraftService = require('../services/minecraftService');
const User = require('../models/User');
const { resolveMinecraftUsername } = require('../utils/userHelpers');
const { processPendingRewardsForUsername, PLAYER_NAME_REGEX } = require('../services/rewardService');
const { syncUserRankFromMinecraft } = require('../services/userRankSyncService');
const rankService = require('../services/rankService');

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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

// @desc    Get Minecraft player rank from balance prefix and sync it to web account
// @route   GET /api/minecraft/rank/:username
// @access  Private
exports.getPlayerRank = async (req, res) => {
  try {
    const { username } = req.params;

    const linkedMcName = resolveMinecraftUsername(req.user);
    if (
      req.user.role !== 'admin'
      && linkedMcName.toLowerCase() !== username.toLowerCase()
    ) {
      return res.status(403).json({ success: false, message: 'Khong co quyen truy cap rank nay' });
    }

    let rankInfo;
    if (req.user.role !== 'admin') {
      rankInfo = await syncUserRankFromMinecraft(req.user);
    } else {
      const linkedUser = await User.findOne({
        $or: [
          { minecraftUsername: { $regex: new RegExp(`^${escapeRegex(username)}$`, 'i') } },
          { username: { $regex: new RegExp(`^${escapeRegex(username)}$`, 'i') } },
        ],
      });

      try {
        rankInfo = await minecraftService.getPlayerBalanceProfile(username);
        if (linkedUser && rankInfo?.rank) {
          await User.updateOne({ _id: linkedUser._id }, { $set: { rank: rankInfo.rank } });
        }
      } catch (error) {
        console.warn(`[MINECRAFT CONTROLLER] Rank prefix fallback for ${username}: ${error.message}`);
        rankInfo = rankService.resolveStoredRank(linkedUser?.rank);
      }
    }

    res.json({
      success: true,
      username,
      rank: rankInfo.rank,
      rankKey: rankInfo.rankKey,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[MINECRAFT CONTROLLER] getPlayerRank error:', error.message);
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

    // Step 2: Cross-verify with balance and rank prefix
    let balance = 0;
    let rank = 'Member';
    try {
      const profile = await minecraftService.getPlayerBalanceProfile(result.realName);
      balance = profile.balance;
      rank = profile.rank;
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

// @desc    Process pending rewards when a Minecraft player logs in
// @route   POST /api/minecraft/player-login
// @access  Server webhook (guarded by MINECRAFT_WEBHOOK_SECRET when configured)
exports.handlePlayerLogin = async (req, res) => {
  try {
    const configuredSecret = process.env.MINECRAFT_WEBHOOK_SECRET;
    if (configuredSecret) {
      const providedSecret = req.headers['x-minecraft-secret'] || req.body.secret;
      if (providedSecret !== configuredSecret) {
        return res.status(401).json({ success: false, message: 'Unauthorized Minecraft webhook' });
      }
    }

    const username = String(req.body.username || req.body.playerName || '').trim();
    if (!PLAYER_NAME_REGEX.test(username)) {
      return res.status(400).json({ success: false, message: 'Username Minecraft khong hop le' });
    }

    const result = await processPendingRewardsForUsername(username);
    res.json({
      success: true,
      username,
      ...result,
    });
  } catch (error) {
    console.error('[MINECRAFT CONTROLLER] handlePlayerLogin error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
