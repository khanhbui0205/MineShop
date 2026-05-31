/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Wallet, Bell, LogOut, CheckCircle } from 'lucide-react';

interface HeaderProps {
  walletBalance: number;
  onLogout: () => void;
}

export default function Header({ walletBalance, onLogout }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [readNotifs, setReadNotifs] = useState(false);

  return (
    <header className="bg-white w-full h-16 md:h-20 sticky top-0 border-b border-slate-100 z-50 flex justify-between items-center px-4 md:px-16 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-md hover:rotate-6 transition-transform">
          <span className="text-white font-black text-xl font-headline tracking-tighter">P</span>
        </div>
        <span className="text-lg md:text-xl font-extrabold tracking-tight text-slate-800 select-none font-headline">
          MinePortal <span className="text-primary font-black">PayOS</span>
        </span>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <div className="relative flex items-center gap-4">
          {/* Wallet Widget */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-container-low border border-outline-variant rounded-full text-xs font-mono text-slate-700">
            <Wallet size={14} className="text-primary" />
            <span>Ví:</span>
            <span className="font-bold text-primary">{walletBalance.toLocaleString()} Credits</span>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setReadNotifs(true);
              }}
              className="text-slate-600 hover:text-primary transition-colors cursor-pointer p-1.5 hover:bg-surface-container-low rounded-full relative"
            >
              <Bell size={20} />
              {!readNotifs && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl p-4 z-50">
                <div className="flex justify-between items-center pb-2 border-b border-outline-variant mb-2">
                  <h4 className="font-headline font-semibold text-sm text-slate-800">Thông báo mới nhất</h4>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-xs text-primary hover:underline"
                  >
                    Đóng
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-2 text-xs">
                    <CheckCircle size={14} className="text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-700">Nạp thành công 250,000 VND</p>
                      <p className="text-slate-400">Hệ thống payOS đã duyệt tự động 1 giờ trước.</p>
                    </div>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <Bell size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-700">Khuyến mãi nạp thẻ mùa hè</p>
                      <p className="text-slate-400">Tặng thêm 20% Emerald Credits cho mọi lệnh nạp qua QR code.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="h-6 w-[1px] bg-outline-variant"></div>

        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant select-none shadow-xs">
            <img
              alt="User Avatar"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAqQjv8fj2p0MjsU5PnGcGo6tqu-P3oFZ5K3E3ZBFhB0RpJaFU3z5zbi2Ci_FOGXQJ3xbDWkWrogcNLMwr5nftGRrNbTe7SI6Ko1s0HyjqQed79kkLZwEdtHyCb6gd2AmNPCDmGCnpYHhEV4fqRffFmjUwrCHwUBFXR_fMgzIqoNl6WXP-sj44D4_qC3Cgl-ruA9j-B-Ao-YFmlfGaJnN0GoxEs-j2ItBc4dwzNo5_Xf7qB2S6KBo_jKbmSnEhAsQQz0880d8dCei8"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="hidden sm:inline font-mono text-xs font-semibold text-slate-700 hover:text-primary transition-colors">
            khanhbui0205
          </span>
          <button
            onClick={onLogout}
            title="Đăng xuất"
            className="text-slate-500 hover:text-error transition-colors cursor-pointer p-1 rounded-md hover:bg-error/5 flex items-center gap-1.5"
          >
            <LogOut size={16} />
            <span className="hidden md:inline font-sans text-xs font-medium">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
