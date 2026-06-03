const User = require('../models/User');
const minecraftService = require('../services/minecraftService');

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();
    if (user) {
      // Sync balance from Minecraft Server if username is linked
      if (user.minecraftUsername) {
        try {
          const gameBalance = await minecraftService.getPlayerBalance(user.minecraftUsername);
          user.balance = gameBalance; // Overwrite MongoDB balance for UI
        } catch (err) {
          console.warn('[PROFILE] Failed to fetch game balance:', err.message);
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
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Requirement 2: Prevents multiple changes if already linked
    if (user.minecraftUsername && user.minecraftUsername !== '' && req.user.role !== 'admin') {
      return res.status(400).json({ message: 'Tài khoản đã liên kết với nhân vật ' + user.minecraftUsername + '. Vui lòng liên hệ admin để thay đổi.' });
    }

    if (!minecraftUsername) {
      return res.status(400).json({ message: 'Vui lòng cung cấp tên nhân vật' });
    }

    // Requirement 1: Verify existence directly in server via RCON
    const verification = await minecraftService.verifyPlayerExists(minecraftUsername);
    if (!verification.exists) {
      return res.status(404).json({ message: 'Tên nhân vật không tồn tại trong server.' });
    }

    // Save with exact casing from server
    user.minecraftUsername = verification.realName || minecraftUsername;
    user.minecraftVerified = true;
    await user.save();

    // Fetch initial balance
    const balance = await minecraftService.getPlayerBalance(user.minecraftUsername);

    res.json({ 
      message: 'Liên kết tài khoản Minecraft thành công', 
      minecraftUsername: user.minecraftUsername,
      minecraftVerified: user.minecraftVerified,
      balance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
