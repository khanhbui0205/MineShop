const User = require('../models/User');
const minecraftService = require('../services/minecraftService');
const { resolveMinecraftUsername } = require('../utils/userHelpers');

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();
    if (user) {
      const minecraftUsername = resolveMinecraftUsername(user);

      // Sync balance & rank from Minecraft Server if username is linked
      if (minecraftUsername) {
        try {
          const [gameBalance, gameRank] = await Promise.all([
            minecraftService.getPlayerBalance(minecraftUsername),
            minecraftService.getPlayerRank(minecraftUsername)
          ]);
          user.balance = gameBalance;
          user.rank = gameRank; // Overwrite for real-time display
        } catch (err) {
          console.warn('[PROFILE] Failed to fetch game data:', err.message);
        }
      }

      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        balance: user.balance,
        totalDeposited: user.totalDeposited,
        rank: user.rank,
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
