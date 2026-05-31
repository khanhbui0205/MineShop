/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BarChart2, ShieldAlert, CheckCircle2, TrendingUp, Cpu, Server } from 'lucide-react';

export default function Admin() {
  const [logs, setLogs] = useState([
    { id: 1, type: 'SUCCESS', time: '15:20:10', text: 'Webhook nhận thành công giao dịch #1024 - Khách khanhbui0205' },
    { id: 2, type: 'INFO', time: '15:10:02', text: 'Khởi tạo cổng thanh toán QR cho đơn hàng #8942, Số tiền: 250,000 VND' },
    { id: 3, type: 'DEBUG', time: '14:55:12', text: 'Thiết lập bắt tay kết nối (API handshake) thành công với cổng payos.vn' },
  ]);

  return (
    <div className="w-full max-w-5xl text-left space-y-8">
      {/* Intro info */}
      <div>
        <h1 className="font-headline text-3xl font-bold text-slate-800">
          Admin Control Center
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Hệ thống giám sát webhook, tổng lượng doanh số nạp và log máy chủ dành cho Ban Quản Trị.
        </p>
      </div>

      {/* Grid of administrative reports */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Tổng doanh thu test</span>
            <BarChart2 className="text-primary" size={18} />
          </div>
          <span className="text-2xl font-black text-slate-800 font-headline">350,000 VND</span>
          <span className="text-[10px] font-mono text-primary font-bold bg-primary/5 px-2 py-0.5 rounded border border-primary/10 ml-2">
            +100% tỷ lệ duyệt
          </span>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Webhook đã xử lý</span>
            <CheckCircle2 className="text-emerald-500" size={18} />
          </div>
          <span className="text-2xl font-black text-slate-800 font-headline">2 tín hiệu</span>
          <span className="text-[10px] text-slate-400 block mt-1">Từ 102.13.22.8 (PayOS IP)</span>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">CPU Webhook Node</span>
            <Cpu className="text-amber-500" size={18} />
          </div>
          <span className="text-2xl font-black text-slate-800 font-headline">0.05%</span>
          <span className="text-[10px] text-emerald-500 font-semibold block mt-1">● PHẢN HỒI 42ms (XUẤT SẮC)</span>
        </div>

      </div>

      {/* Webhook logs */}
      <div className="bg-slate-950 text-slate-300 rounded-xl border border-slate-800 p-6 md:p-8 font-mono text-xs space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
          <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 uppercase">
            <Server size={14} className="text-emerald-400" />
            <span>Xử lý Webhook Nhật Ký (Live Debugger)</span>
          </span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>

        <div className="space-y-3 leading-relaxed">
          {logs.map((log) => (
            <div key={log.id} className="flex gap-4 items-start select-none">
              <span className="text-slate-600 font-normal">{log.time}</span>
              <span className={`font-bold shrink-0 ${
                log.type === 'SUCCESS' ? 'text-emerald-400' : log.type === 'INFO' ? 'text-primary-container' : 'text-slate-400'
              }`}>
                [{log.type}]
              </span>
              <span className="text-slate-400 text-left flex-1">{log.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
