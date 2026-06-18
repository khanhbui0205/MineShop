import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  CheckCircle2,
  Edit2,
  Loader2,
  Plus,
  Power,
  Trash2,
  X,
} from 'lucide-react';
import api from '../lib/api';
import type { CodeRedemption, RedeemCode, RedeemItem } from '../types';

interface CodeForm {
  code: string;
  name: string;
  description: string;
  rewardType: 'COIN' | 'ITEM';
  coinAmount: number;
  items: RedeemItem[];
  commands: string;
  maxUses: number;
  isActive: boolean;
  newbieOnly: boolean;
  maxPlayerAgeDays: number;
  startDate: string;
  endDate: string;
}

const emptyForm: CodeForm = {
  code: '',
  name: '',
  description: '',
  rewardType: 'COIN',
  coinAmount: 10000,
  items: [{ material: 'DIAMOND', amount: 1 }] as RedeemItem[],
  commands: 'eco give {player} 10000',
  maxUses: 0,
  isActive: true,
  newbieOnly: false,
  maxPlayerAgeDays: 7,
  startDate: '',
  endDate: '',
};

function toDateInput(value?: string | null) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

function formatReward(code: RedeemCode) {
  if (code.rewardType === 'COIN') return `${Number(code.coinAmount || 0).toLocaleString('vi-VN')} Coins`;
  return code.items.map((item) => `${item.material} x${item.amount}`).join(', ');
}

function buildCoinCommand(coinAmount: number) {
  return `eco give {player} ${Number(coinAmount || 0)}`;
}

function buildItemCommands(items: RedeemItem[]) {
  return items
    .map((item) => {
      const material = String(item.material || '').trim().toLowerCase() || 'diamond';
      const amount = Number(item.amount || 1);
      return `give {player} ${material} ${amount}`;
    })
    .join('\n');
}

function isAutoCoinCommand(command: string) {
  return /^eco give \{player\} \d+$/i.test(command.trim());
}

function shouldSyncItemCommands(command: string, items: RedeemItem[]) {
  return !command.trim() || command.trim() === buildItemCommands(items).trim();
}

