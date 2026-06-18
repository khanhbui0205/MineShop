/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Transaction {
  id: string;
  _id?: string;
  type: 'Deposit' | 'Store Purchase' | 'Battle Pass';
  item: string;
  amount: string;
  coinsChange: number;
  baseCoins?: number;
  bonusCoins?: number;
  totalCoins?: number;
  command?: string;
  date?: string;
  createdAt?: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'FAILED' | 'pending' | 'completed' | 'cancelled' | 'failed' | 'Completed' | 'Claimed';
  playerName?: string;
  minecraftUsername?: string;
  transactionId?: string;
  orderCode?: number;
}

export interface UserProfile {
  username: string;
  email: string;
  balance: number;
  totalDeposited: number;
  rank: string;
  battlePassLevel: number;
  battlePassXp: number;
  minecraftUsername?: string;
  minecraftVerified?: boolean;
  minecraftLastSync?: string;
  isBanned?: boolean;
  role?: string;
}

export interface StoreItem {
  id: string;
  _id?: string;
  name: string;
  description: string;
  price: number;
  currency: 'Coins' | 'USD';
  badge?: string;
  icon: string;
  type: 'Rank' | 'BattlePass' | 'Coins' | 'Cosmetic';
  bonusCoin?: number;
  bonusCoins?: number;
  coinAmount?: number;
  baseCoins?: number;
  promotionPercent?: number;
  promotionType?: 'none' | 'bonus_coin' | 'discount';
  discountPercent?: number;
  originalPrice?: number;
  finalPrice?: number;
  promotionBadgeText?: string;
  commands?: string[];
  rights?: string[];
  category?: string;
  image?: string;
  items?: string[];
  duration?: string;
}

// ── Admin Types ──────────────────────────────────────────────

export interface CoinPackage {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  price: number;          // VNĐ
  coinAmount: number;
  bonusCoin: number;
  baseCoins?: number;
  bonusCoins?: number;
  promotionPercent?: number;
  promotionType?: 'none' | 'bonus_coin' | 'discount';
  discountPercent?: number;
  originalPrice?: number;
  finalPrice?: number;
  promotionBadgeText?: string;
  isVisible: boolean;
  category: 'Coin' | 'VIP' | 'Pass';
  commands?: string[];
  createdAt?: string;
}

export interface Player {
  id: string;
  _id?: string;
  name: string;
  username?: string;
  email: string;
  avatarUrl?: string;
  status: 'Online' | 'Offline' | 'Banned';
  isBanned: boolean;
  banReason?: string;
  banExpiresAt?: string | null;
  rank: string;
  donated: number;
  totalDeposited?: number;
  balance?: number;
  role: string;
  minecraftUsername?: string;
  minecraftVerified?: boolean;
  minecraftLastSync?: string;
  lastActive?: string;
  lastLoginAt?: string | null;
  createdAt?: string;
}

export interface AuditLog {
  id: string;
  time: string;
  message: string;
  detail: string;
  borderType: 'primary' | 'tertiary' | 'secondary' | 'error';
}

export interface ActiveSession {
  id: string;
  device: string;
  location: string;
  ip: string;
  isCurrent: boolean;
  time: string;
}

export interface AdminStats {
  totalUsers: number;
  bannedUsers: number;
  totalRevenue: number;
  totalTransactions: number;
  totalPackages: number;
  totalCodes?: number;
  totalRedeems?: number;
  activeCodes?: number;
  expiredCodes?: number;
  pendingRewards?: number;
  completedRewards?: number;
}

export interface ServerCommand {
  _id: string;
  adminId: {
    _id: string;
    username: string;
  } | string;
  command: string;
  response: string;
  success: boolean;
  createdAt: string;
}

export type NotificationType = 'system' | 'promotion' | 'payment' | 'warning';
export type NotificationTargetType = 'all' | 'player';

export interface NotificationItem {
  id: string;
  receiptId: string;
  notificationId: string;
  title: string;
  message: string;
  type: NotificationType;
  targetType: NotificationTargetType;
  targetPlayerName?: string;
  createdAt: string;
  isRead: boolean;
  readAt?: string | null;
}

export type RedeemRewardType = 'COIN' | 'ITEM';
export type RewardStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface RedeemItem {
  material: string;
  amount: number;
}

export interface RedeemCode {
  _id: string;
  code: string;
  name: string;
  description?: string;
  rewardType: RedeemRewardType;
  coinAmount: number;
  items: RedeemItem[];
  commands: string[];
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  newbieOnly: boolean;
  maxPlayerAgeDays: number;
  startDate?: string | null;
  endDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CodeRedemption {
  _id: string;
  codeId?: RedeemCode | string;
  userId?: { _id: string; username: string; email?: string } | string;
  username: string;
  code: string;
  status: RewardStatus;
  redeemedAt: string;
  createdAt?: string;
}

export type PortalTab = 'Trang chủ' | 'Cửa hàng' | 'Redeem Code' | 'Lịch sử' | 'Cài đặt';
export type AdminTab = 'Tổng quan' | 'Người dùng' | 'Doanh thu' | 'Thanh toán' | 'Redeem Code' | 'Server Control' | 'Thông báo' | 'Cài đặt';
export type AuthScreenState = 'LOGIN' | 'REGISTER' | 'DASHBOARD' | 'ADMIN';

