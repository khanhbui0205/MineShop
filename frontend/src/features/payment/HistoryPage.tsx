import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, CheckCircle2, XCircle, Search, HelpCircle, AlertCircle, RotateCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import paymentService from '../../services/paymentService';
import type { PaymentTransaction } from '../../services/paymentService';
import { toast } from 'react-hot-toast';

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, [page, filter]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const statusFilter = filter === 'ALL' ? undefined : filter.toLowerCase();
      const data = await paymentService.getHistory(page, 10, statusFilter);
      setTransactions(data.transactions);
      setTotalPages(data.totalPages);
    } catch (error) {
      toast.error('Không thể tải lịch sử giao dịch');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full font-mono text-[10px] font-bold">
            <CheckCircle2 size={12} />
            <span>THÀNH CÔNG</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full font-mono text-[10px] font-bold">
            <Clock size={12} className="animate-pulse" />
            <span>CHỜ THANH TOÁN</span>
          </span>
        );
      case 'cancelled':
      case 'failed':
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full font-mono text-[10px] font-bold">
            <XCircle size={12} />
            <span>ĐÃ HỦY</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-500/10 text-slate-500 border border-slate-500/20 rounded-full font-mono text-[10px] font-bold">
            <span>{status.toUpperCase()}</span>
          </span>
        );
    }
  };

  const filteredTxs = transactions.filter((tx) => {
    const matchesSearch =
      tx.item.toLowerCase().includes(search.toLowerCase()) ||
      tx.orderCode?.toString().includes(search);
    return matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto w-full">

      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Lịch sử giao dịch</h1>
          <p className="text-slate-500 mt-2 font-medium">
            Quản lý và theo dõi các trạng thái giao dịch nạp Xu của bạn.
          </p>
        </div>

        <div className="flex gap-2 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
          {['ALL', 'PENDING', 'PAID', 'FAILED'].map((opt) => (
            <button
              key={opt}
              onClick={() => { setFilter(opt); setPage(1); }}
              className={`px-4 py-2 rounded-xl font-mono text-[10px] font-bold tracking-widest transition-all ${
                filter === opt
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20'
                  : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              {opt === 'ALL' ? 'TẤT CẢ' : opt === 'PENDING' ? 'CHỜ NẠP' : opt === 'PAID' ? 'THÀNH CÔNG' : 'THẤT BẠI'}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mb-8 group">
        <span className="absolute inset-y-0 left-4 flex items-center text-slate-400 group-focus-within:text-indigo-600 transition-colors">
          <Search size={18} />
        </span>
        <input
          type="text"
          placeholder="Tìm theo tên gói, mã đơn hàng..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full py-4 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400 shadow-sm"
        />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-24 flex flex-col items-center justify-center gap-4 text-slate-400">
            <RotateCw className="animate-spin text-indigo-600" size={32} />
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest">Đang tải dữ liệu...</p>
          </div>
        ) : filteredTxs.length === 0 ? (
          <div className="p-24 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 border border-slate-100">
              <AlertCircle size={32} />
            </div>
            <div>
              <p className="font-bold text-slate-900">Không có giao dịch nào</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-[280px] mx-auto leading-relaxed font-medium">
                Bạn chưa có giao dịch nạp tiền nào phù hợp với bộ lọc hiện tại.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[10px] font-mono text-slate-400 font-bold uppercase tracking-[0.2em] border-b border-slate-200">
                  <th className="py-5 px-8">Mã đơn</th>
                  <th className="py-5 px-8">Nội dung</th>
                  <th className="py-5 px-8">Số tiền</th>
                  <th className="py-5 px-8">Thời gian</th>
                  <th className="py-5 px-8">Trạng thái</th>
                  <th className="py-5 px-8 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredTxs.map((tx, idx) => (
                  <motion.tr
                    key={tx._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-slate-50/50 transition-colors group text-slate-600"
                  >
                    <td className="py-6 px-8 font-mono font-bold text-slate-400 group-hover:text-indigo-600">
                      #{tx.orderCode}
                    </td>
                    <td className="py-6 px-8">
                      <p className="font-extrabold text-slate-900">{tx.item}</p>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-bold">VietQR / PayOS</p>
                    </td>
                    <td className="py-6 px-8">
                      <p className="font-black text-indigo-600 text-sm">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tx.amount)}
                      </p>
                      <p className="text-[10px] text-amber-600 mt-1 font-bold">+{tx.coinsChange.toLocaleString()} Xu Lục Bảo</p>
                    </td>
                    <td className="py-6 px-8 text-slate-400 font-mono text-[10px]">
                      {new Date(tx.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-6 px-8">
                      {getStatusBadge(tx.status)}
                    </td>
                    <td className="py-6 px-8 text-center text-slate-600">
                      {(tx.status === 'pending') && (
                        <button
                          onClick={() => navigate('/payment/checkout/' + tx._id)}
                          className="px-4 py-2 bg-indigo-50 hover:bg-slate-900 text-indigo-600 hover:text-white border border-indigo-100 font-mono text-[10px] font-bold tracking-widest rounded-xl transition-all shadow-sm"
                        >
                          THANH TOÁN
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-10 h-10 rounded-2xl font-mono text-xs font-bold transition-all shadow-sm ${
                page === i + 1
                  ? 'bg-indigo-600 text-white shadow-indigo-600/20'
                  : 'bg-white text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      <div className="mt-12 p-8 bg-white border border-slate-200 rounded-3xl flex gap-6 text-xs text-slate-500 items-start shadow-lg">
        <HelpCircle size={24} className="text-indigo-600 shrink-0" />
        <div className="space-y-3">
          <p className="font-black text-slate-900 uppercase tracking-tight text-sm">Hỗ trợ tra soát giao dịch</p>
          <p className="leading-relaxed font-medium">
            Nếu giao dịch đã chuyển tiền thành công nhưng trạng thái vẫn chưa cập nhật sau 10 phút, vui lòng liên hệ GM qua Discord hoặc Fanpage kèm theo mã đơn hàng để được xử lý thủ công nhanh nhất.
          </p>
        </div>
      </div>
    </div>
  );
}