export default function RedeemCodeAdmin() {
  const [codes, setCodes] = useState<RedeemCode[]>([]);
  const [redemptions, setRedemptions] = useState<CodeRedemption[]>([]);
  const [stats, setStats] = useState({
    totalCodes: 0,
    totalRedeems: 0,
    activeCodes: 0,
    expiredCodes: 0,
    pendingRewards: 0,
    completedRewards: 0,
  });
  const [form, setForm] = useState<CodeForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadCodes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/codes');
      setCodes(res.data.codes || []);
      setRedemptions(res.data.redemptions || []);
      setStats(res.data.stats || stats);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Không thể tải redeem codes' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCodes();
  }, []);

  const activeSummary = useMemo(() => [
    ['Tổng code', stats.totalCodes],
    ['Tổng redeem', stats.totalRedeems],
    ['Đang hoạt động', stats.activeCodes],
    ['Hết hạn', stats.expiredCodes],
    ['Reward chờ xử lý', stats.pendingRewards],
    ['Reward đã cấp', stats.completedRewards],
  ], [stats]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, commands: buildCoinCommand(emptyForm.coinAmount), items: [{ material: 'DIAMOND', amount: 1 }] });
    setModalOpen(true);
  };

  const openEdit = (code: RedeemCode) => {
    setEditingId(code._id);
    setForm({
      code: code.code,
      name: code.name,
      description: code.description || '',
      rewardType: code.rewardType,
      coinAmount: code.coinAmount || 0,
      items: code.items?.length ? code.items : [{ material: 'DIAMOND', amount: 1 }],
      commands: code.commands?.length
        ? code.commands.join('\n')
        : (code.rewardType === 'COIN'
          ? buildCoinCommand(code.coinAmount || 0)
          : buildItemCommands(code.items || [])),
      maxUses: code.maxUses || 0,
      isActive: code.isActive,
      newbieOnly: code.newbieOnly,
      maxPlayerAgeDays: code.maxPlayerAgeDays || 7,
      startDate: toDateInput(code.startDate),
      endDate: toDateInput(code.endDate),
    });
    setModalOpen(true);
  };

  const updateItem = (index: number, patch: Partial<RedeemItem>) => {
    setForm((current) => {
      const nextItems = current.items.map((item, itemIndex) => (
        itemIndex === index ? { ...item, ...patch } : item
      ));

      return {
        ...current,
        items: nextItems,
        commands: current.rewardType === 'ITEM' && shouldSyncItemCommands(current.commands, current.items)
          ? buildItemCommands(nextItems)
          : current.commands,
      };
    });
  };

  const submitForm = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const payload = {
      ...form,
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      coinAmount: Number(form.coinAmount),
      maxUses: Number(form.maxUses),
      maxPlayerAgeDays: Number(form.maxPlayerAgeDays),
      items: form.items.map((item) => ({
        material: item.material.trim().toUpperCase(),
        amount: Number(item.amount),
      })),
      commands: form.commands.split('\n').map((command) => command.trim()).filter(Boolean),
      startDate: form.startDate || null,
      endDate: form.endDate || null,
    };

    try {
      if (editingId) {
        await api.put(`/admin/codes/${editingId}`, payload);
        setMessage({ type: 'success', text: 'Đã cập nhật code' });
      } else {
        await api.post('/admin/codes', payload);
        setMessage({ type: 'success', text: 'Đã tạo code mới' });
      }
      setModalOpen(false);
      await loadCodes();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Lưu code thất bại' });
    } finally {
      setSaving(false);
    }
  };

  const toggleCode = async (code: RedeemCode) => {
    try {
      await api.put(`/admin/codes/${code._id}`, { ...code, isActive: !code.isActive });
      await loadCodes();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Không thể bật tắt code' });
    }
  };

  const deleteCode = async (code: RedeemCode) => {
    if (!window.confirm(`Xóa code ${code.code}?`)) return;
    try {
      await api.delete(`/admin/codes/${code._id}`);
      await loadCodes();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Không thể xóa code' });
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Đang tải redeem codes...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-white">Redeem Code</h3>
          <p className="text-sm text-slate-400 mt-1">Quản lý code, reward và lịch sử sử dụng.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white hover:bg-indigo-500"
        >
          <Plus className="w-4 h-4" />
          Tạo code
        </button>
      </div>

      {message && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
          message.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
        }`}>
          {message.text}
        </div>
      )}

      <section className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {activeSummary.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
            <p className="mt-2 text-xl font-black text-white">{Number(value || 0).toLocaleString('vi-VN')}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-widest text-slate-400">
              <tr>
                <th className="px-5 py-4">Code</th>
                <th className="px-5 py-4">Reward</th>
                <th className="px-5 py-4 text-center">Lượt dùng</th>
                <th className="px-5 py-4 text-center">Tân thủ</th>
                <th className="px-5 py-4 text-center">Trạng thái</th>
                <th className="px-5 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {codes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">Chưa có redeem code.</td>
                </tr>
              ) : codes.map((code) => (
                <tr key={code._id} className="hover:bg-white/5">
                  <td className="px-5 py-4">
                    <p className="font-black text-white">{code.code}</p>
                    <p className="text-xs text-slate-500">{code.name}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-300">{formatReward(code)}</td>
                  <td className="px-5 py-4 text-center text-slate-300">
                    {code.usedCount.toLocaleString('vi-VN')} / {code.maxUses > 0 ? code.maxUses.toLocaleString('vi-VN') : '∞'}
                  </td>
                  <td className="px-5 py-4 text-center">
                    {code.newbieOnly ? (
                      <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-black text-amber-300">
                        {code.maxPlayerAgeDays} ngày
                      </span>
                    ) : (
                      <span className="text-slate-600">Không</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-black ${
                      code.isActive ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {code.isActive ? 'ON' : 'OFF'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => toggleCode(code)} className="rounded-lg border border-white/10 p-2 text-slate-400 hover:text-emerald-300">
                        <Power className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEdit(code)} className="rounded-lg border border-white/10 p-2 text-slate-400 hover:text-indigo-300">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteCode(code)} className="rounded-lg border border-white/10 p-2 text-slate-400 hover:text-rose-300">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-indigo-300" />
          <h4 className="font-black text-white">Lịch sử sử dụng gần nhất</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-widest text-slate-400">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Trạng thái</th>
                <th className="px-5 py-3 text-right">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {redemptions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-slate-500">Chưa có lịch sử redeem.</td>
                </tr>
              ) : redemptions.map((item) => (
                <tr key={item._id}>
                  <td className="px-5 py-3 font-bold text-white">{item.username}</td>
                  <td className="px-5 py-3 text-slate-300">{item.code}</td>
                  <td className="px-5 py-3 text-slate-300">{item.status}</td>
                  <td className="px-5 py-3 text-right text-slate-500">{new Date(item.redeemedAt).toLocaleString('vi-VN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form onSubmit={submitForm} className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#1a2030] p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4 mb-6">
              <h4 className="text-lg font-black text-white">{editingId ? 'Sửa redeem code' : 'Tạo redeem code'}</h4>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg p-2 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-1.5">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Tên code</span>
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white font-black uppercase" required />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Tên hiển thị</span>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" required />
              </label>
            </div>

            <label className="mt-4 block space-y-1.5">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Mô tả</span>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
            </label>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-1.5">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Loại thưởng</span>
                <select
                  value={form.rewardType}
                  onChange={(e) => {
                    const rewardType = e.target.value as 'COIN' | 'ITEM';
                    setForm({
                      ...form,
                      rewardType,
                      commands: rewardType === 'COIN'
                        ? buildCoinCommand(form.coinAmount || 0)
                        : buildItemCommands(form.items),
                    });
                  }}
                  className="admin-select w-full rounded-xl border border-white/10 px-4 py-3"
                >
                  <option value="COIN">COIN</option>
                  <option value="ITEM">ITEM</option>
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Giới hạn lượt dùng</span>
                <input type="number" min={0} value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: Number(e.target.value) })} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
              </label>
            </div>

            {form.rewardType === 'COIN' ? (
              <label className="mt-4 block space-y-1.5">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Số coin</span>
                <input
                  type="number"
                  min={1}
                  value={form.coinAmount}
                  onChange={(e) => {
                    const coinAmount = Number(e.target.value);
                    setForm({
                      ...form,
                      coinAmount,
                      commands: isAutoCoinCommand(form.commands)
                        ? buildCoinCommand(coinAmount)
                        : form.commands,
                    });
                  }}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
                  required
                />
              </label>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">Items</span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextItems = [...form.items, { material: '', amount: 1 }];
                      setForm({
                        ...form,
                        items: nextItems,
                        commands: shouldSyncItemCommands(form.commands, form.items)
                          ? buildItemCommands(nextItems)
                          : form.commands,
                      });
                    }}
                    className="text-xs font-black text-indigo-300"
                  >
                    + Thêm item
                  </button>
                </div>
                {form.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-[1fr_120px_40px] gap-2">
                    <input value={item.material} onChange={(e) => updateItem(index, { material: e.target.value.toUpperCase() })} placeholder="DIAMOND" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white uppercase" required />
                    <input type="number" min={1} value={item.amount} onChange={(e) => updateItem(index, { amount: Number(e.target.value) })} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" required />
                    <button
                      type="button"
                      onClick={() => {
                        const nextItems = form.items.filter((_, itemIndex) => itemIndex !== index);
                        setForm({
                          ...form,
                          items: nextItems,
                          commands: shouldSyncItemCommands(form.commands, form.items)
                            ? buildItemCommands(nextItems)
                            : form.commands,
                        });
                      }}
                      className="rounded-xl border border-white/10 text-slate-400 hover:text-rose-300"
                    >
                      <X className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="mt-4 block space-y-1.5">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Lá»‡nh RCON</span>
              <textarea
                value={form.commands}
                onChange={(e) => setForm({ ...form, commands: e.target.value })}
                rows={4}
                placeholder={form.rewardType === 'COIN' ? 'eco give {player} 10000' : 'give {player} diamond 16'}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white font-mono text-sm"
                required
              />
            </label>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="text-sm font-bold text-white">Code tân thủ</span>
                <input type="checkbox" checked={form.newbieOnly} onChange={(e) => setForm({ ...form, newbieOnly: e.target.checked })} />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Số ngày tối đa</span>
                <input type="number" min={0} value={form.maxPlayerAgeDays} onChange={(e) => setForm({ ...form, maxPlayerAgeDays: Number(e.target.value) })} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
              </label>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-1.5">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Ngày bắt đầu</span>
                <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Ngày kết thúc</span>
                <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
              </label>
            </div>

            <label className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="text-sm font-bold text-white">Bật code</span>
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            </label>

            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setModalOpen(false)} className="flex-1 rounded-xl border border-white/10 py-3 font-bold text-slate-300">
                Hủy
              </button>
              <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-indigo-600 py-3 font-black text-white hover:bg-indigo-500 disabled:opacity-60">
                {saving ? 'Đang lưu...' : 'Lưu code'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
