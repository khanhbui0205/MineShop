/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Gem, Crown, Coins, ShoppingBag, Check } from 'lucide-react';
import { STORE_ITEMS } from '../data';
import { StoreItem } from '../types';

interface StoreProps {
  onSelectItem: (item: StoreItem) => void;
}

export default function Store({ onSelectItem }: StoreProps) {
  // Helper to resolve appropriate icon based on ID
  const getItemIcon = (id: string) => {
    switch (id) {
      case 'chest_king':
        return <ShoppingBag className="text-amber-500" size={24} />;
      case 'rank_emerald':
        return <Crown className="text-primary" size={24} />;
      case 'dragon_pack':
        return <Gem className="text-pink-500" size={24} />;
      default:
        return <Coins className="text-blue-500" size={24} />;
    }
  };

  return (
    <div className="w-full max-w-5xl">
      <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold text-slate-800 leading-tight">
          Cửa Hàng Máy Chủ Minecraft
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Nâng cấp trải nghiệm, mở khóa trang bị thần pháp khí và nạp đơn hàng tự động thông qua PayOS.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {STORE_ITEMS.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.08 }}
            whileHover={{ scale: 1.01, borderColor: '#006c49' }}
            className={`bg-surface-container-lowest rounded-xl border border-outline-variant p-6 flex flex-col justify-between transition-all relative ${
              item.badge === 'Khuyên dùng' ? 'ring-2 ring-primary/20 border-primary' : ''
            }`}
          >
            {item.badge && (
              <span className={`absolute top-4 right-4 text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                item.badge === 'Khuyên dùng'
                  ? 'bg-primary text-on-primary'
                  : item.badge === 'Hiếm có'
                  ? 'bg-pink-100 text-pink-700 border border-pink-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {item.badge}
              </span>
            )}

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-outline-variant/50">
                  {getItemIcon(item.id)}
                </div>
                <div>
                  <h3 className="font-headline text-lg font-bold text-slate-800">
                    {item.name}
                  </h3>
                  <span className="font-mono text-xs text-primary font-bold">
                    +{item.creditsBonus?.toLocaleString()} Emerald Credits Bonus
                  </span>
                </div>
              </div>

              <p className="text-slate-500 text-sm leading-relaxed mb-5">
                {item.description}
              </p>

              <div className="space-y-2 mb-6">
                <p className="text-slate-600 font-semibold text-xs uppercase tracking-wider mb-2 font-headline">
                  Quyền lợi bao gồm:
                </p>
                {item.benefits.map((benefit, bIdx) => (
                  <div key={bIdx} className="flex gap-2.5 items-start text-sm text-slate-600">
                    <Check size={16} className="text-primary flex-shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-outline-variant flex items-center justify-between mt-auto">
              <div>
                <span className="text-slate-400 text-xs block mb-0.5">Giá nạp PayOS:</span>
                <span className="text-2xl font-black text-slate-800 font-headline">
                  {item.price.toLocaleString()} <span className="text-base font-normal text-slate-500">VND</span>
                </span>
              </div>

              <button
                onClick={() => onSelectItem(item)}
                className="px-5 py-2.5 bg-primary hover:bg-emerald-700 text-on-primary font-mono text-xs font-semibold rounded-lg shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer"
              >
                MUA NGAY
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
