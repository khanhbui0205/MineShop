/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Flame, Wifi, Users, Activity } from 'lucide-react';
import type { UserProfile } from '../../types';

interface HomeProps {
  onUpgradeClick: () => void;
  userProfile: UserProfile;
}

export default function Home({ onUpgradeClick, userProfile }: HomeProps) {
  const stats = [
    { label: 'Người chơi trực tuyến', value: '542 / 1000', icon: Users, color: 'text-indigo-600' },
    { label: 'Ping đường truyền', value: '18 ms', icon: Wifi, color: 'text-emerald-500' },
    { label: 'Trạng thái máy chủ', value: 'ONLINE', icon: Activity, color: 'text-emerald-600' },
    { label: 'Phiên bản game', value: '1.16.5 - 1.20', icon: Flame, color: 'text-amber-500' },
  ];

  return (
    <div className="w-full space-y-8">
      {/* Hero Announcement banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl p-6 md:p-10 text-white relative text-left"
      >
        <span className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></span>
        <span className="absolute right-6 top-6 text-[10px] font-mono px-2.5 py-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded uppercase font-bold tracking-widest">
          MÙA 6: THẾ GIỚI MỚI
        </span>

        <h2 className="font-display text-2xl md:text-4xl font-black mb-4 tracking-tight">
          Chào mừng đến với <br /> <span className="text-indigo-400">Emerald Realm</span>
        </h2>
        <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-2xl mb-8">
          Nơi tụ hội tinh hoa sinh tồn Minecraft số 1 Việt Nam. Bạn đang có ví với{' '}
          <strong className="text-white font-mono">{userProfile.balance.toLocaleString()} Xu</strong>.
          Nhấn nâng cấp VIP vĩnh viễn để mở rộng tài nguyên sinh tồn và tăng cường sức mạnh chiến đấu.
        </p>

        <button
          onClick={onUpgradeClick}
          className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-display text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>NẮP RANK VIP NGAY</span>
          <ArrowRight size={16} className="stroke-[2.5px]" />
        </button>
      </motion.div>

      {/* Grid Server stats indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col justify-between text-left shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                <div className="p-2 bg-slate-50 w-fit rounded-lg mb-3">
                  <Icon size={20} className={`${stat.color}`} />
                </div>
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest font-sans">
                  {stat.label}
                </span>
              </div>
              <span className="text-lg font-black text-slate-800 mt-2 block">
                {stat.value}
              </span>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
        <div className="bg-white rounded-2xl border border-slate-100 p-8 space-y-4 shadow-sm">
          <h3 className="font-display text-xl font-bold text-slate-800">
            Cổng nạp PayOS 24/7
          </h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Nâng cấp hoàn toàn tự động thông qua VietQR. Tiền sẽ được cộng vào tài khoản của bạn ngay khi giao dịch chuyển khoản thành công mà không cần chờ đợi Admin.
          </p>
          <div className="space-y-3 pt-2">
            {[
              "Không chiết khấu (Nhận 100% giá trị)",
              "Duyệt tự động siêu tốc 3 giây",
              "Hỗ trợ tất cả ngân hàng Việt Nam",
              "Bảo mật, an toàn tuyệt đối"
            ].map((text, i) => (
              <div key={i} className="flex gap-3 items-center text-sm text-slate-600 font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-8 space-y-4 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-display text-xl font-bold text-slate-800">
              Thông báo mới nhất
            </h3>
            <button className="text-xs font-bold text-indigo-600 hover:underline">Xem thêm</button>
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5 relative pl-4 border-l-2 border-indigo-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">31/05/2026 - TIN TỨC</span>
              <p className="font-bold text-slate-800 text-sm">Ra mắt hệ thống nạp tự động PayOS v2.0</p>
              <p className="text-slate-500 text-xs leading-relaxed">
                Trải nghiệm nạp tiền mượt mà hơn bao giờ hết với QR Code động. Thử ngay tại mục Cửa Hàng!
              </p>
            </div>

            <div className="space-y-1.5 relative pl-4 border-l-2 border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">25/05/2026 - EVENT</span>
              <p className="font-bold text-slate-800 text-sm">Sự kiện Đua Top Bang Hội Mùa 6</p>
              <p className="text-slate-500 text-xs leading-relaxed">
                Phần thưởng cực khủng dành cho bang hội mạnh nhất gồm 1.000.000 VNĐ tiền mặt và danh hiệu độc quyền.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
