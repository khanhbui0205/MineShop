const User = require('../models/User');

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
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
