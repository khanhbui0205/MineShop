/**
 * Script seed dữ liệu mẫu cho MineShop
 * Chạy: node scripts/seedPackages.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Package = require('../src/models/Package');

const packages = [
  {
    name: 'Gói 500 Xu Lục Bảo',
    description: 'Nhận ngay 500 xu vào tài khoản server.',
    price: 50000,
    coinAmount: 500,
    bonusCoin: 0,
    isVisible: true,
    category: 'Coin',
  },
  {
    name: 'Gói 1250 Xu Ngọc Xanh',
    description: 'Nhận ngay 1250 xu - ưu đãi 25% so với gói thường.',
    price: 100000,
    coinAmount: 1250,
    bonusCoin: 250,
    isVisible: true,
    category: 'Coin',
  },
  {
    name: 'Gói 2500 Xu Kim Cương',
    description: 'Gói siêu tiết kiệm - nhận 2500 xu + 500 xu thưởng!',
    price: 200000,
    coinAmount: 2500,
    bonusCoin: 500,
    isVisible: true,
    category: 'Coin',
  },
  {
    name: 'Hạng VIP',
    description: 'Prefix [VIP], /heal cá nhân, nhân đôi điểm vote.',
    price: 99000,
    coinAmount: 0,
    bonusCoin: 0,
    isVisible: true,
    category: 'VIP',
  },
  {
    name: 'Hạng MVP',
    description: 'Prefix [MVP], màu chữ chat nổi bật, lệnh /fly tại sảnh.',
    price: 199000,
    coinAmount: 0,
    bonusCoin: 0,
    isVisible: true,
    category: 'VIP',
  },
  {
    name: 'Hạng MVP+',
    description: 'Prefix [MVP+], đổi màu da súng/giáp, /fly toàn server.',
    price: 299000,
    coinAmount: 0,
    bonusCoin: 0,
    isVisible: true,
    category: 'VIP',
  },
  {
    name: 'Battle Pass Mùa 1',
    description: 'Mở khóa 100 cấp phần thưởng độc quyền cực phẩm.',
    price: 149000,
    coinAmount: 100,
    bonusCoin: 0,
    isVisible: true,
    category: 'Pass',
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Kết nối MongoDB thành công');

    // Xóa dữ liệu cũ
    await Package.deleteMany();
    console.log('🗑️  Đã xóa packages cũ');

    // Thêm dữ liệu mới
    const created = await Package.insertMany(packages);
    console.log(`📦 Đã tạo ${created.length} gói nạp mẫu:`);
    created.forEach(p => console.log(`  - ${p.name} (${p.category}) — ${p.price.toLocaleString('vi-VN')} VNĐ`));

    await mongoose.disconnect();
    console.log('\n✅ Seed hoàn thành!');
  } catch (err) {
    console.error('❌ Lỗi seed:', err.message);
    process.exit(1);
  }
};

seed();
