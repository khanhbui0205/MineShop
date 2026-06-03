import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Search, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  RefreshCw, 
  Save, 
  Key, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import api from '../lib/api';
import { toast } from 'react-hot-toast';
import { formatVND } from '../lib/utils';

interface PaymentConfig {
  clientId: string;
  apiKey: string;
  checksumKey: string;
}

export default function PaymentAdmin() {
  const [config, setConfig] = useState<PaymentConfig>({
    clientId: '',
    apiKey: '',
    checksumKey: ''
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTxs, setLoadingTxs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'transactions' | 'config'>('transactions');

  useEffect(() => {
    fetchConfig();
    fetchTransactions();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data } = await api.get('/admin/payment-config');
      setConfig(data || { clientId: '', apiKey: '', checksumKey: '' });
    } catch (error) {
      console.error('Failed to fetch config');
    } finally {
      // Done fetching
    }
  };

  const fetchTransactions = async () => {
    setLoadingTxs(true);
    try {
      const { data } = await api.get('/admin/stats/transactions'); // We'll need to implement this
      setTransactions(data);
    } catch (error) {
      toast.error('Không thể tải lịch sử giao dịch');
    } finally {
      setLoadingTxs(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/admin/payment-config', config);
      toast.success('Đã lưu cấu hình PayOS thành công!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConfig = async () => {
    setTesting(true);
    try {
      const { data } = await api.post('/admin/payment-config/test');
      if (data.status === 'OK') {
        toast.success('Kết nối PayOS thành công!');
      } else {
        toast.error('Kết nối PayOS không hợp lệ');
      }
    } catch (error: any) {
      toast.error('Lỗi kết nối PayOS: ' + (error.response?.data?.message || 'Unknown'));
    } finally {
      setTesting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] uppercase font-bold border border-emerald-500/20">
            <CheckCircle2 size={10} /> THÀNH CÔNG
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded text-[10px] uppercase font-bold border border-amber-500/20">
            <Clock size={10} /> ĐANG CHỜ
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded text-[10px] uppercase font-bold border border-rose-500/20">
            <XCircle size={10} /> {status.toUpperCase()}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 p-1 bg-white/5 border border-white/10 rounded-xl w-fit">
        <button
          onClick={() => setActiveSubTab('transactions')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'transactions' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
          }`}
        >
          Lịch sử giao dịch
        </button>
        <button
          onClick={() => setActiveSubTab('config')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'config' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
          }`}
        >
          Cấu hình PayOS
        </button>
      </div>

      {activeSubTab === 'transactions' ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CreditCard className="text-indigo-400" size={20} />
              <h3 className="font-bold text-white uppercase tracking-wider text-sm">Giao dịch toàn hệ thống</h3>
            </div>
            
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input 
                  type="text" 
                  placeholder="Tìm giao dịch..." 
                  className="bg-white/5 border border-white/10 rounded-lg py-1.5 pl-9 pr-4 text-xs focus:ring-1 focus:ring-indigo-500 outline-none w-64"
                />
              </div>
              <button 
                onClick={fetchTransactions}
                className="p-1.5 bg-white/5 border border-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <RefreshCw size={16} className={loadingTxs ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/[0.02] text-[10px] text-slate-500 font-bold uppercase tracking-widest border-b border-white/5">
                  <th className="py-4 px-6">Người dùng</th>
                  <th className="py-4 px-6">Sản phẩm</th>
                  <th className="py-4 px-6">Số tiền</th>
                  <th className="py-4 px-6">Mã PayOS</th>
                  <th className="py-4 px-6">Thời gian</th>
                  <th className="py-4 px-6 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loadingTxs ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="py-6 px-6">
                        <div className="h-4 bg-white/5 rounded w-full"></div>
                      </td>
                    </tr>
                  ))
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-slate-500 text-sm">
                      <p>Chưa có giao dịch PayOS nào</p>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-white/[0.02] transition-colors text-xs">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                            {tx.userId?.username?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-white">{tx.userId?.username}</p>
                            <p className="text-[10px] text-slate-500">{tx.userId?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-300 font-medium">
                        {tx.item}
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-indigo-400 font-bold">{formatVND(tx.amount)}</p>
                        <p className="text-[10px] text-amber-500">+{tx.coinsChange.toLocaleString()} Xu</p>
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-500">
                        #{tx.orderCode}
                      </td>
                      <td className="py-4 px-6 text-slate-400 font-mono">
                        {new Date(tx.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center">
                          {getStatusBadge(tx.status)}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-6">
          <form onSubmit={handleSaveConfig} className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-8 shadow-xl">
            <div className="flex items-center gap-4 text-indigo-400 mb-2">
              <Key size={24} />
              <h3 className="font-bold text-white uppercase tracking-wider text-lg">Cấu hình PayOS API</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">CLIENT ID</label>
                <input 
                  type="text" 
                  value={config.clientId}
                  onChange={(e) => setConfig({...config, clientId: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all placeholder:text-slate-700 font-mono"
                  placeholder="Nhập Client ID..."
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">API KEY</label>
                <input 
                   type="password" 
                   value={config.apiKey}
                   onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                   className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all placeholder:text-slate-700 font-mono"
                   placeholder="Nhập API Key..."
                   autoComplete="off"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">CHECKSUM KEY</label>
                <input 
                   type="password" 
                   value={config.checksumKey}
                   onChange={(e) => setConfig({...config, checksumKey: e.target.value})}
                   className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all placeholder:text-slate-700 font-mono"
                   placeholder="Nhập Checksum Key..."
                   autoComplete="off"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">WEBHOOK URL</label>
                <input 
                   type="text" 
                   value={(config as any).webhookUrl || ''}
                   onChange={(e) => setConfig({...config, webhookUrl: e.target.value} as any)}
                   className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all placeholder:text-slate-700 font-mono text-indigo-400"
                   placeholder="https://your-domain.com/api/payment/webhook"
                   autoComplete="off"
                />
                <p className="text-[10px] text-slate-500 mt-1 pl-1">URL này dùng để nhận thông báo thanh toán thành công tự động.</p>
              </div>
            </div>


            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 flex gap-4">
              <ShieldCheck className="text-indigo-400 shrink-0" size={20} />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Thông tin API Key được mã hóa trước khi lưu vào Database. Vui lòng lấy thông tin từ dashboard PayOS và điền chính xác để hệ thống có thể kết nối.
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                type="submit"
                disabled={saving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                LƯU CẤU HÌNH
              </button>
              <button 
                type="button"
                onClick={handleTestConfig}
                disabled={testing}
                className="px-8 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {testing ? <RefreshCw className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                KIỂM TRA KẾT NỐI
              </button>
            </div>
          </form>

          <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-6 flex gap-4">
            <AlertCircle className="text-rose-500 shrink-0" size={20} />
            <div>
              <p className="text-sm font-bold text-rose-200 mb-1">Cảnh báo Webhook</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sau khi cấu hình, hãy đảm bảo bạn đã điền đúng URL Webhook trong trang quản trị PayOS của bạn: 
                <span className="font-mono text-indigo-400 ml-1">https://your-domain.com/api/payment/webhook</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
