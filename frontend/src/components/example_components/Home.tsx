/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Flame, ShieldAlert, Wifi, Users, Activity, ExternalLink, RefreshCw } from 'lucide-react';
import { StoreItem } from '../types';

interface HomeProps {
  onUpgradeClick: () => void;
  walletBalance: number;
}

export default function Home({ onUpgradeClick, walletBalance }: HomeProps) {
  const stats = [
    { label: 'Người chơi trực tuyến', value: '542 / 1000', icon: Users, color: 'text-primary' },
    { label: 'Ping đường truyền', value: '18 ms', icon: Wifi, color: 'text-emerald-500' },
    { label: 'Trạng thái cụm máy chủ', value: 'ONLINE', icon: Activity, color: 'text-emerald-600' },
    { label: 'Phiên bản game hỗ trợ', value: '1.16.5 - 1.20.4', icon: Flame, color: 'text-amber-500' },
  ];

  return (
    <div className="w-full max-w-5xl space-y-8">
      {/* Hero Announcement banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 rounded-xl overflow-hidden shadow-lg p-6 md:p-8 text-white relative text-left"
      >
        <span className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none"></span>
        <span className="absolute right-6 top-6 text-xs font-mono px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
          MÙA 6: THẾ GIỚI MỚI
        </span>

        <h2 className="font-headline text-2xl md:text-3xl font-black mb-3">
          Chào mừng đến với Cụm Máy Chủ Emerald Realm!
        </h2>
        <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-2xl mb-6">
          Nơi tụ hội tinh hoa sinh tồn Minecraft số 1 Việt Nam. Bạn đang có ví với{' '}
          <strong className="text-emerald-400 font-mono">{walletBalance.toLocaleString()} Credits</strong>.
          Nhấn nâng cấp VIP vĩnh viễn để mở rộng tài nguyên sinh tồn và tăng tốc tốc độ hồi phục máu.
        </p>

        <button
          onClick={onUpgradeClick}
          className="px-5 py-3 bg-primary hover:bg-emerald-400 text-on-primary hover:text-slate-950 font-mono text-xs font-bold rounded-lg shadow-sm active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>NẮP RANK VIP NGAY</span>
          <ArrowRight size={14} className="stroke-[2.5px]" />
        </button>
      </motion.div>

      {/* Grid Server stats indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 flex flex-col justify-between text-left shadow-xs"
            >
              <div>
                <Icon size={18} className={`${stat.color} mb-2`} />
                <span className="text-slate-400 text-[10px] uppercase font-mono tracking-wider font-semibold block">
                  {stat.label}
                </span>
              </div>
              <span className="text-sm font-black font-headline text-slate-800 mt-2 block">
                {stat.value}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Core details layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        {/* PlayOS info banner */}
        <div className="bg-surface-container-low rounded-xl border border-outline-variant p-6 space-y-4">
          <h3 className="font-headline text-lg font-bold text-slate-800">
            Cổng nạp PayOS là gì?
          </h3>
          <p className="text-slate-500 text-xs leading-relaxed">
            PayOS là dịch vụ cổng thanh toán Việt Nam chất lượng cao hỗ trợ VietQR chuyển khoản nhanh 24/7. Khác với nạp chậm hay thẻ cào bị chiết khấu cao, nạp qua QR Ngân hàng tự động nhận tiền chỉ trong 3 giây.
          </p>
          <div className="space-y-2.5 pt-2">
            <div className="flex gap-2.5 items-center text-xs text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              <span>Không chiết khấu (Nhận 100% giá trị nạp)</span>
            </div>
            <div className="flex gap-2.5 items-center text-xs text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              <span>Quét mã tức thì, hỗ trợ tất cả 40+ ngân hàng Việt Nam</span>
            </div>
            <div className="flex gap-2.5 items-center text-xs text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              <span>Bảo mật, an toàn tuyệt đối</span>
            </div>
          </div>
        </div>

        {/* Server Server Announcement feed */}
        <div className="bg-surface-container-low rounded-xl border border-outline-variant p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-headline text-lg font-bold text-slate-800">
              Cập nhật máy chủ mới nhất
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Xem tất cả</span>
          </div>

          <div className="space-y-4 division-y division-outline-variant">
            <div className="space-y-1">
              <span className="text-[9px] font-mono font-bold text-slate-400 block">31/05/2026 - SERVER</span>
              <p className="font-bold text-slate-700 text-xs">Phát động giải đấu PvP Champion Emerald Cup</p>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Đấu trường sinh tử sẽ diễn ra vào tối thứ 7 tuần sau. Tổng giải thưởng lên tới 500,000 Credits cùng Cúp Rồng Thần.
              </p>
            </div>

            <div className="w-full h-[1px] bg-outline-variant/60"></div>

            <div className="space-y-1">
              <span className="text-[9px] font-mono font-bold text-slate-400 block">20/05/2026 - EVENT</span>
              <p className="font-bold text-slate-700 text-xs">Ra mắt cập nhật Gói Quà Đồng Hành Thú Cưng</p>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Ra mắt 2 thú cưng cute mới hỗ trợ tự nhặt vật phẩm xung quanh nhân vật cực nhàn tại cụm Skyblock.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
