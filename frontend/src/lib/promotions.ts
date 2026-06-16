import type { CoinPackage, StoreItem } from '../types';

type PromotionSource = Pick<
  StoreItem | CoinPackage,
  'promotionType' | 'discountPercent' | 'bonusCoins' | 'bonusCoin' | 'baseCoins' | 'coinAmount'
>;

export type PromotionBadgeData = {
  type: 'discount' | 'bonus_coin';
  text: string;
};

export const formatPercent = (value: number) => {
  const normalized = Math.round(Number(value || 0) * 10) / 10;
  return normalized.toLocaleString('vi-VN', {
    maximumFractionDigits: 1,
  });
};

export const getPromotionBadge = (pkg?: PromotionSource | null): PromotionBadgeData | null => {
  if (!pkg) return null;

  const discountPercent = Number(pkg.discountPercent || 0);
  if (pkg.promotionType === 'discount' && discountPercent > 0) {
    return {
      type: 'discount',
      text: `OFF -${formatPercent(discountPercent)}%`,
    };
  }

  const bonusCoins = Number(pkg.bonusCoins ?? pkg.bonusCoin ?? 0);
  const baseCoins = Number(pkg.baseCoins ?? pkg.coinAmount ?? 0);
  if (pkg.promotionType === 'bonus_coin' && bonusCoins > 0 && baseCoins > 0) {
    const percent = (bonusCoins / baseCoins) * 100;
    return {
      type: 'bonus_coin',
      text: `+${formatPercent(percent)}% Coins`,
    };
  }

  return null;
};
