const StoreItem = require('../models/StoreItem');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// @desc    Get all store items
// @route   GET /api/store
// @access  Public
exports.getStoreItems = async (req, res) => {
  try {
    const items = await StoreItem.find();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Purchase an item
// @route   POST /api/store/purchase/:id
// @access  Private
exports.purchaseItem = async (req, res) => {
  try {
    const item = await StoreItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const user = await User.findById(req.user._id);

    if (item.currency === 'Coins') {
      if (user.balance < item.price) {
        return res.status(400).json({ message: 'Insufficient balance' });
      }
      user.balance -= item.price;
    } else {
      // For USD items, we assume payment is handled through a provider elsewhere
      // and just record the deposit in this demo flow
      user.totalDeposited += item.price;
      // Many USD items in the mock give coins (e.g. 500 Coins pack)
      if (item.type === 'Coins') {
        const coinsProfit = item.id === 'coins-pack-2' ? 1250 : 500; // Simplified
        user.balance += coinsProfit;
      }
    }

    // Update user rank if it's a rank item
    if (item.type === 'Rank') {
      user.rank = item.name.split(' ')[0]; // Simplified rank extraction
    }

    await user.save();

    // Create transaction record
    const transaction = await Transaction.create({
      user: user._id,
      type: item.currency === 'Coins' ? 'Store Purchase' : 'Deposit',
      item: item.name,
      amount: item.currency === 'Coins' ? `-${item.price} Coins` : `+$${item.price.toFixed(2)}`,
      coinsChange: item.currency === 'Coins' ? -item.price : (item.type === 'Coins' ? (item.price === 10 ? 1250 : 500) : 0),
      status: 'completed'
    });

    res.json({
      message: 'Purchase successful',
      balance: user.balance,
      totalDeposited: user.totalDeposited,
      rank: user.rank,
      transaction
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user transactions
// @route   GET /api/store/transactions
// @access  Private
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Seed store items (Admin only)
// @route   POST /api/store/seed
// @access  Private/Admin
exports.seedStore = async (req, res) => {
  try {
    const items = [
      {
        name: 'VIP Rank',
        description: 'Quyền lợi cơ bản: prefix [VIP], /heal cá nhân và nhân đôi điểm vote.',
        price: 300,
        currency: 'Coins',
        badge: 'Popular',
        icon: 'Award',
        type: 'Rank',
      },
      {
        name: 'MVP Rank',
        description: 'Quyền lợi tầm trung: prefix [MVP], màu chữ chat nổi bật, lệnh /fly tại sảnh.',
        price: 650,
        currency: 'Coins',
        badge: 'Hot Choice',
        icon: 'Award',
        type: 'Rank',
      },
      {
        name: 'MVP+ Rank Premium',
        description: 'Quyền lợi tối cao: prefix [MVP+], đổi màu da súng/giáp, lệnh /fly toàn server và sảnh VIP.',
        price: 1200,
        currency: 'Coins',
        badge: 'Ultimate VIP',
        icon: 'Award',
        type: 'Rank',
      },
      {
        name: 'Battle Pass Golden',
        description: 'Kích hoạt Battle Pass mùa mới, mở khóa 100 cấp phần thưởng độc quyền cực phẩm.',
        price: 450,
        currency: 'Coins',
        badge: 'Seasonal',
        icon: 'Sparkles',
        type: 'BattlePass',
      },
      {
        name: 'Cosmic Emerald Sword Skin',
        description: 'Skin Kiếm Ngọc Lục Bảo vũ trụ với hiệu ứng phát sáng dải ngân hà kỳ ảo.',
        price: 350,
        currency: 'Coins',
        badge: 'Limited',
        icon: 'Swords',
        type: 'Cosmetic',
      },
      {
        name: '500 Coins Emerald Chest',
        description: 'Kho báu bao gồm 500 Coins chuyển trực tiếp vào tài khoản server.',
        price: 5.00,
        currency: 'USD',
        badge: '+10% Bonus',
        icon: 'Coins',
        type: 'Coins',
      },
      {
        name: '1250 Coins Emerald Mountain',
        description: 'Rương siêu khổng lồ chứa 1250 Coins cùng đặc quyền ưu tiên hỗ trợ đặc biệt.',
        price: 10.00,
        currency: 'USD',
        badge: '+25% Extra',
        icon: 'Coins',
        type: 'Coins',
      },
    ];

    await StoreItem.deleteMany();
    await StoreItem.insertMany(items);
    res.json({ message: 'Store seeded successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
