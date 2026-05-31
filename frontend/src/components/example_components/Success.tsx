/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ArrowLeft, History, Sparkles, Check, Bookmark } from 'lucide-react';
import { Transaction, StoreItem } from '../types';

interface SuccessProps {
  item: StoreItem;
  transaction: Transaction;
  onBackToStore: () => void;
  onGoToHistory: () => void;
}

export default function Success({ item, transaction, onBackToStore, onGoToHistory }: SuccessProps) {
  // Support simple print dialog simulation
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center py-6 relative">
      
      {/* Absolute ambient glowing backgrounds matching "Professional Polish" */}
      <div className="absolute top-0 right-[-120px] w-[260px] h-[260px] bg-emerald-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30 pointer-events-none"></div>
      <div className="absolute bottom-20 left-[-120px] w-[300px] h-[300px] bg-emerald-100/40 rounded-full mix-blend-multiply filter blur-3xl opacity-35 pointer-events-none"></div>

      <div className="w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative z-10 transition-all">
        
        {/* Banner with professional emerald glow matching design */}
        <div className="bg-emerald-50/70 py-10 flex flex-col items-center border-b border-emerald-100">
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-emerald-200/80 transition-transform hover:scale-105">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 11 }}
            >
              <Check size={40} className="stroke-[3.5px] text-white" />
            </motion.div>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight font-headline">Thanh toán thành công!</h1>
          <p className="text-emerald-700 font-semibold mt-1 flex items-center gap-1.5 text-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Giao dịch của bạn đã được xác nhận tự động
          </p>
        </div>

        {/* Invoice details body */}
        <div className="p-8 md:p-10 space-y-6">
          <div className="grid grid-cols-2 gap-y-6 text-sm">
            <div className="space-y-1">
              <p className="text-slate-400 uppercase tracking-wider text-[10px] font-bold font-mono">Mã giao dịch PayOS</p>
              <p className="text-slate-700 font-mono font-bold">#{transaction.orderCode}</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-slate-400 uppercase tracking-wider text-[10px] font-bold font-mono">Thời gian duyệt</p>
              <p className="text-slate-700 font-medium font-mono">{transaction.createdAt || new Date().toLocaleString()}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-slate-400 uppercase tracking-wider text-[10px] font-bold font-mono">Phương thức</p>
              <p className="text-slate-700 font-semibold flex items-center gap-2">
                VietQR / PayOS 
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold border border-emerald-200 font-mono">AUTO</span>
              </p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-slate-400 uppercase tracking-wider text-[10px] font-bold font-mono">Nội dung nạp chính xác</p>
              <span className="font-mono text-xs font-bold text-primary bg-primary/5 px-2.5 py-1 border border-primary/20 rounded">
                {transaction.reference}
              </span>
            </div>
          </div>

          <div className="border-b border-dashed border-slate-200 my-4"></div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-1 text-sm">
              <span className="text-slate-500 font-medium">Nhà cung cấp máy chủ:</span>
              <span className="font-bold text-slate-800 uppercase tracking-wide text-xs font-mono">{transaction.accountName}</span>
            </div>
            <div className="flex items-center justify-between py-1 text-sm">
              <span className="text-slate-500 font-medium">Sản phẩm nạp kích hoạt:</span>
              <span className="text-slate-800 font-bold text-sm">{item.name}</span>
            </div>
            <div className="flex items-center justify-between py-1 text-sm">
              <span className="text-slate-500 font-medium">Tổng lượng nhận được:</span>
              <span className="text-primary font-bold font-mono">+{item.creditsBonus?.toLocaleString() || '0'} Emerald Credits</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-slate-100 text-sm">
              <span className="text-slate-800 font-bold font-headline">Tổng tiền thanh toán</span>
              <span className="text-2xl font-black text-slate-800 font-headline">
                {transaction.amount.toLocaleString()} VND
              </span>
            </div>
          </div>

          {/* User notification segment */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200/40 flex gap-3 text-left">
            <div className="p-2.5 bg-emerald-500/10 rounded-full text-emerald-600 self-start">
              <Bookmark size={15} className="stroke-[2.5px]" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                Nhân vật: <span className="font-mono text-emerald-700 font-bold">khanhbui0205</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Đã đồng bộ thành công với payOS Webhook. Vào game Minecraft của bạn và chạy lệnh <code className="bg-slate-100 text-slate-800 font-mono px-1 rounded font-bold">/portal claim</code> để cập nhật lượng tín dụng.
              </p>
            </div>
          </div>

          <div className="border-b border-slate-100 my-4"></div>

          {/* Core redirection actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button
              onClick={onBackToStore}
              className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl transition shadow-lg hover:shadow-slate-800/20 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer font-mono text-xs"
            >
              <ArrowLeft size={16} className="stroke-[2.5px]" />
              QUAY LẠI TRANG CHỦ CỬA HÀNG
            </button>
            <button
              onClick={handlePrint}
              className="px-8 border-2 border-slate-200 hover:border-slate-300 text-slate-600 font-bold py-3.5 rounded-xl transition active:scale-[0.98] cursor-pointer font-mono text-xs hover:bg-slate-50"
            >
              IN HÓA ĐƠN
            </button>
          </div>
        </div>

      </div>

      <button
        onClick={onGoToHistory}
        className="mt-6 text-xs text-slate-400 hover:text-primary font-semibold font-mono tracking-wider flex items-center gap-1 cursor-pointer"
      >
        <History size={13} />
        <span>XEM LỊCH SỬ NẠP THẺ</span>
      </button>

    </div>
  );
}
