import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Gavel,
  ChevronLeft, ChevronRight, RefreshCw, Eye,
  UserCheck, Lock, X, Mail, Phone,
} from 'lucide-react';
import type { Player, AuditLog } from '../types';
import { formatVND } from '../lib/utils';
import api from '../lib/api';

interface UsersAdminProps {
  onBanUser: (userId: string, banReason: string, banDuration: string) => Promise<void>;
  onUnbanUser: (userId: string) => Promise<void>;
  onResetPassword: (userId: string, newPassword: string) => Promise<void>;
  onPlayersLoaded: (players: Player[]) => void;
  addAuditLog?: (msg: string, detail: string, type: AuditLog['borderType']) => void;
}

export default function UsersAdmin({
  onBanUser, onUnbanUser, onResetPassword, onPlayersLoaded, addAuditLog,
}: UsersAdminProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modals
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewTransactions, setViewTransactions] = useState<any[]>([]);

  // Form states
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('permanent');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Password validation
  const pwdHasMin = newPassword.length >= 8;
  const pwdHasUpper = /[A-Z]/.test(newPassword);
  const pwdMatch = newPassword === confirmNewPassword;
  const pwdValid = pwdHasMin && pwdHasUpper && pwdMatch && newPassword.length > 0;

  // Fetch users
  const fetchUsers = useCallback(async (searchValue?: string, pageNum?: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: searchValue ?? searchTerm,
        page: String(pageNum ?? page),
        limit: '12',
      });
      const res = await api.get(`/admin/users?${params}`);
      const data = res.data;

      const mapped: Player[] = data.users.map((u: any) => ({
        id: u._id,
        _id: u._id,
        name: u.username,
        username: u.username,
        email: u.email,
        phoneNumber: u.phoneNumber || '',
        avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${u.username}`,
        status: u.isBanned ? 'Banned' : 'Offline',
        isBanned: u.isBanned,
        banReason: u.banReason || '',
        banExpiresAt: u.banExpiresAt,
        rank: u.rank || 'Member',
        donated: u.totalDeposited || 0,
        balance: u.balance || 0,
        minecraftUsername: u.minecraftUsername || '',
        minecraftLastSync: u.minecraftLastSync,
        role: u.role,
        lastActive: u.lastLoginAt
          ? new Date(u.lastLoginAt).toLocaleDateString('vi-VN')
          : (u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '—'),
        createdAt: u.createdAt,
      }));

      setPlayers(mapped);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      onPlayersLoaded(mapped);
    } catch (err) {
      console.error('Lỗi tải danh sách người dùng:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, page, onPlayersLoaded]);

  useEffect(() => {
    fetchUsers();
  }, [page]);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchUsers(searchTerm, 1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // View user + transactions
  const handleViewUser = async (player: Player) => {
    setSelectedPlayer(player);
    setIsViewModalOpen(true);
    try {
      const res = await api.get(`/admin/users/${player.id}/transactions`);
      setViewTransactions(res.data);
    } catch {
      setViewTransactions([]);
    }
  };

  // Ban
  const handleConfirmBan = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer) return;
    setActionLoading(true);
    try {
      await onBanUser(selectedPlayer.id, banReason || 'Vi phạm quy định cộng đồng', banDuration);
      if (addAuditLog) {
        addAuditLog(`Khóa: ${selectedPlayer.name}`, `Lý do: ${banReason || 'Vi phạm'} | ${banDuration}`, 'error');
      }
      setPlayers(prev => prev.map(p => p.id === selectedPlayer.id
        ? { ...p, status: 'Banned', isBanned: true, banReason }
        : p
      ));
      setIsBanModalOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  // Unban
  const handleUnban = async (player: Player) => {
    setActionLoading(true);
    try {
      await onUnbanUser(player.id);
      if (addAuditLog) {
        addAuditLog(`Mở khóa: ${player.name}`, 'Tài khoản đã được khôi phục', 'primary');
      }
      setPlayers(prev => prev.map(p => p.id === player.id
        ? { ...p, status: 'Offline', isBanned: false, banReason: '' }
        : p
      ));
    } finally {
      setActionLoading(false);
    }
  };

  // Reset password
  const handleConfirmReset = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer || !pwdValid) return;
    setActionLoading(true);
    try {
      await onResetPassword(selectedPlayer.id, newPassword);
      setIsResetModalOpen(false);
      setNewPassword('');
      setConfirmNewPassword('');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Search bar */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên, email hoặc số điện thoại..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <span>Tổng: <strong className="text-white">{total.toLocaleString('vi-VN')}</strong> tài khoản</span>
          <button
            onClick={() => fetchUsers()}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Làm mới"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-slate-400 border-b border-white/10 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4">Người dùng</th>
                  <th className="px-6 py-4">Liên hệ</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-center">Số dư / Nạp</th>
                  <th className="px-6 py-4 text-center">Vai trò</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <AnimatePresence mode="popLayout">
                  {players.length === 0 ? (
                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">
                        Không tìm thấy người dùng nào.
                      </td>
                    </motion.tr>
                  ) : (
                    players.map(player => (
                      <motion.tr
                        key={player.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`hover:bg-white/5 transition-all group ${player.isBanned ? 'bg-red-950/10' : ''}`}
                      >
                        {/* User info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={player.avatarUrl}
                              alt={player.name}
                              className="w-9 h-9 rounded-lg border border-white/10 object-cover bg-white/5"
                            />
                            <div>
                              <p className="font-semibold text-white text-sm flex items-center gap-1.5">
                                {player.name}
                                {player.isBanned && (
                                  <span className="bg-red-900/40 text-red-400 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                                    KHÓA
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                ID: {player.id.substring(0, 12)}...
                              </p>
                              {player.minecraftUsername && (
                                <p className="text-[10px] text-indigo-400 font-bold mt-0.5">
                                  MC: {player.minecraftUsername}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-slate-300 flex items-center gap-1.5">
                              <Mail size={11} className="text-slate-500" />
                              {player.email}
                            </span>
                            {player.phoneNumber && (
                              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                                <Phone size={11} className="text-slate-500" />
                                {player.phoneNumber}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            player.isBanned
                              ? 'bg-red-900/30 text-red-400 border border-red-900/50'
                              : 'bg-emerald-900/30 text-emerald-400 border border-emerald-900/50'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${player.isBanned ? 'bg-red-400' : 'bg-emerald-400'}`} />
                            {player.isBanned ? 'Đã khóa' : 'Hoạt động'}
                          </span>
                        </td>

                        {/* Balance */}
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-white font-semibold font-mono">
                              {(player.balance || 0).toLocaleString('vi-VN')} Xu
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Đã nạp: {formatVND(player.donated)}
                            </span>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${
                            player.role === 'admin'
                              ? 'bg-indigo-900/40 text-indigo-400 border border-indigo-900/50'
                              : 'bg-white/5 text-slate-400 border border-white/10'
                          }`}>
                            {player.role === 'admin' ? 'Admin' : 'Thành viên'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleViewUser(player)}
                              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-all cursor-pointer"
                              title="Xem chi tiết"
                            >
                              <Eye size={14} />
                            </button>
                            {player.isBanned ? (
                              <button
                                onClick={() => handleUnban(player)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50 border border-emerald-900/50 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                title="Mở khóa"
                              >
                                <UserCheck size={13} />
                                <span>Mở khóa</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedPlayer(player);
                                  setBanReason('');
                                  setBanDuration('permanent');
                                  setIsBanModalOpen(true);
                                }}
                                className="p-2 rounded-lg bg-white/5 hover:bg-red-900/30 text-slate-400 hover:text-red-400 border border-white/10 hover:border-red-900/50 transition-all cursor-pointer"
                                title="Khóa tài khoản"
                              >
                                <Gavel size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedPlayer(player);
                                setNewPassword('');
                                setConfirmNewPassword('');
                                setIsResetModalOpen(true);
                              }}
                              className="p-2 rounded-lg bg-white/5 hover:bg-sky-900/30 text-slate-400 hover:text-sky-400 border border-white/10 hover:border-sky-900/50 transition-all cursor-pointer"
                              title="Đặt lại mật khẩu"
                            >
                              <Lock size={14} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 bg-white/3 border-t border-white/5 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Trang {page} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 flex items-center justify-center cursor-pointer transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 flex items-center justify-center cursor-pointer transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===== MODAL: VIEW USER ===== */}
      <AnimatePresence>
        {isViewModalOpen && selectedPlayer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1a2030] border border-white/10 w-full max-w-lg rounded-2xl p-6 relative shadow-2xl max-h-[80vh] overflow-y-auto"
            >
              <button onClick={() => setIsViewModalOpen(false)} className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Eye size={18} className="text-indigo-400" /> Chi tiết người dùng
              </h3>

              <div className="flex items-center gap-4 mb-5 pb-5 border-b border-white/10">
                <img src={selectedPlayer.avatarUrl} alt="" className="w-14 h-14 rounded-xl border border-white/10" />
                <div>
                  <h4 className="font-bold text-white text-base">{selectedPlayer.name}</h4>
                  <p className="text-xs text-slate-400">{selectedPlayer.email}</p>
                  {selectedPlayer.phoneNumber && <p className="text-xs text-slate-400">{selectedPlayer.phoneNumber}</p>}
                  <p className="text-[10px] text-slate-500 font-mono mt-1">ID: {selectedPlayer.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { label: 'Số dư (Server)', value: `${(selectedPlayer.balance || 0).toLocaleString('vi-VN')} Xu` },
                  { label: 'MC Username', value: selectedPlayer.minecraftUsername || '—' },
                  { label: 'Tổng nạp', value: formatVND(selectedPlayer.donated) },
                  { label: 'Hạng', value: selectedPlayer.rank },
                  { label: 'Vai trò', value: selectedPlayer.role === 'admin' ? 'Admin' : 'Thành viên' },
                  { label: 'Trạng thái', value: selectedPlayer.isBanned ? '⛔ Đã khóa' : '✅ Hoạt động' },
                  { label: 'Đồng bộ lúc', value: selectedPlayer.minecraftLastSync ? new Date(selectedPlayer.minecraftLastSync).toLocaleTimeString('vi-VN') : '—' },
                  { label: 'Đăng nhập cuối', value: selectedPlayer.lastActive || '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white/5 rounded-xl p-3">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">{label}</p>
                    <p className="text-sm font-semibold text-white mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              {selectedPlayer.isBanned && selectedPlayer.banReason && (
                <div className="bg-red-900/20 border border-red-900/50 rounded-xl p-3 mb-4">
                  <p className="text-xs text-red-400 font-semibold">Lý do khóa: {selectedPlayer.banReason}</p>
                  {selectedPlayer.banExpiresAt && (
                    <p className="text-[10px] text-red-500 mt-0.5">
                      Hết hạn: {new Date(selectedPlayer.banExpiresAt).toLocaleString('vi-VN')}
                    </p>
                  )}
                </div>
              )}

              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Lịch sử giao dịch gần đây</h5>
              {viewTransactions.length === 0 ? (
                <p className="text-xs text-slate-500 italic">Chưa có giao dịch nào.</p>
              ) : (
                <div className="space-y-2">
                  {viewTransactions.slice(0, 8).map((tx: any) => (
                    <div key={tx._id} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2">
                      <div>
                        <p className="text-xs font-semibold text-white">{tx.item}</p>
                        <p className="text-[10px] text-slate-500">{tx.type} · {new Date(tx.createdAt).toLocaleDateString('vi-VN')}</p>
                      </div>
                      <span className={`text-xs font-bold font-mono ${tx.coinsChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {tx.coinsChange >= 0 ? '+' : ''}{tx.coinsChange.toLocaleString('vi-VN')} Xu
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===== MODAL: BAN USER ===== */}
      <AnimatePresence>
        {isBanModalOpen && selectedPlayer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1a2030] border border-white/10 w-full max-w-md rounded-2xl p-7 relative shadow-2xl"
              id="ban-modal-panel"
            >
              <button onClick={() => setIsBanModalOpen(false)} className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
              <h3 className="text-xl font-bold text-red-400 mb-2 flex items-center gap-2">
                <Gavel size={20} /> Khóa tài khoản
              </h3>
              <p className="text-sm text-slate-400 mb-5">
                Bạn đang khóa <strong className="text-white">{selectedPlayer.name}</strong>. Thao tác này sẽ được ghi lại.
              </p>

              <form onSubmit={handleConfirmBan} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Lý do khóa *</label>
                  <textarea
                    value={banReason}
                    onChange={e => setBanReason(e.target.value)}
                    placeholder="Ví dụ: Gian lận, spam, vi phạm nội quy..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Thời hạn khóa</label>
                  <select
                    value={banDuration}
                    onChange={e => setBanDuration(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all cursor-pointer"
                  >
                    <option value="24h">24 Giờ</option>
                    <option value="7d">7 Ngày</option>
                    <option value="30d">30 Ngày</option>
                    <option value="permanent">Vĩnh viễn</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsBanModalOpen(false)}
                    className="flex-1 py-2.5 border border-white/10 rounded-xl text-slate-300 text-sm font-semibold hover:bg-white/5 transition-all cursor-pointer">
                    Hủy
                  </button>
                  <button type="submit" disabled={actionLoading}
                    className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl text-sm hover:bg-red-500 transition-all cursor-pointer disabled:opacity-60">
                    {actionLoading ? 'Đang xử lý...' : 'Xác nhận khóa'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===== MODAL: RESET PASSWORD ===== */}
      <AnimatePresence>
        {isResetModalOpen && selectedPlayer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1a2030] border border-white/10 w-full max-w-md rounded-2xl p-7 relative shadow-2xl"
              id="password-reset-box"
            >
              <button onClick={() => setIsResetModalOpen(false)} className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
              <h3 className="text-xl font-bold text-sky-400 mb-2 flex items-center gap-2">
                <Lock size={20} /> Đặt lại mật khẩu
              </h3>
              <p className="text-sm text-slate-400 mb-5">
                Đặt mật khẩu mới cho tài khoản <strong className="text-white">{selectedPlayer.name}</strong>.
              </p>

              <form onSubmit={handleConfirmReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Mật khẩu mới *</label>
                  <div className="relative">
                    <input
                      type={showNewPwd ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Tối thiểu 8 ký tự, có chữ in hoa"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                      required
                    />
                    <button type="button" onClick={() => setShowNewPwd(!showNewPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer">
                      {showNewPwd ? <X size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  {newPassword.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className={`text-xs flex items-center gap-1.5 ${pwdHasMin ? 'text-emerald-400' : 'text-red-400'}`}>
                        {pwdHasMin ? '✓' : '✗'} Ít nhất 8 ký tự
                      </div>
                      <div className={`text-xs flex items-center gap-1.5 ${pwdHasUpper ? 'text-emerald-400' : 'text-red-400'}`}>
                        {pwdHasUpper ? '✓' : '✗'} Có ít nhất 1 chữ in hoa
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Xác nhận mật khẩu *</label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={e => setConfirmNewPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                  />
                  {confirmNewPassword.length > 0 && (
                    <p className={`text-xs mt-1.5 ${pwdMatch ? 'text-emerald-400' : 'text-red-400'}`}>
                      {pwdMatch ? '✓ Mật khẩu khớp' : '✗ Mật khẩu không khớp'}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsResetModalOpen(false)}
                    className="flex-1 py-2.5 border border-white/10 rounded-xl text-slate-300 text-sm font-semibold hover:bg-white/5 transition-all cursor-pointer">
                    Hủy
                  </button>
                  <button type="submit" disabled={!pwdValid || actionLoading}
                    className="flex-1 py-2.5 bg-sky-600 text-white font-bold rounded-xl text-sm hover:bg-sky-500 transition-all cursor-pointer disabled:opacity-40">
                    {actionLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
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
