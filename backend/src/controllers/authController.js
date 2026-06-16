const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const minecraftService = require('../services/minecraftService');
const { resolveMinecraftUsername } = require('../utils/userHelpers');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { username, email, password, minecraftUsername: mcUsernameInput } = req.body;
    const minecraftUsername = (mcUsernameInput || username || '').trim();

    // Validation: username
    if (!username || username.trim().length < 3) {
      return res.status(400).json({ message: 'Tên người dùng phải có ít nhất 3 ký tự' });
    }

    if (!minecraftUsername || minecraftUsername.length < 3) {
      return res.status(400).json({ message: 'Vui lòng nhập tên Minecraft hợp lệ' });
    }

    // Validation: email
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ message: 'Định dạng email không hợp lệ' });
    }

    // Validation: password
    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 8 ký tự' });
    }

    const hasUppercase = /[A-Z]/.test(password);
    if (!hasUppercase) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 1 chữ cái in hoa' });
    }

    // Check unique portal credentials
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      if (userExists.email === email) {
        return res.status(400).json({ message: 'Email này đã được đăng ký' });
      }
      return res.status(400).json({ message: 'Tên người dùng này đã tồn tại' });
    }

    // Check Minecraft username is not already linked to another account
    const mcTaken = await User.findOne({
      minecraftUsername: { $regex: new RegExp(`^${minecraftUsername}$`, 'i') },
    });
    if (mcTaken) {
      return res.status(400).json({
        error: 'USERNAME_ALREADY_REGISTERED',
        message: 'This Minecraft account is already registered.',
      });
    }

    // Verify player exists on Minecraft server
    const verification = await minecraftService.verifyPlayerExists(minecraftUsername);
    if (!verification.exists) {
      return res.status(404).json({
        error: 'PLAYER_NOT_FOUND',
        message: 'Nhân vật không tồn tại trên server. Bạn phải tham gia server ít nhất một lần.',
      });
    }

    try {
      await minecraftService.getPlayerBalance(verification.realName);
    } catch (err) {
      if (err.message === 'PLAYER_NOT_FOUND') {
        return res.status(404).json({
          error: 'PLAYER_NOT_FOUND',
          message: 'Nhân vật không tồn tại trên hệ thống server.',
        });
      }
    }

    const verifiedMcName = verification.realName || minecraftUsername;

    const user = await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password,
      minecraftUsername: verifiedMcName,
      minecraftVerified: true,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        balance: user.balance,
        minecraftUsername: user.minecraftUsername,
        minecraftVerified: user.minecraftVerified,
        createdAt: user.createdAt,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Dữ liệu người dùng không hợp lệ' });
    }
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'USERNAME_ALREADY_REGISTERED',
        message: 'This Minecraft account is already registered.',
      });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Vui lòng nhập mật khẩu' });
    }

    const loginId = (username || email || '').trim();
    if (!loginId) {
      return res.status(400).json({ message: 'Vui lòng nhập email hoặc tên đăng nhập' });
    }

    // Login can be via email or username
    const user = await User.findOne({
      $or: [
        { email: loginId.toLowerCase() },
        { username: loginId },
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
      if (user.banExpiresAt && new Date() > new Date(user.banExpiresAt)) {
        await User.updateOne(
          { _id: user._id },
          { $set: { isBanned: false, banReason: '', banExpiresAt: null } }
        );
        user.isBanned = false;
        user.banReason = '';
        user.banExpiresAt = null;
      } else {
        return res.status(403).json({
          message: 'Tài khoản của bạn đã bị khóa',
          banReason: user.banReason,
          banExpiresAt: user.banExpiresAt,
          isBanned: true,
        });
      }
    }

    // Update last login without full document save (avoids validation issues on legacy accounts)
    const lastLoginAt = new Date();
    await User.updateOne({ _id: user._id }, { $set: { lastLoginAt } });
    user.lastLoginAt = lastLoginAt;

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      balance: user.balance,
      totalDeposited: user.totalDeposited,
      rank: user.rank,
      battlePassLevel: user.battlePassLevel,
      battlePassXp: user.battlePassXp,
      minecraftUsername: resolveMinecraftUsername(user),
      minecraftVerified: user.minecraftVerified ?? Boolean(resolveMinecraftUsername(user)),
      isBanned: user.isBanned,
      createdAt: user.createdAt,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('[AUTH] Login error:', error);
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
      const minecraftUsername = resolveMinecraftUsername(user);
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        balance: user.balance,
        totalDeposited: user.totalDeposited,
        rank: user.rank,
        battlePassLevel: user.battlePassLevel,
        battlePassXp: user.battlePassXp,
        minecraftUsername,
        minecraftVerified: user.minecraftVerified ?? Boolean(minecraftUsername),
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
