/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Clock, CheckCircle2, XCircle, Search, HelpCircle, AlertCircle } from 'lucide-react';
import { Transaction } from '../types';

interface HistoryProps {
  transactions: Transaction[];
  onRetryPayment: (tx: Transaction) => void;
}

export default function History({ transactions, onRetryPayment }: HistoryProps) {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'SUCCESSFUL' | 'CANCELLED'>('ALL');
  const [search, setSearch] = useState('');

  // Filtering transactions
  const filteredTxs = transactions.filter((tx) => {
    const matchesFilter = filter === 'ALL' || tx.status === filter;
    const matchesSearch =
      tx.itemName.toLowerCase().includes(search.toLowerCase()) ||
      tx.reference.toLowerCase().includes(search.toLowerCase()) ||
      tx.orderCode.toString().includes(search);
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'SUCCESSFUL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-mono text-[10px] font-bold">
            <CheckCircle2 size={12} />
            <span>THÀNH CÔNG</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-mono text-[10px] font-bold">
            <Clock size={12} className="animate-pulse" />
            <span>CHỜ CHUYỂN</span>
          </span>
        );
      case 'CANCELLED':
        default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full font-mono text-[10px] font-bold">
            <XCircle size={12} />
            <span>ĐÃ HỦY</span>
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-5xl">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold text-slate-800">
            Lịch Sử Giao Dịch
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Tra cứu thông tin trạng thái mọi hóa đơn PayOS đã nạp của tài khoản.
          </p>
        </div>

        {/* Filter Badges */}
        <div className="flex gap-1.5 self-start bg-slate-100 rounded-lg p-1 border border-outline-variant/60">
          {(['ALL', 'SUCCESSFUL', 'PENDING', 'CANCELLED'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={`px-3 py-1.5 rounded-md font-mono text-[10px] font-bold tracking-wider cursor-pointer transition-all uppercase ${
                filter === opt
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {opt === 'ALL' ? 'Tất cả' : opt === 'SUCCESSFUL' ? 'Thành công' : opt === 'PENDING' ? 'Chờ thanh toán' : 'Đã hủy'}
            </button>
          ))}
        </div>
      </div>

      {/* Search inputs */}
      <div className="relative mb-6">
        <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
          <Search size={16} />
        </span>
        <input
          type="text"
          placeholder="Tìm theo gói, mã đơn hàng, nội dung chuyển khoản..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full py-2.5 pl-10 pr-4 bg-surface-container-lowest border border-outline-variant/80 rounded-xl font-sans text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
        />
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-xs">
        {filteredTxs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-4">
            <AlertCircle size={36} className="text-slate-300" />
            <div>
              <p className="font-bold text-slate-600 text-sm">Không tìm thấy giao dịch nào</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto leading-relaxed">
                Bạn chưa khởi tạo giao dịch khớp với điều kiện tìm kiếm hiện tại. Hãy chuyển qua mục Cửa Hàng để nạp thử!
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider border-b border-outline-variant/60">
                  <th className="py-3 px-6">Mã đơn PayOS</th>
                  <th className="py-3 px-6">Nội dung nạp</th>
                  <th className="py-3 px-6">Sản phẩm kích hoạt</th>
                  <th className="py-3 px-6">Số tiền nạp</th>
                  <th className="py-3 px-6">Thời gian</th>
                  <th className="py-3 px-6">Trạng thái</th>
                  <th className="py-3 px-6 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50 text-xs">
                {filteredTxs.map((tx, idx) => (
                  <motion.tr
                    key={tx.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-slate-50/50"
                  >
                    <td className="py-4.5 px-6 font-mono font-bold text-slate-800">
                      #{tx.orderCode}
                    </td>
                    <td className="py-4.5 px-6 font-mono font-bold text-slate-500">
                      {tx.reference}
                    </td>
                    <td className="py-4.5 px-6">
                      <p className="font-bold text-slate-700">{tx.itemName}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[200px] mt-0.5 leading-relaxed">
                        {tx.itemDescription}
                      </p>
                    </td>
                    <td className="py-4.5 px-6 font-headline font-extrabold text-slate-800 text-right pr-12">
                      {tx.amount.toLocaleString()} VND
                    </td>
                    <td className="py-4.5 px-6 text-slate-400 font-mono">
                      {tx.createdAt}
                    </td>
                    <td className="py-4.5 px-6">
                      {getStatusBadge(tx.status)}
                    </td>
                    <td className="py-4.5 px-6 text-center">
                      {tx.status === 'PENDING' ? (
                        <button
                          onClick={() => onRetryPayment(tx)}
                          className="px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-on-primary border border-primary/20 hover:border-primary font-mono text-[10px] font-bold tracking-wide rounded transition-all cursor-pointer"
                        >
                          TIẾP TỤC NẠP
                        </button>
                      ) : (
                        <div className="flex justify-center">
                          <span className="w-2 h-2 rounded-full bg-slate-200"></span>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-slate-50 border border-outline-variant rounded-xl flex gap-3 text-xs text-slate-500 items-start">
        <HelpCircle size={16} className="text-secondary mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-bold text-slate-700 mb-1">Cần hỗ trợ tra soát giao dịch?</p>
          <p className="leading-relaxed">
            Nếu giao dịch đã chuyển tiền thành công từ tài khoản ngân hàng của bạn nhưng trạng thái hệ thống vẫn ghi "Chờ chuyển" quá 5 phút, vui lòng chụp lại hình ảnh hóa đơn ngân hàng và nhấn liên hệ hỗ trợ Admin tại Discord/Kênh Chăm sóc khách hàng hoặc Hotline.
          </p>
        </div>
      </div>
    </div>
  );
}
