import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { XCircle, RefreshCw, MessageSquare } from 'lucide-react';

export default function FailedPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white border border-slate-200 rounded-[2.5rem] p-10 text-center shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-rose-500" />
        
        <div className="inline-flex items-center justify-center w-20 h-20 bg-rose-50 rounded-full mb-8 border border-rose-100 shadow-sm">
          <XCircle className="text-rose-500" size={48} />
        </div>

        <h1 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Thanh toán thất bại</h1>
        <p className="text-slate-500 mb-8 font-medium text-sm leading-relaxed">
          Rất tiếc, giao dịch của bạn đã bị hủy hoặc gặp lỗi trong quá trình xử lý. Đừng lo lắng, tiền của bạn vẫn an toàn.
        </p>

        <div className="flex flex-col gap-3">
          <Link 
            to="/" 
            className="flex items-center justify-center gap-3 bg-indigo-600 hover:bg-slate-900 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-indigo-900/20 text-xs uppercase tracking-widest"
          >
            <RefreshCw size={18} />
            THỬ LẠI GIAO DỊCH
          </Link>
          <button 
            onClick={() => alert('Vui lòng liên hệ GM qua Discord/Fanpage')}
            className="flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-bold py-4 rounded-2xl transition-all text-xs uppercase tracking-widest"
          >
            <MessageSquare size={18} />
            LIÊN HỆ HỖ TRỢ
          </button>
        </div>
      </motion.div>
    </div>
  );
}

