const User = require('../models/User');
const { resolveMinecraftUsername } = require('../utils/userHelpers');
const { syncUserGameProfile } = require('../services/userRankSyncService');
const { resolveStoredRank } = require('../services/rankService');

// @desc    Get current user profile
// @route   GET /api/profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    console.log(`[PROFILE] getProfile entry: user=${req.user?._id || '(empty)'}`);
    res.set('Cache-Control', 'no-store');

    const user = await User.findById(req.user._id).lean();
    if (user) {
      const minecraftUsername = resolveMinecraftUsername(user);
      console.log(`[PROFILE] Loaded user profile: username=${user.username}, minecraftUsername=${minecraftUsername || '(empty)'}`);
      const storedRank = resolveStoredRank(user.rank);
      user.rank = storedRank.rank;
      user.rankKey = storedRank.rankKey;

      // Sync balance & rank from Minecraft Server if username is linked
      if (minecraftUsername) {
        try {
          const forceRefresh = req.query.syncFresh === '1' || req.query.syncFresh === 'true' || req.query.forceRefresh === '1';
          console.log(`[PROFILE] Syncing game profile for ${minecraftUsername}${forceRefresh ? ' with force refresh' : ''}`);
          const gameProfile = await syncUserGameProfile(user, { forceRefresh });
          console.log(`[PROFILE] Synced game profile for ${minecraftUsername}: balance=${gameProfile.balance}, rank=${gameProfile.rank}`);
          user.balance = gameProfile.balance;
          user.rank = gameProfile.rank;
          user.rankKey = gameProfile.rankKey;
        } catch (err) {
          console.warn('[PROFILE] Failed to fetch game data:', err.message);
        }
      }

      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        balance: user.balance,
        totalDeposited: user.totalDeposited,
        rank: user.rank,
        rankKey: user.rankKey || 'default',
        battlePassLevel: user.battlePassLevel,
        battlePassXp: user.battlePassXp,
        minecraftUsername,
        minecraftVerified: user.minecraftVerified ?? Boolean(minecraftUsername),
        isBanned: user.isBanned,
        createdAt: user.createdAt,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Claim daily reward
// @route   POST /api/users/claim-daily
// @access  Private
exports.claimDaily = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // In a real app, check if already claimed today
    // For now, just add balance
    user.balance += 5;
    await user.save();

    res.json({ message: 'Daily reward claimed', balance: user.balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Deposit coins
// @route   POST /api/users/deposit
// @access  Private
exports.deposit = async (req, res) => {
  try {
    const { amount, coins } = req.body;
    const user = await User.findById(req.user._id);
    
    user.balance += coins;
    user.totalDeposited += amount;
    await user.save();

    res.json({ message: 'Deposit successful', balance: user.balance, totalDeposited: user.totalDeposited });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change user password
// @route   PUT /api/users/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 8 ký tự' });
    }

    if (!/\d/.test(newPassword)) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải chứa ít nhất một chữ số' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác' });
    }

    // Update password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
