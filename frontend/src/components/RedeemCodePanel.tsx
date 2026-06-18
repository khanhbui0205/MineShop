import { useEffect, useState, type FormEvent } from 'react';
import { Gift, History, Loader2, Ticket, UserCheck } from 'lucide-react';
import api from '../lib/api';
import type { CodeRedemption, RedeemCode } from '../types';

interface RedeemCodePanelProps {
  accountUsername: string;
  onBalanceChange?: (balance: number) => void;
}

function formatReward(code?: RedeemCode | string) {
  if (!code || typeof code === 'string') return 'Reward';
  if (code.rewardType === 'COIN') return `${Number(code.coinAmount || 0).toLocaleString('vi-VN')} Coins`;
  return (code.items || []).map((item) => `${item.material} x${item.amount}`).join(', ');
}

function statusClass(status: string) {
  if (status === 'COMPLETED') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'FAILED') return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

export default function RedeemCodePanel({ accountUsername, onBalanceChange }: RedeemCodePanelProps) {
  const [code, setCode] = useState('');
  const [history, setHistory] = useState<CodeRedemption[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await api.get('/redeem/history');
      setHistory(res.data.history || []);
    } catch (error) {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode || loading) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await api.post('/redeem', { code: normalizedCode });
      setMessage({ type: 'success', text: res.data.message || 'Redeem code thành công' });
      setCode('');
      if (typeof res.data.balance === 'number') onBalanceChange?.(res.data.balance);
      await loadHistory();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Không thể redeem code',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-950 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-200 text-xs font-black uppercase tracking-widest mb-2">
                <Ticket className="w-4 h-4" />
                Redeem Code
              </div>
              <h2 className="text-2xl font-black tracking-tight">Nhập code nhận thưởng</h2>
              <p className="text-sm text-slate-300 mt-2 max-w-2xl">
                Reward sẽ luôn được gửi đến username tài khoản đang đăng nhập.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white/10 border border-white/10 rounded-xl px-4 py-3">
              <UserCheck className="w-5 h-5 text-emerald-300" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Player</p>
                <p className="font-black text-white">{accountUsername}</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
              Tên code
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="WELCOME"
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 font-black tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={loading || !code.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-200 hover:bg-slate-950 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
                Redeem
              </button>
            </div>
          </div>

          {message && (
            <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
              message.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}>
              {message.text}
            </div>
          )}
        </form>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Lịch sử redeem</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Reward</th>
                <th className="px-6 py-3">Trạng thái</th>
                <th className="px-6 py-3 text-right">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historyLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-500">Đang tải lịch sử...</td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-500">Chưa có lượt redeem nào.</td>
                </tr>
              ) : history.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-black text-slate-900">{item.code}</td>
                  <td className="px-6 py-4 text-slate-600">{formatReward(item.codeId)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black ${statusClass(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-500">
                    {new Date(item.redeemedAt).toLocaleString('vi-VN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
