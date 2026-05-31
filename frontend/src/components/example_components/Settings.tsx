/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Key, ShieldAlert, Check, RefreshCw, Eye, EyeOff, Server, HelpCircle } from 'lucide-react';

export default function Settings() {
  const [clientId, setClientId] = useState('payos_client_8af8d31a52b31cd9a2a5ff');
  const [apiKey, setApiKey] = useState('payos_api_9bf7d20b61a40ce818c3a1ff206c49');
  const [checksum, setChecksum] = useState('payos_checksum_fe3244910ea093dfcaee1903028d7b');
  const [webhookUrl, setWebhookUrl] = useState('https://mineportal.vn/api/webhooks/payos-handler');
  
  const [showApi, setShowApi] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const regenerateSecrets = () => {
    const randomHex = (len: number) => [...Array(len)].map(() => Math.floor(Math.random()*16).toString(16)).join('');
    setClientId(`payos_client_${randomHex(22)}`);
    setApiKey(`payos_api_${randomHex(30)}`);
    setChecksum(`payos_checksum_${randomHex(30)}`);
  };

  return (
    <div className="w-full max-w-2xl text-left">
      <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold text-slate-800">
          Cài đặt Cổng PayOS
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Quản lý khóa kết nối API PayOS và URL Webhook đối soát dành cho Quản trị viên máy chủ.
        </p>
      </div>

      <div className="space-y-6">
        {/* Form panel */}
        <form onSubmit={handleSave} className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 md:p-8 space-y-5 shadow-xs">
          
          <div className="flex justify-between items-center pb-2 border-b border-outline-variant mb-2">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Key size={14} className="text-primary" />
              <span>Cấu hình Khóa API</span>
            </span>
            <button
              type="button"
              onClick={regenerateSecrets}
              className="text-[10px] font-mono font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw size={10} />
              <span>Tạo lại Khóa Test</span>
            </button>
          </div>

          {/* Client ID */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">Client ID (Môi trường test)</label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-outline-variant/80 rounded-lg font-mono text-xs focus:border-primary outline-none"
            />
          </div>

          {/* Api key */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">API Key</label>
            <div className="relative">
              <input
                type={showApi ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full py-2 pl-3 pr-10 bg-slate-50 border border-outline-variant/80 rounded-lg font-mono text-xs focus:border-primary outline-none"
              />
              <button
                type="button"
                onClick={() => setShowApi(!showApi)}
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showApi ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Checksum KEY */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">Checksum Key (Mã hóa bảo mật SHA256)</label>
            <input
              type="text"
              value={checksum}
              readOnly
              className="w-full py-2 px-3 bg-slate-100 text-slate-500 border border-outline-variant/80 rounded-lg font-mono text-xs cursor-not-allowed outline-none"
            />
          </div>

          <div className="pt-2"></div>

          <div className="flex justify-between items-center pb-2 border-b border-outline-variant mb-2">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Server size={14} className="text-primary" />
              <span>Đường dẫn Webhook lắng nghe</span>
            </span>
          </div>

          {/* Webhook endpoint URL */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">Webhook URL (Nhận tín hiệu nạp tự động)</label>
            <input
              type="text"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-outline-variant/80 rounded-lg font-mono text-xs focus:border-primary outline-none"
              placeholder="https://tên-miền-của-bạn/api/webhooks"
            />
            <span className="text-[10px] text-slate-400 font-sans leading-relaxed">
              * Hệ thống PayOS sẽ kích hoạt lệnh POST đến URL này cùng dữ liệu hóa đơn ngay khi người chơi chuyển khoản thành công.
            </span>
          </div>

          {/* Submit action */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-primary hover:bg-emerald-700 text-on-primary font-mono text-xs font-bold rounded-lg shadow-sm active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              {saved ? (
                <>
                  <Check size={14} className="stroke-[3px]" />
                  <span>ĐÃ LƯU CẤU HÌNH</span>
                </>
              ) : (
                <span>LƯU THAY ĐỔI KPI</span>
              )}
            </button>
          </div>
        </form>

        {/* Security Alert notice */}
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 text-slate-600 flex gap-3 text-xs leading-relaxed">
          <ShieldAlert size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-slate-800 mb-1">Môi trường thử nghiệm an toàn</p>
            <p>
              Đây là giao diện cấu hình thử nghiệm giả lập (Sandbox). Mọi giao dịch được xử lý trong ứng dụng này là môi trường giả lập an toàn để kiểm thử giao diện cổng thanh toán PayOS đối với Cửa Hàng Máy Chủ Minecraft, không phát sinh chi phí thực tế.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
