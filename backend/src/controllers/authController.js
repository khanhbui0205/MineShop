const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { username, email, phoneNumber, password } = req.body;

    // Validation: username
    if (!username || username.trim().length < 3) {
      return res.status(400).json({ message: 'Tên người dùng phải có ít nhất 3 ký tự' });
    }

    // Validation: email
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ message: 'Định dạng email không hợp lệ' });
    }

    // Validation: phone (nếu có)
    if (phoneNumber && phoneNumber.trim()) {
      const vnPhoneRegex = /^(0|\+84)(3[2-9]|5[6-9]|7[0-9]|8[1-9]|9[0-9])[0-9]{7}$/;
      if (!vnPhoneRegex.test(phoneNumber.trim())) {
        return res.status(400).json({ message: 'Số điện thoại không đúng định dạng Việt Nam' });
      }
    }

    // Validation: password
    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 8 ký tự' });
    }

    const hasUppercase = /[A-Z]/.test(password);
    if (!hasUppercase) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 1 chữ cái in hoa' });
    }

    // Check unique
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      if (userExists.email === email) {
        return res.status(400).json({ message: 'Email này đã được đăng ký' });
      }
      return res.status(400).json({ message: 'Tên người dùng này đã tồn tại' });
    }

    const user = await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      phoneNumber: phoneNumber ? phoneNumber.trim() : '',
      password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        balance: user.balance,
        createdAt: user.createdAt,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Dữ liệu người dùng không hợp lệ' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // Login can be via email or username
    const user = await User.findOne({
      $or: [
        { email: email || '' },
        { username: username || email || '' },
      ],
    }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Email/tên đăng nhập hoặc mật khẩu không đúng' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email/tên đăng nhập hoặc mật khẩu không đúng' });
    }

    // Check ban
    if (user.isBanned) {
      // Kiểm tra ban có hết hạn chưa
      if (user.banExpiresAt && new Date() > new Date(user.banExpiresAt)) {
        // Tự động unban
        user.isBanned = false;
        user.banReason = '';
        user.banExpiresAt = null;
        await user.save();
      } else {
        return res.status(403).json({
          message: 'Tài khoản của bạn đã bị khóa',
          banReason: user.banReason,
          banExpiresAt: user.banExpiresAt,
          isBanned: true,
        });
      }
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

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
      isBanned: user.isBanned,
      createdAt: user.createdAt,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
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
        isBanned: user.isBanned,
        banReason: user.banReason,
        createdAt: user.createdAt,
      });
    } else {
      res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
  res.status(200).json({ message: 'Đăng xuất thành công' });
};
