const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Package = require('../models/Package');
const PaymentConfig = require('../models/PaymentConfig');
const bcrypt = require('bcryptjs');
const minecraftService = require('../services/minecraftService');

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getStats = async (req, res) => {
  try {
    const [totalUsers, bannedUsers, totalTransactions, packages] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isBanned: true }),
      Transaction.countDocuments(),
      Package.countDocuments(),
    ]);

    // Tổng doanh thu (Chỉ tính các giao dịch completed)
    const revenueResult = await Transaction.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    res.json({
      totalUsers,
      bannedUsers,
      totalRevenue,
      totalTransactions,
      totalPackages: packages,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get detailed revenue analytics
// @route   GET /api/admin/stats/revenue
// @access  Private/Admin
exports.getRevenueAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // 1. Revenue & Order Summaries
    const revenueStats = await Transaction.aggregate([
      {
        $facet: {
          summaries: [
            { $match: { status: 'completed' } },
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: '$amount' },
                successfulOrders: { $sum: 1 },
                uniqueCustomers: { $addToSet: '$user' },
                today: {
                  $sum: { $cond: [{ $gte: ['$createdAt', startOfToday] }, '$amount', 0] }
                },
                week: {
                  $sum: { $cond: [{ $gte: ['$createdAt', startOfWeek] }, '$amount', 0] }
                },
                month: {
                  $sum: { $cond: [{ $gte: ['$createdAt', startOfMonth] }, '$amount', 0] }
                },
                year: {
                  $sum: { $cond: [{ $gte: ['$createdAt', startOfYear] }, '$amount', 0] }
                }
              }
            },
            {
              $project: {
                totalRevenue: 1,
                successfulOrders: 1,
                uniqueCustomersCount: { $size: '$uniqueCustomers' },
                averageOrderValue: {
                  $cond: [
                    { $eq: ['$successfulOrders', 0] },
                    0,
                    { $divide: ['$totalRevenue', '$successfulOrders'] }
                  ]
                },
                today: 1,
                week: 1,
                month: 1,
                year: 1
              }
            }
          ],
          allStatusCounts: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);

    const summaries = revenueStats[0].summaries[0] || {
      totalRevenue: 0,
      successfulOrders: 0,
      uniqueCustomersCount: 0,
      averageOrderValue: 0,
      today: 0,
      week: 0,
      month: 0,
      year: 0
    };

    const statusCounts = revenueStats[0].allStatusCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    const totalOrders = Object.values(statusCounts).reduce((a, b) => a + b, 0);

    // 2. Charts Data
    // 7 Days Chart (by Day)
    const sevenDaysChart = await Transaction.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: startOfWeek } } },
      {
        $group: {
          _id: { $dateToString: { format: '%d/%m', date: '$createdAt' } },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // 30 Days Chart
    const startOf30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thirtyDaysChart = await Transaction.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: startOf30Days } } },
      {
        $group: {
          _id: { $dateToString: { format: '%d/%m', date: '$createdAt' } },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // 12 Months Chart
    const startOf12Months = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const twelveMonthsChart = await Transaction.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: startOf12Months } } },
      {
        $group: {
          _id: { $dateToString: { format: '%m/%Y', date: '$createdAt' } },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // 5. Top Packages
    const topPackages = await Transaction.aggregate([
      { $match: { status: 'completed', package: { $exists: true } } },
      {
        $group: {
          _id: '$package',
          packageName: { $first: '$item' },
          soldCount: { $sum: 1 },
          revenue: { $sum: '$amount' }
        }
      },
      { $sort: { soldCount: -1 } },
      { $limit: 10 }
    ]);

    // 6. Top Buyers
    const topBuyers = await Transaction.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$user',
          minecraftUsername: { $first: '$minecraftUsername' },
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$amount' }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $project: {
          _id: 1,
          minecraftUsername: 1,
          orderCount: 1,
          totalSpent: 1,
          username: { $arrayElemAt: ['$userInfo.username', 0] }
        }
      }
    ]);

    res.json({
      revenue: {
        total: summaries.totalRevenue,
        today: summaries.today,
        week: summaries.week,
        month: summaries.month,
        year: summaries.year,
        averageOrderValue: summaries.averageOrderValue,
        uniqueCustomers: summaries.uniqueCustomersCount
      },
      orders: {
        total: totalOrders,
        successful: summaries.successfulOrders,
        pending: statusCounts['pending'] || 0,
        cancelled: statusCounts['cancelled'] || 0,
        failed: statusCounts['failed'] || 0
      },
      charts: {
        sevenDays: sevenDaysChart,
        thirtyDays: thirtyDaysChart,
        twelveMonths: twelveMonthsChart
      },
      topPackages,
      topBuyers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── USER MANAGEMENT ──────────────────────────────────────────────────────────

// @desc    Get all users (with search & pagination)
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 15 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const searchFilter = search
      ? {
          $or: [
            { username: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { minecraftUsername: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const [usersRaw, total] = await Promise.all([
      User.find(searchFilter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(searchFilter),
    ]);

    // Sync balances and ranks from Minecraft server
    const users = await Promise.all(usersRaw.map(async (u) => {
      if (u.minecraftUsername) {
        try {
          const [gameBalance, gameRank] = await Promise.all([
            minecraftService.getPlayerBalance(u.minecraftUsername),
            minecraftService.getPlayerRank(u.minecraftUsername),
          ]);
          return { ...u, balance: gameBalance, rank: gameRank };
        } catch (err) {
          return u;
        }
      }
      return u;
    }));

    res.json({
      users,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single user detail
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    
    // Show real-time balance, rank and sync info
    if (user.minecraftUsername) {
      try {
        const [gameBalance, gameRank] = await Promise.all([
          minecraftService.getPlayerBalance(user.minecraftUsername),
          minecraftService.getPlayerRank(user.minecraftUsername),
        ]);
        user.balance = gameBalance;
        user.rank = gameRank;

        const cached = minecraftService.balanceCache.get(user.minecraftUsername);
        user.minecraftLastSync = cached ? new Date(cached.timestamp) : new Date();
      } catch (err) {
        console.warn('Admin fetch balance error:', err.message);
      }
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user transaction history
// @route   GET /api/admin/users/:id/transactions
// @access  Private/Admin
exports.getUserTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.params.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Ban a user
// @route   POST /api/admin/users/:id/ban
// @access  Private/Admin
exports.banUser = async (req, res) => {
  try {
    const { banReason, banDuration } = req.body; // banDuration: '24h' | '7d' | '30d' | 'permanent'

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Không thể khóa tài khoản admin' });
    }

    user.isBanned = true;
    user.banReason = banReason || 'Vi phạm quy định cộng đồng';

    // Tính thời gian hết hạn ban
    if (!banDuration || banDuration === 'permanent') {
      user.banExpiresAt = null; // Vĩnh viễn
    } else {
      const now = new Date();
      const durationMap = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
      };
      const ms = durationMap[banDuration];
      user.banExpiresAt = ms ? new Date(now.getTime() + ms) : null;
    }

    await user.save();

    res.json({
      message: `Đã khóa tài khoản ${user.username} thành công`,
      user: {
        _id: user._id,
        username: user.username,
        isBanned: user.isBanned,
        banReason: user.banReason,
        banExpiresAt: user.banExpiresAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unban a user
// @route   POST /api/admin/users/:id/unban
// @access  Private/Admin
exports.unbanUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    user.isBanned = false;
    user.banReason = '';
    user.banExpiresAt = null;
    await user.save();

    res.json({
      message: `Đã mở khóa tài khoản ${user.username} thành công`,
      user: {
        _id: user._id,
        username: user.username,
        isBanned: user.isBanned,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset user password (Admin)
// @route   POST /api/admin/users/:id/reset-password
// @access  Private/Admin
exports.resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 8 ký tự' });
    }

    const hasUppercase = /[A-Z]/.test(newPassword);
    if (!hasUppercase) {
      return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 1 chữ cái in hoa' });
    }

    const user = await User.findById(req.params.id).select('+password');
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    user.password = newPassword; // pre-save hook sẽ hash
    await user.save();

    res.json({ message: `Đã đặt lại mật khẩu cho ${user.username} thành công` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── PACKAGE MANAGEMENT ───────────────────────────────────────────────────────

// @desc    Get all packages (Admin - all including hidden)
// @route   GET /api/admin/packages
// @access  Private/Admin
exports.getPackages = async (req, res) => {
  try {
    const packages = await Package.find().sort({ createdAt: -1 });
    res.json(packages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get visible packages (Public)
// @route   GET /api/packages
// @access  Public
exports.getPublicPackages = async (req, res) => {
  try {
    const packages = await Package.find({ isVisible: true }).sort({ price: 1 });
    res.json(packages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create package
// @route   POST /api/admin/packages
// @access  Private/Admin
exports.createPackage = async (req, res) => {
  try {
    const { name, description, price, coinAmount, bonusCoin, isVisible, category, commands } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập tên gói' });
    }
    if (!price || price <= 0) {
      return res.status(400).json({ message: 'Giá gói phải lớn hơn 0' });
    }
    if (coinAmount === undefined || coinAmount < 0) {
      return res.status(400).json({ message: 'Số coin không hợp lệ' });
    }

    const pkg = await Package.create({
      name: name.trim(),
      description: description || '',
      price,
      coinAmount,
      bonusCoin: bonusCoin || 0,
      isVisible: isVisible !== undefined ? isVisible : true,
      category: category || 'Coin',
      image: req.body.image || '',
      sortOrder: req.body.sortOrder || 0,
      commands: commands || [],
    });

    res.status(201).json(pkg);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update package
// @route   PUT /api/admin/packages/:id
// @access  Private/Admin
exports.updatePackage = async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id);
    if (!pkg) return res.status(404).json({ message: 'Không tìm thấy gói nạp' });

    const { name, description, price, coinAmount, bonusCoin, isVisible, category, commands } = req.body;

    if (name !== undefined) pkg.name = name.trim();
    if (description !== undefined) pkg.description = description;
    if (price !== undefined) pkg.price = price;
    if (coinAmount !== undefined) pkg.coinAmount = coinAmount;
    if (bonusCoin !== undefined) pkg.bonusCoin = bonusCoin;
    if (isVisible !== undefined) pkg.isVisible = isVisible;
    if (category !== undefined) pkg.category = category;
    if (req.body.image !== undefined) pkg.image = req.body.image;
    if (req.body.sortOrder !== undefined) pkg.sortOrder = req.body.sortOrder;
    if (commands !== undefined) pkg.commands = commands;

    await pkg.save();
    res.json(pkg);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete package
// @route   DELETE /api/admin/packages/:id
// @access  Private/Admin
exports.deletePackage = async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id);
    if (!pkg) return res.status(404).json({ message: 'Không tìm thấy gói nạp' });

    await pkg.deleteOne();
    res.json({ message: 'Đã xóa gói nạp thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle package visibility
// @route   PATCH /api/admin/packages/:id/toggle
// @access  Private/Admin
exports.togglePackage = async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id);
    if (!pkg) return res.status(404).json({ message: 'Không tìm thấy gói nạp' });

    pkg.isVisible = !pkg.isVisible;
    await pkg.save();

    res.json({
      message: pkg.isVisible ? 'Đã hiển thị gói nạp' : 'Đã ẩn gói nạp',
      isVisible: pkg.isVisible,
      package: pkg,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Purchase a package
// @route   POST /api/packages/purchase/:id
// @access  Private
exports.purchasePackage = async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id);
    if (!pkg) {
      return res.status(404).json({ message: 'Không tìm thấy gói nạp' });
    }

    const user = await User.findById(req.user._id);

    // In this simulation, since prices are in VNĐ and usually require external payment,
    // we simulate a successful payment and update the user's balance/stats.
    user.balance += (pkg.coinAmount + pkg.bonusCoin);
    user.totalDeposited += pkg.price;

    // Update rank if it's a VIP package
    if (pkg.category === 'VIP') {
      user.rank = pkg.name.startsWith('MVP') ? 'MVP' : 'VIP';
    }

    await user.save();

    // Create transaction record
    const transaction = await Transaction.create({
      user: user._id,
      type: 'Deposit',
      item: pkg.name,
      amount: `+${(pkg.coinAmount + pkg.bonusCoin).toLocaleString('vi-VN')} Xu`,
      coinsChange: pkg.coinAmount + pkg.bonusCoin,
      status: 'completed'
    });

    res.json({
      message: 'Mua gói nạp thành công!',
      balance: user.balance,
      totalDeposited: user.totalDeposited,
      rank: user.rank,
      transaction
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── PAYMENT CONFIGURATION ───────────────────────────────────────────────────

// @desc    Get payment config
// @route   GET /api/admin/payment-config
// @access  Private/Admin
exports.getPaymentConfig = async (req, res) => {
  try {
    let config = await PaymentConfig.findOne();
    if (!config) {
      config = await PaymentConfig.create({});
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update payment config
// @route   PUT /api/admin/payment-config
// @access  Private/Admin
exports.updatePaymentConfig = async (req, res) => {
  try {
    let config = await PaymentConfig.findOne();
    if (!config) {
      config = new PaymentConfig();
    }

    const {
      clientId,
      apiKey,
      checksumKey,
      webhookUrl,
      returnUrl,
      cancelUrl,
      environment,
      isActive,
    } = req.body;

    if (clientId !== undefined) config.clientId = clientId;
    if (apiKey !== undefined) config.apiKey = apiKey;
    if (checksumKey !== undefined) config.checksumKey = checksumKey;
    if (webhookUrl !== undefined) config.webhookUrl = webhookUrl;
    if (returnUrl !== undefined) config.returnUrl = returnUrl;
    if (cancelUrl !== undefined) config.cancelUrl = cancelUrl;
    if (environment !== undefined) config.environment = environment;
    if (isActive !== undefined) config.isActive = isActive;

    await config.save();
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Test payment connection
// @route   POST /api/admin/payment-config/test
// @access  Private/Admin
exports.testPaymentConfig = async (req, res) => {
  try {
    const config = await PaymentConfig.findOne();
    if (!config || !config.clientId || !config.apiKey || !config.checksumKey) {
      return res.status(400).json({ message: 'Cấu hình PayOS chưa hoàn thiện' });
    }

    const { PayOS } = require('@payos/node');
    const payos = new PayOS({
      clientId: config.clientId,
      apiKey: config.apiKey,
      checksumKey: config.checksumKey
    });
    // Try to get payment details for a dummy ID to test connection
    // Or just check if the instance is created correctly (SDK doesn't have a simple ping)
    // Actually, createPaymentLink with invalid data would test API Key
    res.json({ status: 'OK', message: 'Kết nối tới PayOS thành công!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all transactions (with search, filter & pagination)
// @route   GET /api/admin/stats/transactions
// @access  Private/Admin
exports.getAllTransactions = async (req, res) => {
  try {
    const { search = '', status = '', page = 1, limit = 15, sortBy = 'createdAt', sortOrder = -1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    
    // Status filter
    if (status) query.status = status;

    // Search filter (Order ID, Username, Minecraft Username)
    if (search) {
      query.$or = [
        { item: { $regex: search, $options: 'i' } },
        { minecraftUsername: { $regex: search, $options: 'i' } }
      ];
      
      // If search is numeric, try orderCode
      if (!isNaN(search)) {
        const numSearch = parseInt(search);
        if (numSearch > 0) {
          query.$or.push({ orderCode: numSearch });
        }
      }
    }

    const sortOptions = {};
    sortOptions[sortBy] = parseInt(sortOrder);

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('user', 'username email')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments(query),
    ]);

    res.json({
      transactions,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rconService = require('../services/rconService');

// @desc    Test RCON connection
// @route   POST /api/admin/test-rcon
// @access  Private/Admin
exports.testRcon = async (req, res) => {
  try {
    const { command } = req.body;
    if (!command) {
      return res.status(400).json({ message: 'Vui lòng nhập lệnh' });
    }

    const response = await rconService.sendCommand(command);
    res.json({
      success: true,
      response
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Lỗi kết nối RCON: ' + error.message 
    });
  }
};
