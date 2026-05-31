/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { StoreItem, Transaction } from './types';

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    type: 'Deposit',
    item: 'Deposit via Portal',
    amount: '+500 Coins',
    coinsChange: 500,
    date: 'Today, 14:30',
    status: 'Completed',
  },
  {
    id: 'tx-2',
    type: 'Store Purchase',
    item: 'MVP+ Rank (30 Days)',
    amount: 'MVP+ Rank (30D)',
    coinsChange: -1200,
    date: 'Yesterday, 19:15',
    status: 'Completed',
  },
  {
    id: 'tx-3',
    type: 'Battle Pass',
    item: 'Unlocked Tier 42',
    amount: 'Unlocked Tier 42',
    coinsChange: 0,
    date: 'Oct 24, 2024',
    status: 'Claimed',
  },
];

export const STORE_ITEMS: StoreItem[] = [
  {
    id: 'rank-vip',
    name: 'VIP Rank VIP',
    description: 'Quyền lợi cơ bản: prefix [VIP], /heal cá nhân và nhân đôi điểm vote.',
    price: 300,
    currency: 'Coins',
    badge: 'Popular',
    icon: 'workspace_premium',
    type: 'Rank',
  },
  {
    id: 'rank-mvp',
    name: 'MVP Rank',
    description: 'Quyền lợi tầm trung: prefix [MVP], màu chữ chat nổi bật, lệnh /fly tại sảnh.',
    price: 650,
    currency: 'Coins',
    badge: 'Hot Choice',
    icon: 'workspace_premium',
    type: 'Rank',
  },
  {
    id: 'rank-mvp-plus',
    name: 'MVP+ Rank Premium',
    description: 'Quyền lợi tối cao: prefix [MVP+], đổi màu da súng/giáp, lệnh /fly toàn server và sảnh VIP.',
    price: 1200,
    currency: 'Coins',
    badge: 'Ultimate VIP',
    icon: 'military_tech',
    type: 'Rank',
  },
  {
    id: 'bp-pass',
    name: 'Battle Pass Golden',
    description: 'Kích hoạt Battle Pass mùa mới, mở khóa 100 cấp phần thưởng độc quyền cực phẩm.',
    price: 450,
    currency: 'Coins',
    badge: 'Seasonal',
    icon: 'stars',
    type: 'BattlePass',
  },
  {
    id: 'cosmetic-sword',
    name: 'Cosmic Emerald Sword Skin',
    description: 'Skin Kiếm Ngọc Lục Bảo vũ trụ với hiệu ứng phát sáng dải ngân hà kỳ ảo.',
    price: 350,
    currency: 'Coins',
    badge: 'Limited',
    icon: 'swords',
    type: 'Cosmetic',
  },
  {
    id: 'coins-pack-1',
    name: '500 Coins Emerald Chest',
    description: 'Kho báu bao gồm 500 Coins chuyển trực tiếp vào tài khoản server.',
    price: 5.00,
    currency: 'USD',
    badge: '+10% Bonus',
    icon: 'diamond',
    type: 'Coins',
  },
  {
    id: 'coins-pack-2',
    name: '1250 Coins Emerald Mountain',
    description: 'Rương siêu khổng lồ chứa 1250 Coins cùng đặc quyền ưu tiên hỗ trợ đặc biệt.',
    price: 10.00,
    currency: 'USD',
    badge: '+25% Extra',
    icon: 'payments',
    type: 'Coins',
  },
];

export const TOP_DONATORS = [
  {
    id: 'donator-1',
    name: 'NotchFan99',
    amount: '$320',
    rank: 1,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCIzoidLln08wks_vcKlRrn4oWxhTRWfcFrUVDuK-3b2-93ByuyCPuaiHPSl9ybKra4NZodWAtNJUITrBzxESRfrdCMe8xHxKOs5ZnMGhQ0HNaFDyLGDdQAG1qcpVE_lPZaipujxmY2ZrsIKqy1KdlePYdG0EVpJHIQoLlcyPb8au6wR0fqFTNunnlaBoB3yc0zTF7IF7cuTu05-ymQ7TP7UN4AqjdIVMsnT8c2qSTaVNHoaYXFvYouP2WfTNglLjkwwEVZKDk5qYU',
  },
  {
    id: 'donator-2',
    name: 'xX_Slayer_Xx',
    amount: '$150',
    rank: 2,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAouBAV1MMD6KCBGiD_KQpvrWQsVdxLSIOMYP6UZ9ETRiRG5swm8MaIzMR11Z6w7Vb8nf5qWS6RIRaLbr-hswKxfluw17VqHhrUn0J7-7eMb1CYcp07LOf5uF2OVVZABn3E1ZLnTNhLd7g484suZfayX__aMuQpLSyEYo1GdWN_EQEGm6aR5jG8bagu9abSnoJz5H_jTP9sfnmB0S3hPXCRa01ugsIj4iPSKUTzCTO8_c5BkeBKJlhcKEbJeKWj6gcWdDGSrejcC1Q',
  },
  {
    id: 'donator-3',
    name: 'MinerPro',
    amount: '$95',
    rank: 3,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuANYEbLSVBcqUcIORW3SRdE4XmLYdY-ei5EevGKaPWwr9S3Fyp0aJoTMwmu5gVNpUeaiCoRGFf269GwPNjOBO0drZSpKXvyyjj1C5J8nyYa5zc90FOFutsuV_HOEyr97ck-0sqlTpP9siwsqutDhX5GpLZk3Uc17OGnkavA5Ltom_7spvcGug9vYC6tV6kuZ80kBtsrOJ1FqGwIogjU-ebjn99w7E099NfQsB-_04Du2-0Mow3VeUGMci9agtOkO5UiCmpkTgo0AWs',
  },
];
