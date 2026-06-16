/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { StoreItem, Transaction } from './types';

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    type: 'Deposit',
    item: 'Nạp tiền qua Cổng Dịch vụ',
    amount: '+500 Xu',
    coinsChange: 500,
    date: 'Hôm nay, 14:30',
    status: 'Completed',
  },
  {
    id: 'tx-2',
    type: 'Store Purchase',
    item: 'Hạng MVP+ Premium (30 Ngày)',
    amount: 'Hạng MVP+ (30N)',
    coinsChange: -1200,
    date: 'Hôm qua, 19:15',
    status: 'Completed',
  },
  {
    id: 'tx-3',
    type: 'Battle Pass',
    item: 'Mở khóa Cấp 42',
    amount: 'Mở khóa Cấp 42',
    coinsChange: 0,
    date: '24 tháng 10, 2024',
    status: 'Claimed',
  },
];

export const STORE_ITEMS: StoreItem[] = [
  {
    id: 'rank-vip',
    name: 'Hạng VIP Quyền Lợi',
    description: 'Quyền lợi cơ bản: prefix [VIP], /heal cá nhân và nhân đôi điểm vote.',
    price: 300,
    currency: 'Coins',
    badge: 'Phổ biến',
    icon: 'workspace_premium',
    type: 'Rank',
  },
  {
    id: 'rank-mvp',
    name: 'Hạng MVP Tầm Trung',
    description: 'Quyền lợi tầm trung: prefix [MVP], màu chữ chat nổi bật, lệnh /fly tại sảnh.',
    price: 650,
    currency: 'Coins',
    badge: 'Lựa chọn Tốt',
    icon: 'workspace_premium',
    type: 'Rank',
  },
  {
    id: 'rank-mvp-plus',
    name: 'Hạng MVP+ Premium Cao Cấp',
    description: 'Quyền lợi tối cao: prefix [MVP+], đổi màu da súng/giáp, lệnh /fly toàn server và sảnh VIP.',
    price: 1200,
    currency: 'Coins',
    badge: 'Tối thượng',
    icon: 'military_tech',
    type: 'Rank',
  },
  {
    id: 'bp-pass',
    name: 'Battle Pass Golden Season',
    description: 'Kích hoạt Battle Pass mùa mới, mở khóa 100 cấp phần thưởng độc quyền cực phẩm.',
    price: 450,
    currency: 'Coins',
    badge: 'Theo Mùa',
    icon: 'stars',
    type: 'BattlePass',
  },
  {
    id: 'cosmetic-sword',
    name: 'Skin Kiếm Ngọc Lục Bảo Vũ Trụ',
    description: 'Skin Kiếm Ngọc Lục Bảo vũ trụ với hiệu ứng phát sáng dải ngân hà kỳ ảo.',
    price: 350,
    currency: 'Coins',
    badge: 'Giới hạn',
    icon: 'swords',
    type: 'Cosmetic',
  },
  {
    id: 'coins-pack-1',
    name: 'Rương 500 Xu Lục Bảo',
    description: 'Kho báu bao gồm 500 Xu chuyển trực tiếp vào tài khoản server.',
    price: 50000,
    currency: 'USD',
    badge: '+10% Bonus',
    icon: 'diamond',
    type: 'Coins',
  },
  {
    id: 'coins-pack-2',
    name: 'Núi 1250 Xu Lục Bảo',
    description: 'Rương siêu khổng lồ chứa 1250 Xu cùng đặc quyền ưu tiên hỗ trợ đặc biệt.',
    price: 100000,
    currency: 'USD',
    badge: '+25% Extra',
    icon: 'payments',
    type: 'Coins',
  },
];


