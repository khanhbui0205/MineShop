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
  date?: string;
  createdAt?: string;
  status: 'pending' | 'completed' | 'cancelled' | 'failed' | 'Completed' | 'Claimed';
  playerName?: string;
  minecraftUsername?: string;
  transactionId?: string;
  orderCode?: number;
}

export interface UserProfile {
  username: string;
  email: string;
  phoneNumber?: string;
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
  coinAmount?: number;
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
  phoneNumber?: string;
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

export type PortalTab = 'Trang chủ' | 'Cửa hàng' | 'Lịch sử' | 'Cài đặt';
export type AdminTab = 'Tổng quan' | 'Người dùng' | 'Doanh thu' | 'Thanh toán' | 'Server Control' | 'Cài đặt';
export type AuthScreenState = 'LOGIN' | 'REGISTER' | 'DASHBOARD' | 'ADMIN';

