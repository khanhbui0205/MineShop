const User = require('../models/User');
const minecraftService = require('../services/minecraftService');

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();
    if (user) {
      // Sync balance & rank from Minecraft Server if username is linked
      if (user.minecraftUsername) {
        try {
          const [gameBalance, gameRank] = await Promise.all([
            minecraftService.getPlayerBalance(user.minecraftUsername),
            minecraftService.getPlayerRank(user.minecraftUsername)
          ]);
          user.balance = gameBalance;
          user.rank = gameRank; // Overwrite for real-time display
        } catch (err) {
          console.warn('[PROFILE] Failed to fetch game data:', err.message);
        }
      }
      res.json(user);
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

// @desc    Link Minecraft account
// @route   POST /api/users/link-minecraft
// @access  Private
exports.linkMinecraft = async (req, res) => {
  try {
    const { minecraftUsername } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    if (!minecraftUsername) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tên nhân vật' });
    }

    // Requirement 2 & 3: Check if this username is already linked TO ANOTHER ACCOUNT
    // Case-insensitive check
    const existingUser = await User.findOne({ 
      minecraftUsername: { $regex: new RegExp(`^${minecraftUsername}$`, 'i') } 
    });

    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: "USERNAME_ALREADY_REGISTERED",
        message: "Tên nhân vật này đã được liên kết với tài khoản khác."
      });
    }

    // Requirement 4: Verify existence directly in server via RCON
    const verification = await minecraftService.verifyPlayerExists(minecraftUsername);
    if (!verification.exists) {
      return res.status(404).json({ 
        success: false,
        error: "PLAYER_NOT_FOUND",
        message: 'Nhân vật không tồn tại trong server.' 
      });
    }

    // Save with exact casing from server
    user.minecraftUsername = verification.realName || minecraftUsername;
    user.minecraftVerified = true;
    await user.save();

    // Fetch initial balance & rank
    const [balance, rank] = await Promise.all([
      minecraftService.getPlayerBalance(user.minecraftUsername),
      minecraftService.getPlayerRank(user.minecraftUsername)
    ]);

    res.json({ 
      success: true,
      message: 'Liên kết tài khoản Minecraft thành công', 
      minecraftUsername: user.minecraftUsername,
      minecraftVerified: user.minecraftVerified,
      balance,
      rank
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        error: "USERNAME_ALREADY_REGISTERED",
        message: 'Tên nhân vật này đã được liên kết với tài khoản khác.' 
      });
    }
    res.status(500).json({ success: false, message: error.message });
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
