import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, Home, History as HistoryIcon } from 'lucide-react';
import paymentService from '../../services/paymentService';
import type { PaymentTransaction } from '../../services/paymentService';

export default function SuccessPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<PaymentTransaction | null>(null);

  useEffect(() => {
    if (id) {
      paymentService.getPaymentById(id).then(setTransaction).catch(() => navigate('/store'));
    }
  }, [id, navigate]);

  if (!transaction) return null;

  return (
    <div className="flex-1 flex items-center justify-center p-4">

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white border border-slate-200 rounded-[2.5rem] p-10 md:p-12 text-center shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
        
        <div className="inline-flex items-center justify-center w-24 h-24 bg-emerald-50 rounded-full mb-8 relative border border-emerald-100 shadow-sm">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12, delay: 0.2 }}
          >
            <CheckCircle2 className="text-emerald-500" size={64} />
          </motion.div>
          
          <motion.div 
            animate={{ scale: [1, 1.4], opacity: [0.3, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 border-2 border-emerald-400 rounded-full"
          />
        </div>

        <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Thanh toán hoàn tất!</h1>
        <p className="text-slate-500 mb-8 font-medium text-sm">
          Cảm ơn bạn đã ủng hộ Emerald Realms. Xu đã được cộng trực tiếp vào tài khoản của bạn.
        </p>

        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 text-left space-y-4 mb-10">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold uppercase tracking-wider">Mã đơn hàng</span>
            <span className="text-slate-900 font-mono font-black">#{transaction.orderCode}</span>
          </div>
          {transaction.playerName && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wider">Nhân vật Minecraft</span>
              <span className="text-indigo-600 font-black">{transaction.playerName}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold uppercase tracking-wider">Mã giao dịch</span>
            <span className="text-slate-900 font-mono font-black text-[10px]">{transaction._id}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold uppercase tracking-wider">Gói nạp</span>
            <span className="text-slate-900 font-extrabold">{transaction.item}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold uppercase tracking-wider">Tổng tiền</span>
            <span className="text-indigo-600 font-black text-lg">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(transaction.amount)}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold uppercase tracking-wider">Xu nhận được</span>
            <span className="text-emerald-600 font-black text-base">+{transaction.coinsChange?.toLocaleString('vi-VN')} Xu</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold uppercase tracking-wider">Thời gian</span>
            <span className="text-slate-700 font-semibold">{new Date(transaction.createdAt).toLocaleString('vi-VN')}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold uppercase tracking-wider">Trạng thái cấp phát</span>
            <span className="text-emerald-600 font-black flex items-center gap-1">
              <CheckCircle2 size={12} />
              Hoàn tất
            </span>
          </div>
        </div>


        <div className="flex flex-col gap-3">
          <button 
            onClick={() => window.location.href = '/'}
            className="flex items-center justify-center gap-3 bg-indigo-600 hover:bg-slate-900 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-indigo-900/20 text-xs uppercase tracking-widest"
          >
            <Home size={18} />
            QUAY LẠI TRANG CHỦ
          </button>
          <button 
            onClick={() => navigate('/payment/history')}
            className="flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-bold py-4 rounded-2xl transition-all text-xs uppercase tracking-widest"
          >
            <HistoryIcon size={18} />
            LỊCH SỬ GIAO DỊCH
          </button>
        </div>
      </motion.div>
    </div>
  );
}

