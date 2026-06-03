import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp, Users, Coins, Crown, Activity, ShoppingBag,
  Trash2, Edit2, PlusCircle, Clock, X, Eye, EyeOff, ToggleLeft, ToggleRight
} from 'lucide-react';
import type { CoinPackage, AuditLog, AdminStats } from '../types';
import { formatVND } from '../lib/utils';

interface DashboardAdminProps {
  stats: AdminStats;
  packages: CoinPackage[];
  auditLogs: AuditLog[];
  onAddPackage: (pkg: Omit<CoinPackage, 'id'>) => void;
  onUpdatePackage: (pkg: CoinPackage) => void;
  onDeletePackage: (id: string) => void;
  onTogglePackage: (id: string) => void;
}

export default function DashboardAdmin({
  stats, packages, auditLogs,
  onAddPackage, onUpdatePackage, onDeletePackage, onTogglePackage,
}: DashboardAdminProps) {
  const [activeTab, setActiveTab] = useState<'Coin' | 'VIP' | 'Pass'>('Coin');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<CoinPackage | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(50000);
  const [coinAmount, setCoinAmount] = useState<number>(500);
  const [bonusCoin, setBonusCoin] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [category, setCategory] = useState<'Coin' | 'VIP' | 'Pass'>('Coin');
  const [commands, setCommands] = useState('');

  const filteredPackages = packages.filter(pkg => pkg.category === activeTab);

  const openCreateModal = () => {
    setEditingPackage(null);
    setDescription(''); setIsVisible(true); setCategory(activeTab); setCommands('');
    setIsModalOpen(true);
  };

  const openEditModal = (pkg: CoinPackage) => {
    setEditingPackage(pkg);
    setName(pkg.name);
    setPrice(pkg.price);
    setCoinAmount(pkg.coinAmount);
    setBonusCoin(pkg.bonusCoin);
    setDescription(pkg.description || '');
    setIsVisible(pkg.isVisible);
    setCategory(pkg.category);
    setCommands(pkg.commands ? pkg.commands.join('\n') : '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const pkgData = {
      name, price, coinAmount, bonusCoin, description,
      isVisible, category,
      commands: commands.split('\n').map(cmd => cmd.trim()).filter(cmd => cmd !== ''),
    };
    if (editingPackage) {
      onUpdatePackage({ ...pkgData, id: editingPackage.id, _id: editingPackage._id });
    } else {
      onAddPackage(pkgData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Tổng người dùng', value: stats.totalUsers.toLocaleString('vi-VN'), icon: <Users size={20} />, color: 'text-indigo-400' },
          { label: 'Tài khoản bị khóa', value: stats.bannedUsers.toLocaleString('vi-VN'), icon: <Activity size={20} />, color: 'text-red-400' },
          { label: 'Tổng doanh thu', value: formatVND(stats.totalRevenue), icon: <TrendingUp size={20} />, color: 'text-emerald-400' },
          { label: 'Giao dịch', value: stats.totalTransactions.toLocaleString('vi-VN'), icon: <ShoppingBag size={20} />, color: 'text-amber-400' },
          { label: 'Gói nạp', value: stats.totalPackages.toLocaleString('vi-VN'), icon: <Coins size={20} />, color: 'text-sky-400' },
        ].map(({ label, value, icon, color }) => (
          <motion.div
            key={label}
            whileHover={{ y: -3 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden"
          >
            <div className={`${color}`}>{icon}</div>
            <div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
              <h3 className={`text-xl font-extrabold mt-1 ${color}`}>{value}</h3>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Package Management */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/5">
          {(['Coin', 'VIP', 'Pass'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 cursor-pointer ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'Coin' ? 'Gói Xu' : tab === 'VIP' ? 'Gói VIP' : 'Battle Pass'}
            </button>
          ))}
        </div>
        <button
          id="btn-create-package"
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-all shadow-lg shadow-indigo-900/30"
        >
          <PlusCircle size={16} />
          <span>Tạo gói mới</span>
        </button>
      </div>

      {/* Package Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-slate-400 border-b border-white/10 text-xs uppercase tracking-wider">
                <th className="px-6 py-4">Gói nạp</th>
                <th className="px-6 py-4 text-right">Giá (VNĐ)</th>
                <th className="px-6 py-4 text-center">Xu nhận</th>
                <th className="px-6 py-4 text-center">Xu thưởng</th>
                <th className="px-6 py-4 text-center">Hiển thị</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence mode="popLayout">
                {filteredPackages.length === 0 ? (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">
                      Chưa có gói nào trong danh mục này. Nhấn "Tạo gói mới" để thêm.
                    </td>
                  </motion.tr>
                ) : (
                  filteredPackages.map(pkg => (
                    <motion.tr
                      key={pkg.id || pkg._id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`hover:bg-white/5 transition-all group ${!pkg.isVisible ? 'opacity-50' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                            {pkg.category === 'Coin' ? <Coins size={18} /> : pkg.category === 'VIP' ? <Crown size={18} /> : <ShoppingBag size={18} />}
                          </div>
                          <div>
                            <p className="font-semibold text-white text-sm">{pkg.name}</p>
                            {pkg.description && <p className="text-xs text-slate-500 mt-0.5 max-w-xs truncate">{pkg.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-400 font-mono text-sm">
                        {formatVND(pkg.price)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-indigo-600/20 text-indigo-300 px-2.5 py-1 rounded-lg text-xs font-bold">
                          +{pkg.coinAmount.toLocaleString('vi-VN')} Xu
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {pkg.bonusCoin > 0 ? (
                          <span className="bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-lg text-xs font-bold">
                            +{pkg.bonusCoin.toLocaleString('vi-VN')} Xu
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => onTogglePackage(pkg.id || pkg._id!)}
                          className="cursor-pointer"
                          title={pkg.isVisible ? 'Ẩn gói' : 'Hiện gói'}
                        >
                          {pkg.isVisible
                            ? <Eye size={18} className="text-emerald-400 mx-auto" />
                            : <EyeOff size={18} className="text-slate-500 mx-auto" />
                          }
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(pkg)}
                          className="p-2 rounded-lg bg-white/5 hover:bg-indigo-600/20 hover:text-indigo-400 text-slate-400 transition-all border border-white/10 cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Xóa gói "${pkg.name}"?`)) {
                              onDeletePackage(pkg.id || pkg._id!);
                            }
                          }}
                          className="p-2 rounded-lg bg-white/5 hover:bg-red-600/20 hover:text-red-400 text-slate-400 transition-all border border-white/10 cursor-pointer"
                          title="Xóa gói"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 bg-white/3 border-t border-white/5 text-xs text-slate-500">
          Hiển thị {filteredPackages.length} / {packages.length} gói
        </div>
      </div>

      {/* Audit Logs */}
      {auditLogs.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h4 className="font-bold text-white mb-4 flex items-center gap-2">
            <Clock size={16} className="text-indigo-400" />
            Lịch sử hoạt động gần đây
          </h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {auditLogs.map(log => (
              <div
                key={log.id}
                className={`flex gap-3 p-3 rounded-xl border-l-2 bg-white/3 ${
                  log.borderType === 'primary' ? 'border-indigo-400'
                  : log.borderType === 'secondary' ? 'border-sky-400'
                  : log.borderType === 'tertiary' ? 'border-amber-400'
                  : 'border-red-400'
                }`}
              >
                <span className="text-[10px] text-slate-500 font-mono pt-0.5 min-w-[60px]">{log.time}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{log.message}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{log.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Package Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1a2030] border border-white/10 w-full max-w-lg rounded-2xl p-8 relative shadow-2xl"
              id="package-form-modal"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <h3 className="text-xl font-bold text-white mb-6">
                {editingPackage ? 'Chỉnh sửa gói nạp' : 'Tạo gói nạp mới'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Tên gói *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ví dụ: Gói 500 Xu Lục Bảo"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Mô tả</label>
                  <input
                    type="text"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Mô tả ngắn về gói..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Giá bán (VNĐ) *</label>
                    <input
                      type="number"
                      min="1000"
                      step="1000"
                      value={price}
                      onChange={e => setPrice(parseInt(e.target.value) || 0)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      required
                    />
                    <p className="text-[10px] text-slate-500 mt-1">{formatVND(price)}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Danh mục</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value as any)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                      <option value="Coin">Gói Xu</option>
                      <option value="VIP">Gói VIP</option>
                      <option value="Pass">Battle Pass</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Số Xu nhận *</label>
                    <input
                      type="number"
                      min="1"
                      value={coinAmount}
                      onChange={e => setCoinAmount(parseInt(e.target.value) || 0)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Xu thưởng</label>
                    <input
                      type="number"
                      min="0"
                      value={bonusCoin}
                      onChange={e => setBonusCoin(parseInt(e.target.value) || 0)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                  <span className="text-sm font-semibold text-white">Hiển thị gói này</span>
                  <button
                    type="button"
                    onClick={() => setIsVisible(!isVisible)}
                    className="cursor-pointer"
                  >
                    {isVisible
                      ? <ToggleRight size={28} className="text-indigo-400" />
                      : <ToggleLeft size={28} className="text-slate-500" />
                    }
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Commands (Minecraft)</label>
                  <textarea
                    value={commands}
                    onChange={e => setCommands(e.target.value)}
                    placeholder="eco give {player} 100&#10;lp user {player} parent add vip"
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Sử dụng {'{player}'} để thay thế tên người chơi. Mỗi dòng 1 lệnh.</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 border border-white/10 rounded-xl text-slate-300 font-semibold text-sm hover:bg-white/5 transition-all cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-500 transition-all cursor-pointer shadow-lg"
                  >
                    {editingPackage ? 'Lưu thay đổi' : 'Tạo gói'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
