/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Transaction {
  id: string;
  type: 'Deposit' | 'Store Purchase' | 'Battle Pass';
  item: string;
  amount: string;
  coinsChange: number;
  date: string;
  status: 'Completed' | 'Claimed' | 'Pending';
}

export interface UserProfile {
  username: string;
  email: string;
  balance: number;
  totalDeposited: number;
  rank: 'Guest' | 'VIP' | 'MVP' | 'MVP+';
  battlePassLevel: number;
  battlePassXp: number;
}

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: 'Coins' | 'USD';
  badge?: string;
  icon: string;
  type: 'Rank' | 'BattlePass' | 'Coins' | 'Cosmetic';
}

export type PortalTab = 'Home' | 'Store' | 'History' | 'Settings';
