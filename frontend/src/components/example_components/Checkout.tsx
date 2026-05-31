/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Copy,
  Check,
  RotateCw,
  Clock,
  HelpCircle,
  Smartphone,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Info
} from 'lucide-react';
import { Transaction, StoreItem } from '../types';

interface CheckoutProps {
  item: StoreItem;
  transaction: Transaction;
  onCancel: () => void;
  onSuccess: (updatedTx: Transaction) => void;
}

export default function Checkout({ item, transaction, onCancel, onSuccess }: CheckoutProps) {
  const [timeLeft, setTimeLeft] = useState<number>(transaction.timeLeft);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [simulatingPayment, setSimulatingPayment] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  // Format time (mm:ss)
  const formatTime = (seconds: number) => {
    if (seconds <= 0) return 'Hết hạn';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Clipboard copies
  const triggerCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setToastMessage(`Đã sao chép ${label}`);
    setCopiedField(label);
    
    // Clear toast
    setTimeout(() => {
      setToastMessage(null);
    }, 2000);

    setTimeout(() => {
      setCopiedField(null);
    }, 1500);
  };

  // Mock banking simulation
  const simulateAutoWebhook = () => {
    setSimulatingPayment(true);
    // Simulate some loading network state: 2.2 seconds later webhook triggers success
    setTimeout(() => {
      setSimulatingPayment(false);
      const updatedTx: Transaction = {
        ...transaction,
        status: 'SUCCESSFUL',
        timeLeft: timeLeft
      };
      onSuccess(updatedTx);
    }, 2200);
  };

  // Immediate confirmation button
  const confirmDirectTransfer = () => {
    const updatedTx: Transaction = {
      ...transaction,
      status: 'SUCCESSFUL',
      timeLeft: timeLeft
    };
    onSuccess(updatedTx);
  };

  return (
    <div className="w-full max-w-5xl">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-white py-3 px-6 rounded-full shadow-2xl z-[100] flex items-center gap-3"
          >
            <Check size={18} className="text-emerald-400 stroke-[3px]" />
            <span className="font-mono text-xs font-semibold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-6 text-slate-400 font-mono text-xs">
        <span className="hover:text-primary transition-colors cursor-pointer">Store</span>
        <span className="text-[12px] text-slate-300">/</span>
        <span className="text-primary font-bold">Checkout</span>
        <span className="text-[12px] text-slate-300">/</span>
        <span className="text-slate-500">{item.name}</span>
      </div>

      {/* Main Grid: Info + Transaction Gateway */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* PlayOS Checker Card */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden lg:col-span-8 self-stretch flex flex-col pointer-events-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 flex-1">
            
            {/* Left Side: QR Section */}
            <div className="p-8 border-r border-outline-variant bg-slate-50/50 flex flex-col items-center justify-center space-y-6 relative">
              <div className="text-center">
                <h3 className="font-headline text-lg font-bold text-slate-800 mb-1">
                  Quét mã QR để thanh toán
                </h3>
                <p className="text-slate-500 text-xs max-w-[210px] mx-auto leading-relaxed">
                  Sử dụng ứng dụng ngân hàng hoặc ví điện tử để quét mã.
                </p>
              </div>

              {/* QR Code Container with Emerald details */}
              <div className="relative p-5 bg-white rounded-2xl shadow-md border border-slate-100 flex items-center justify-center">
                <div className="relative w-44 h-44 md:w-52 md:h-52 flex items-center justify-center bg-slate-100/30 rounded-lg overflow-hidden">
                  
                  {/* Generated QR visual */}
                  <svg viewBox="0 0 100 100" className="w-full h-full p-2 text-slate-900">
                    <line x1="0" y1="0" x2="100" y2="100" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3"/>
                    <line x1="100" y1="0" x2="0" y2="100" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3"/>
                    
                    {/* Corner anchors */}
                    <rect x="5" y="5" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="5"/>
                    <rect x="10" y="10" width="10" height="10" fill="currentColor"/>
                    
                    <rect x="75" y="5" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="5"/>
                    <rect x="80" y="10" width="10" height="10" fill="currentColor"/>
                    
                    <rect x="5" y="75" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="5"/>
                    <rect x="10" y="80" width="10" height="10" fill="currentColor"/>
                    
                    {/* Mini code pieces */}
                    <rect x="35" y="35" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3"/>
                    <rect x="53" y="35" width="12" height="12" fill="currentColor"/>
                    <rect x="35" y="53" width="12" height="12" fill="currentColor"/>
                    <rect x="53" y="53" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3"/>
                    
                    {/* Noise pixels */}
                    <rect x="35" y="10" width="8" height="8" fill="currentColor"/>
                    <rect x="55" y="15" width="5" height="12" fill="currentColor"/>
                    <rect x="15" y="35" width="12" height="6" fill="currentColor"/>
                    <rect x="75" y="45" width="10" height="10" fill="currentColor"/>
                    <rect x="45" y="75" width="12" height="10" fill="currentColor"/>
                    <rect x="75" y="75" width="15" height="10" fill="currentColor"/>
                    <rect x="15" y="55" width="6" height="12" fill="currentColor"/>
                    
                    {/* Logo block in center */}
                    <g transform="translate(38,38)">
                      <rect x="1" y="1" width="22" height="22" rx="4" fill="#006c49" stroke="#ffffff" strokeWidth="2" />
                      <path d="M7 16V8h3l2 4 2-4h3v8h-2.5v-4.5L12 13l-2.5-1.5V16H7z" fill="#ffffff" transform="scale(0.9) translate(1,1)" />
                    </g>
                  </svg>

                  {/* Scanning aesthetic alignment */}
                  <div className="scan-line"></div>
                </div>

                {/* Simulated corners */}
                <span className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-primary"></span>
                <span className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-primary"></span>
                <span className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-primary"></span>
                <span className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-primary"></span>
              </div>

              {/* Status and Clock */}
              <div className="w-full flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-50 text-amber-800 border border-amber-200/50 rounded-full">
                  <RotateCw size={14} className="animate-spin" />
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider">
                    Chờ thanh toán
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Clock size={14} />
                  <span className="text-xs">
                    Hết hạn trong: <span className="font-mono font-bold text-error">{formatTime(timeLeft)}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right Side: Details Section */}
            <div className="p-8 flex flex-col justify-between">
              
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      CHI TIẾT THANH TOÁN
                    </h4>
                    <p className="font-headline text-lg font-bold text-slate-800">
                      Chuyển khoản Ngân hàng
                    </p>
                  </div>
                  <div className="px-2.5 py-1 bg-emerald-50 rounded border border-emerald-200 flex items-center select-none shadow-xs">
                    <span className="font-mono text-[10px] font-extrabold text-primary tracking-tight">VQRpay</span>
                  </div>
                </div>

                <div className="h-[1px] bg-outline-variant/60"></div>

                <div className="space-y-4">
                  {/* Beneficiary */}
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-400 text-xs">Tên người thụ hưởng</span>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-outline-variant/60">
                      <span className="font-mono text-xs font-bold text-slate-800 uppercase">
                        {transaction.accountName}
                      </span>
                    </div>
                  </div>

                  {/* Account Number */}
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-400 text-xs">Số tài khoản</span>
                    <div
                      onClick={() => triggerCopy(transaction.accountNumber, 'Số tài khoản')}
                      className="p-2.5 bg-slate-50 rounded-lg border border-outline-variant/60 hover:border-primary transition-colors cursor-pointer flex justify-between items-center group"
                    >
                      <span className="font-mono text-xs font-semibold text-slate-800">
                        {transaction.accountNumber}
                      </span>
                      {copiedField === 'Số tài khoản' ? (
                        <Check size={14} className="text-primary stroke-[3px]" />
                      ) : (
                        <Copy size={13} className="text-slate-400 group-hover:text-primary transition-colors" />
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-400 text-xs">Số tiền thanh toán</span>
                    <div
                      onClick={() => triggerCopy(transaction.amount.toString(), 'Số tiền')}
                      className="p-2.5 bg-slate-50 rounded-lg border border-outline-variant/60 hover:border-primary transition-colors cursor-pointer flex justify-between items-center group"
                    >
                      <span className="font-headline text-sm font-black text-primary">
                        {transaction.amount.toLocaleString()} VND
                      </span>
                      {copiedField === 'Số tiền' ? (
                        <Check size={14} className="text-emerald-500 stroke-[3px]" />
                      ) : (
                        <Copy size={13} className="text-slate-400 group-hover:text-primary transition-colors" />
                      )}
                    </div>
                  </div>

                  {/* Transfer Content */}
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-400 text-xs">Nội dung chuyển khoản (Quan trọng)</span>
                    <div
                      onClick={() => triggerCopy(transaction.reference, 'Nội dung')}
                      className="p-3 bg-primary/5 hover:bg-primary/10 border-2 border-primary rounded-lg transition-all cursor-pointer flex justify-between items-center group"
                    >
                      <span className="font-mono text-sm font-black text-primary tracking-wide">
                        {transaction.reference}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-[10px] font-bold text-primary uppercase select-none">
                          {copiedField === 'Nội dung' ? 'ĐÃ COPY' : 'SAO CHÉP'}
                        </span>
                        {copiedField === 'Nội dung' ? (
                          <Check size={14} className="text-primary stroke-[3px]" />
                        ) : (
                          <Copy size={13} className="text-primary" />
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] text-error font-sans italic mt-0.5 font-medium leading-tight">
                      * Vui lòng nhập chính xác nội dung để đơn hàng được duyệt tự động.
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 mt-6 border-t border-outline-variant/60 flex gap-4">
                <button
                  onClick={onCancel}
                  className="flex-1 py-2.5 rounded-lg border border-outline-variant font-mono text-xs font-semibold text-slate-500 hover:bg-slate-50 active:scale-[0.98] transition-all cursor-pointer text-center"
                >
                  Hủỷ thanh toán
                </button>
                <button
                  onClick={confirmDirectTransfer}
                  className="flex-1 py-2.5 rounded-lg bg-primary text-on-primary font-mono text-xs font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all cursor-pointer shadow-sm shadow-primary/15 whitespace-nowrap"
                >
                  Xác nhận đã chuyển
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Sandbox Simulation Widget Panel */}
        <div className="lg:col-span-4 w-full flex flex-col gap-6">
          {/* Interactive Simulation Dashboard */}
          <div className="bg-slate-900 text-slate-200 rounded-xl border border-slate-800 p-6 shadow-md relative overflow-hidden flex flex-col">
            <span className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-xl pointer-events-none"></span>
            
            <div className="flex items-center gap-2 mb-4 text-emerald-400 font-bold font-sans text-xs uppercase tracking-wider">
              <Smartphone size={16} />
              <span>GIẢ LẬP GIAO DỊCH PAYOS</span>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Không cần chuyển tiền thật! Trình giả lập này cho phép bạn giả lập hành động quét mã trên điện thọai của người chơi và kiểm tra phản hồi webhook tức thời.
            </p>

            <div className="bg-slate-950 rounded-lg p-4 border border-slate-800/80 mb-5 text-left space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-mono">Order Code:</span>
                <span className="font-mono text-emerald-400 font-semibold">#{transaction.orderCode}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-mono">Gói mua:</span>
                <span className="font-sans font-semibold text-slate-300 max-w-[150px] truncate block text-right">{item.name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-mono">Dịch vụ PayOS:</span>
                <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded font-mono text-[9px] font-bold border border-emerald-500/20">LIVE ACTIVE</span>
              </div>
            </div>

            <button
              onClick={simulateAutoWebhook}
              disabled={simulatingPayment}
              className={`w-full py-3 rounded-lg font-mono text-xs font-semibold tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
                simulatingPayment
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/10 active:scale-[0.98]'
              }`}
            >
              {simulatingPayment ? (
                <>
                  <RotateCw size={14} className="animate-spin" />
                  <span>ĐANG GIẢ LẬP WEBHOOK...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>⚡ QUÉT & THANH TOÁN (GIẢ LẬP)</span>
                </>
              )}
            </button>

            {simulatingPayment && (
              <div className="mt-3 text-center">
                <span className="text-[10px] text-emerald-400 font-mono animate-pulse">
                  Gửi tín hiệu IPN thành công! Đang chờ đối soát ngân hàng...
                </span>
              </div>
            )}
          </div>

          {/* Quick Informational Tip Card */}
          <div className="bg-surface-container rounded-xl border border-outline-variant p-5 text-slate-600 flex gap-3 text-xs">
            <Info size={18} className="text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800 mb-1">Cơ chế Nạp Tự động</p>
              <p className="leading-relaxed">
                Máy chủ sẽ lắng nghe cổng thông tin Webhook của PayOS. Ngay khi tiền về tài khoản ngân hàng, Credits sẽ được cộng cho nhân vật tại sảnh chờ trong vòng 3 giây mà không cần Admin can thiệp thủ công.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Instructions Section */}
      <div className="mt-8 p-6 bg-surface-container-low rounded-xl border border-outline-variant">
        <h5 className="font-headline text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
          <HelpCircle size={18} className="text-primary" />
          Hướng dẫn thanh toán
        </h5>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs select-none">
              1
            </div>
            <div className="space-y-1">
              <p className="font-bold text-slate-800 text-sm">Mở ứng dụng</p>
              <p className="text-slate-500 text-xs leading-relaxed">
                Mở ứng dụng ngân hàng di động hoặc ví điện tử (MoMo, ZaloPay, Vietcombank, v.v.)
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs select-none">
              2
            </div>
            <div className="space-y-1">
              <p className="font-bold text-slate-800 text-sm">Quét mã QR</p>
              <p className="text-slate-500 text-xs leading-relaxed">
                Chọn tính năng "Quét mã QR/VNPAY-QR" trên app và căn chỉnh camera vào vùng chứa mã ở bên trái.
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs select-none">
              3
            </div>
            <div className="space-y-1">
              <p className="font-bold text-slate-800 text-sm">Kiểm tra thông tin</p>
              <p className="text-slate-500 text-xs leading-relaxed">
                Đảm bảo số tiền nạp khớp hiển thị và nhập chuẩn nội dung bắt buộc để kích hoạt tự động.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
