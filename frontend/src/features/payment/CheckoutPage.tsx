import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import {
  Copy,
  Check,
  RotateCw,
  Clock,
  Smartphone,
  CheckCircle2,
  Info
} from 'lucide-react';

import paymentService from '../../services/paymentService';
import type { PaymentTransaction } from '../../services/paymentService';
import minecraftService from '../../services/minecraftService';
import { toast } from 'react-hot-toast';

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<PaymentTransaction | null>(null);
  const [playerBalance, setPlayerBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number>(900); // Default 15 mins
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        if (!id) return;
        const data = await paymentService.getPaymentById(id);
        setTransaction(data);

        // Fetch realtime balance
        const mcUser = data.minecraftUsername || data.playerName;
        if (mcUser) {
          try {
            const balRes = await minecraftService.getPlayerBalance(mcUser);
            setPlayerBalance(balRes.balance);
          } catch (balErr) {
            console.warn('Could not fetch player balance');
          }
        }
        
        // Calculate remaining time
        const created = new Date(data.createdAt).getTime();
        const now = new Date().getTime();
        const diff = Math.floor((created + 15 * 60 * 1000 - now) / 1000);
        setTimeLeft(diff > 0 ? diff : 0);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Không thể tải thông tin thanh toán');
        navigate('/store');
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [id, navigate]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  // Auto check status every 3 seconds (backend actively queries PayOS)
  useEffect(() => {
    if (!transaction || transaction.status !== 'pending' || timeLeft <= 0) return;
    
    console.log('[POLLING] Starting auto-check for orderCode:', transaction.orderCode);
    
    const interval = setInterval(async () => {
      try {
        console.log('[POLLING] Checking status...');
        const { status } = await paymentService.getPaymentStatus(transaction.orderCode);
        console.log('[POLLING] Status received:', status);
        
        if (status === 'paid' || status === 'completed' || status === 'Completed') {
          clearInterval(interval);
          console.log('[POLLING] Payment confirmed! Redirecting...');
          toast.success('🎉 Thanh toán thành công! Đang chuyển hướng...');
          setTimeout(() => {
            navigate('/payment/success/' + transaction._id);
          }, 1500);
        } else if (status === 'cancelled' || status === 'failed') {
          clearInterval(interval);
          toast.error('Giao dịch đã bị hủy hoặc thất bại.');
          navigate('/payment/failed');
        }
      } catch (error) {
        console.error('[POLLING] Check status error:', error);
      }
    }, 5000); // Poll every 5 seconds as requested

    return () => {
      console.log('[POLLING] Cleanup interval');
      clearInterval(interval);
    };
  }, [transaction, timeLeft, navigate]);


  const formatTime = (seconds: number) => {
    if (seconds <= 0) return 'Hết hạn';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const triggerCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}`);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const checkStatusManually = async () => {
    if (!transaction || isChecking) return;
    setIsChecking(true);
    try {
      const { status } = await paymentService.checkPaymentStatus(transaction.orderCode);
      if (status === 'paid' || status === 'completed' || status === 'Completed') {
        toast.success('Thanh toán thành công!');
        navigate('/payment/success/' + transaction._id);
      } else {
        toast.error('Chưa nhận được thanh toán. Vui lòng thử lại sau vài giây.');
      }
    } catch (error) {
      toast.error('Có lỗi khi kiểm tra. Vui lòng thử lại.');
    } finally {
      setIsChecking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RotateCw className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (!transaction) return null;

  return (
    <div className="max-w-6xl mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main Payment Card */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            
            {/* Left: QR Section */}
            <div className="p-10 border-r border-slate-100 bg-slate-50/50 flex flex-col items-center justify-center space-y-8">
              <div className="text-center">
                <h3 className="text-xl font-extrabold text-slate-900 mb-2">Thanh toán VietQR</h3>
                <p className="text-slate-500 text-xs max-w-[240px] mx-auto font-medium">
                  Sử dụng ứng dụng Ngân hàng hoặc ví điện tử để quét mã QR bên dưới.
                </p>
              </div>

              {/* QR Code */}
              <div className="relative p-6 bg-white rounded-3xl shadow-xl border border-slate-100 transition-transform hover:scale-[1.02]">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(transaction.qrCode || '')}`} 
                  alt="Payment QR" 
                  className="w-48 h-48 md:w-56 md:h-56"
                />

                
                {/* Visual Corners */}
                <span className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-indigo-500/30"></span>
                <span className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-indigo-500/30"></span>
                <span className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-indigo-500/30"></span>
                <span className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-indigo-500/30"></span>
              </div>

              {/* Status & Countdown */}
              <div className="w-full flex flex-col items-center gap-4">
                <div className="flex items-center gap-3 px-5 py-2 bg-amber-50 text-amber-600 border border-amber-200 rounded-full shadow-sm">
                  <RotateCw size={14} className="animate-spin" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest">Đang chờ thanh toán</span>
                </div>
                
                {(!transaction.qrCode) && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-center">
                    <p className="text-[10px] text-rose-500 font-bold mb-2">Không thể tạo mã QR trực tiếp</p>
                    <a 
                      href={transaction.paymentUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-xs text-indigo-600 underline font-black"
                    >
                      Click vào đây để thanh toán tại PayOS
                    </a>
                  </div>
                )}

                <div className="flex items-center gap-2 text-slate-500 bg-white border border-slate-200 px-4 py-1.5 rounded-xl shadow-sm">

                  <Clock size={14} className="text-rose-500" />
                  <span className="text-[11px] font-bold uppercase tracking-tight">
                    Hết hạn sau: <span className="font-mono text-rose-600">{formatTime(timeLeft)}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Info Section */}
            <div className="p-10 flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Chi tiết đơn hàng</h4>
                  <p className="text-lg font-black text-slate-900 tracking-tight">Giao dịch nạp xu</p>
                </div>

                <div className="h-px bg-slate-100"></div>

                <div className="space-y-5">
                  {/* Package Info */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Sản phẩm</span>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-sm font-bold text-slate-700">
                        {transaction.item}
                      </span>
                    </div>
                  </div>

                  {/* Delivery destination */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Deliver To</span>
                      <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                        <span className="text-xs font-bold text-indigo-700">
                          {transaction.minecraftUsername || transaction.playerName || '—'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Số dư hiện tại</span>
                      <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                        <span className="text-xs font-bold text-emerald-700">
                          {playerBalance !== null ? `${playerBalance.toLocaleString('vi-VN')} Xu` : 'Đang tải...'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Recipient Account Number */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Số tài khoản</span>
                    <div 
                      onClick={() => triggerCopy(transaction.accountNumber || '', 'Số tài khoản')}
                      className="p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-500 transition-all cursor-pointer flex justify-between items-center group shadow-sm"
                    >
                      <div className="flex flex-col">
                        <span className="font-mono text-sm font-bold text-slate-800">{transaction.accountNumber || 'N/A'}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{transaction.bankName || 'Ngân hàng'}</span>
                      </div>
                      {copiedField === 'Số tài khoản' ? <Check size={16} className="text-emerald-500" /> : <Copy size={14} className="text-slate-400 group-hover:text-indigo-500" />}
                    </div>
                  </div>

                  {/* Recipient Name */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Người nhận</span>
                    <div 
                      onClick={() => triggerCopy(transaction.accountName || '', 'Tên người nhận')}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-500 transition-all cursor-pointer flex justify-between items-center group shadow-sm"
                    >
                      <span className="text-sm font-bold text-slate-700 uppercase">{transaction.accountName || 'N/A'}</span>
                      {copiedField === 'Tên người nhận' ? <Check size={16} className="text-emerald-500" /> : <Copy size={14} className="text-slate-400 group-hover:text-indigo-500" />}
                    </div>
                  </div>

                  {/* Transfer Content */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Nội dung chuyển khoản</span>
                    <div 
                      onClick={() => triggerCopy(transaction.description || transaction.orderCode.toString(), 'Nội dung')}
                      className="p-3 bg-amber-50/50 rounded-xl border border-amber-200 hover:border-indigo-500 transition-all cursor-pointer flex justify-between items-center group shadow-sm"
                    >
                      <span className="font-mono text-sm font-bold text-amber-700">{transaction.description || transaction.orderCode}</span>
                      {copiedField === 'Nội dung' ? <Check size={16} className="text-emerald-500" /> : <Copy size={14} className="text-amber-400 group-hover:text-indigo-500" />}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Số tiền thanh toán</span>
                    <div 
                      onClick={() => triggerCopy(transaction.amount.toString(), 'Số tiền')}
                      className="p-4 bg-indigo-50 rounded-xl border-2 border-indigo-200 hover:border-indigo-500 transition-all cursor-pointer flex justify-between items-center group shadow-md"
                    >
                      <span className="text-xl font-black text-indigo-600">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(transaction.amount)}
                      </span>
                      {copiedField === 'Số tiền' ? <Check size={20} className="text-emerald-500" /> : <Copy size={18} className="text-indigo-400 group-hover:text-indigo-600" />}
                    </div>
                  </div>

                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-3">
                    <p className="text-[10px] text-rose-500 leading-relaxed font-medium">
                      * Lưu ý: Vui lòng chuyển đúng số tiền và nội dung chuyển khoản như trên để hệ thống tự động xử lý nhanh nhất.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex flex-col gap-3">
                <button
                  onClick={checkStatusManually}
                  disabled={isChecking || timeLeft <= 0}
                  className="w-full bg-indigo-600 hover:bg-slate-900 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isChecking ? <RotateCw className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                  XÁC NHẬN ĐÃ CHUYỂN TIỀN
                </button>
                <a
                  href={transaction.paymentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 text-[10px] uppercase tracking-widest border border-slate-200"
                >
                  Mở trang PayOS gốc
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6 text-indigo-600">
              <Smartphone size={24} />
              <span className="font-black uppercase tracking-tight text-sm">Hướng dẫn nhanh</span>
            </div>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs shrink-0 shadow-sm border border-indigo-100">1</div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium pt-1">Mở ứng dụng ngân hàng hoặc ví điện tử quét mã VietQR.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs shrink-0 shadow-sm border border-indigo-100">2</div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium pt-1">Kiểm tra đúng số tiền và nội dung thanh toán tự động.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs shrink-0 shadow-sm border border-indigo-100">3</div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium pt-1">Xác nhận nạp và quay lại đây nhận Coin sau 30s.</p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex gap-4">
            <Info className="text-amber-500 shrink-0" size={20} />
            <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
              Nếu sau 10 phút vẫn chưa nhận được Xu, vui lòng liên hệ GM qua Discord/Fanpage để được hỗ trợ thủ công nhanh nhất.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

