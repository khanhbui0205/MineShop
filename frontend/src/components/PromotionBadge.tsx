import type { CSSProperties } from 'react';

import type { PromotionBadgeData } from '../lib/promotions';

interface PromotionBadgeProps {
  badge: PromotionBadgeData | null;
  className?: string;
  style?: CSSProperties;
}

export default function PromotionBadge({ badge, className = '', style }: PromotionBadgeProps) {
  if (!badge) return null;

  return (
    <span
      className={`promo-badge ${badge.type === 'discount' ? 'promo-badge-discount' : 'promo-badge-bonus'} ${className}`}
      style={style}
    >
      {badge.text}
    </span>
  );
}
