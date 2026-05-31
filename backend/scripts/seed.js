const mongoose = require('mongoose');
const dotenv = require('dotenv');
const StoreItem = require('../src/models/StoreItem');

dotenv.config({ path: '../.env' });

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

const seedDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/minecraft_shop';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    await StoreItem.deleteMany();
    await StoreItem.insertMany(items);
    console.log('Database seeded successfully');
    
    process.exit();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();
