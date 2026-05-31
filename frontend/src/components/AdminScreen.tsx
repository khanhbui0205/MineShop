import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Users,
  Package,
  LogOut,
  ShieldCheck,
  Swords,
  Settings,
  Bell,
  X,
  AlertCircle,
} from 'lucide-react';
import type { AdminTab, CoinPackage, Player, AuditLog, AdminStats } from '../types';
import DashboardAdmin from './DashboardAdmin';
import UsersAdmin from './UsersAdmin';
import api from '../lib/api';

interface AdminScreenProps {
  user: any;
  onLogout: () => void;
}

// Format VNĐ
export const formatVND = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

export default function AdminScreen({ user, onLogout }: AdminScreenProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('Tổng quan');
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    bannedUsers: 0,
    totalRevenue: 0,
    totalTransactions: 0,
    totalPackages: 0,
  });
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const addAuditLog = useCallback((message: string, detail: string, borderType: AuditLog['borderType']) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setAuditLogs(prev => [{
      id: `log-${Date.now()}`,
      time: timeStr,
      message,
      detail,
      borderType,
    }, ...prev.slice(0, 19)]);
  }, []);

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, pkgsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/packages'),
      ]);
      setStats(statsRes.data);
      // Map packages
      const pkgs: CoinPackage[] = pkgsRes.data.map((p: any) => ({
        id: p._id,
        _id: p._id,
        name: p.name,
        description: p.description,
        price: p.price,
        coinAmount: p.coinAmount,
        bonusCoin: p.bonusCoin,
        isVisible: p.isVisible,
        category: p.category,
        createdAt: p.createdAt,
      }));
      setPackages(pkgs);
    } catch (err: any) {
      showToast('Không thể tải dữ liệu dashboard', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── PACKAGE HANDLERS ────────────────────────────────────────────────────────

  const handleAddPackage = async (pkg: Omit<CoinPackage, 'id'>) => {
    try {
      const res = await api.post('/admin/packages', {
        name: pkg.name,
        description: pkg.description,
        price: pkg.price,
        coinAmount: pkg.coinAmount,
        bonusCoin: pkg.bonusCoin,
        isVisible: pkg.isVisible,
        category: pkg.category,
      });
      const newPkg: CoinPackage = {
        id: res.data._id,
        _id: res.data._id,
        ...res.data,
      };
      setPackages(prev => [newPkg, ...prev]);
      setStats(prev => ({ ...prev, totalPackages: prev.totalPackages + 1 }));
      addAuditLog(`Tạo gói mới: ${pkg.name}`, `Giá: ${formatVND(pkg.price)} | ${pkg.coinAmount} Xu`, 'primary');
      showToast('Tạo gói nạp thành công!');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Tạo gói thất bại', 'error');
    }
  };

  const handleUpdatePackage = async (pkg: CoinPackage) => {
    try {
      const res = await api.put(`/admin/packages/${pkg.id || pkg._id}`, {
        name: pkg.name,
        description: pkg.description,
        price: pkg.price,
        coinAmount: pkg.coinAmount,
        bonusCoin: pkg.bonusCoin,
        isVisible: pkg.isVisible,
        category: pkg.category,
      });
      setPackages(prev => prev.map(p => (p.id === pkg.id || p._id === pkg._id) ? { ...p, ...res.data, id: res.data._id } : p));
      addAuditLog(`Cập nhật gói: ${pkg.name}`, `Giá mới: ${formatVND(pkg.price)}`, 'secondary');
      showToast('Cập nhật gói nạp thành công!');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Cập nhật thất bại', 'error');
    }
  };

  const handleDeletePackage = async (id: string) => {
    try {
      await api.delete(`/admin/packages/${id}`);
      const deleted = packages.find(p => p.id === id || p._id === id);
      setPackages(prev => prev.filter(p => p.id !== id && p._id !== id));
      setStats(prev => ({ ...prev, totalPackages: Math.max(0, prev.totalPackages - 1) }));
      addAuditLog(`Xóa gói: ${deleted?.name || id}`, 'Gói đã bị xóa vĩnh viễn', 'error');
      showToast('Đã xóa gói nạp');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Xóa thất bại', 'error');
    }
  };

  const handleTogglePackage = async (id: string) => {
    try {
      const res = await api.patch(`/admin/packages/${id}/toggle`);
      setPackages(prev => prev.map(p => (p.id === id || p._id === id) ? { ...p, isVisible: res.data.isVisible } : p));
      const pkg = packages.find(p => p.id === id || p._id === id);
      addAuditLog(
        `${res.data.isVisible ? 'Hiện' : 'Ẩn'} gói: ${pkg?.name}`,
        `Trạng thái: ${res.data.isVisible ? 'Hiển thị' : 'Đã ẩn'}`,
        res.data.isVisible ? 'primary' : 'tertiary'
      );
      showToast(res.data.message);
    } catch (err: any) {
      showToast('Thao tác thất bại', 'error');
    }
  };

  // ─── USER HANDLERS ───────────────────────────────────────────────────────────

  const handleBanUser = async (userId: string, banReason: string, banDuration: string) => {
    try {
      const res = await api.post(`/admin/users/${userId}/ban`, { banReason, banDuration });
      setPlayers(prev => prev.map(p => (p.id === userId || p._id === userId)
        ? { ...p, status: 'Banned' as const, isBanned: true, banReason }
        : p
      ));
      setStats(prev => ({ ...prev, bannedUsers: prev.bannedUsers + 1 }));
      const player = players.find(p => p.id === userId || p._id === userId);
      addAuditLog(
        `Khóa tài khoản: ${player?.name || player?.username}`,
        `Lý do: ${banReason} | Thời hạn: ${banDuration === 'permanent' ? 'Vĩnh viễn' : banDuration}`,
        'error'
      );
      showToast(res.data.message || 'Đã khóa tài khoản');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Khóa tài khoản thất bại', 'error');
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      const res = await api.post(`/admin/users/${userId}/unban`);
      setPlayers(prev => prev.map(p => (p.id === userId || p._id === userId)
        ? { ...p, status: 'Offline' as const, isBanned: false, banReason: '' }
        : p
      ));
      setStats(prev => ({ ...prev, bannedUsers: Math.max(0, prev.bannedUsers - 1) }));
      const player = players.find(p => p.id === userId || p._id === userId);
      addAuditLog(
        `Mở khóa: ${player?.name || player?.username}`,
        'Tài khoản đã được khôi phục',
        'primary'
      );
      showToast(res.data.message || 'Đã mở khóa tài khoản');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Mở khóa thất bại', 'error');
    }
  };

  const handleResetPassword = async (userId: string, newPassword: string) => {
    try {
      const res = await api.post(`/admin/users/${userId}/reset-password`, { newPassword });
      const player = players.find(p => p.id === userId || p._id === userId);
      addAuditLog(
        `Đặt lại mật khẩu: ${player?.name || player?.username}`,
        'Mật khẩu đã được cập nhật',
        'secondary'
      );
      showToast(res.data.message || 'Đặt lại mật khẩu thành công');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Đặt lại mật khẩu thất bại', 'error');
    }
  };

  const handlePlayersLoaded = (loadedPlayers: Player[]) => {
    setPlayers(loadedPlayers);
  };

  const navItems: { label: AdminTab; icon: React.ReactNode }[] = [
    { label: 'Tổng quan', icon: <LayoutDashboard size={18} /> },
    { label: 'Người dùng', icon: <Users size={18} /> },
    { label: 'Cài đặt', icon: <Settings size={18} /> },
  ];

  return (
    <div className="flex min-h-screen bg-[#0f1117] text-white font-sans">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -60, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -60, x: '-50%' }}
            className={`fixed top-5 left-1/2 z-[999] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-red-600 border-red-500 text-white'
            }`}
          >
            {toast.type === 'success' ? <ShieldCheck size={16} /> : <AlertCircle size={16} />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#141821] border-r border-white/5 fixed top-0 left-0 h-full z-40">
        {/* Brand */}
        <div className="px-6 py-7 border-b border-white/5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
              <Swords size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-white tracking-wide">EMERALD REALM</h1>
              <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-widest">Admin Panel</span>
            </div>
          </div>
        </div>

        {/* Admin info */}
        <div className="px-4 py-4 border-b border-white/5">
          <div className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {user.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user.username}</p>
              <p className="text-[10px] text-indigo-400 font-semibold">Quản trị viên</p>
            </div>
            <ShieldCheck size={14} className="text-indigo-400 flex-shrink-0" />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ label, icon }) => (
            <button
              key={label}
              onClick={() => setActiveTab(label)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === label
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Stats mini */}
        <div className="px-4 pb-4">
          <div className="bg-white/5 rounded-xl p-3 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Tổng người dùng</span>
              <span className="font-bold text-white">{stats.totalUsers.toLocaleString('vi-VN')}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Tài khoản bị khóa</span>
              <span className="font-bold text-red-400">{stats.bannedUsers}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Gói nạp</span>
              <span className="font-bold text-white">{stats.totalPackages}</span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="px-3 pb-6 border-t border-white/5 pt-4">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-all cursor-pointer"
          >
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#141821] border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Swords size={14} />
          </div>
          <span className="font-bold text-sm text-white">Admin Panel</span>
        </div>
        <button onClick={onLogout} className="text-red-400 p-1">
          <LogOut size={18} />
        </button>
      </header>

      {/* Mobile nav bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#141821] border-t border-white/5 flex justify-around py-2">
        {navItems.map(({ label, icon }) => (
          <button
            key={label}
            onClick={() => setActiveTab(label)}
            className={`flex flex-col items-center gap-1 px-3 py-1 text-[10px] font-semibold transition-colors cursor-pointer ${
              activeTab === label ? 'text-indigo-400' : 'text-slate-500'
            }`}
          >
            {icon}
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Main content */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="hidden md:flex items-center justify-between px-8 py-5 border-b border-white/5 bg-[#0f1117] sticky top-0 z-30">
          <div>
            <h2 className="text-lg font-bold text-white">{activeTab}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Quản trị hệ thống · <span className="text-indigo-400 font-semibold">{user.username}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-2 rounded-xl text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Hệ thống hoạt động</span>
            </div>
            <button className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors">
              <Bell size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 md:p-8 pt-16 md:pt-8 pb-20 md:pb-8 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 text-sm">Đang tải dữ liệu...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'Tổng quan' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  <DashboardAdmin
                    stats={stats}
                    packages={packages}
                    auditLogs={auditLogs}
                    onAddPackage={handleAddPackage}
                    onUpdatePackage={handleUpdatePackage}
                    onDeletePackage={handleDeletePackage}
                    onTogglePackage={handleTogglePackage}
                  />
                </motion.div>
              )}

              {activeTab === 'Người dùng' && (
                <motion.div
                  key="users"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  <UsersAdmin
                    onBanUser={handleBanUser}
                    onUnbanUser={handleUnbanUser}
                    onResetPassword={handleResetPassword}
                    onPlayersLoaded={handlePlayersLoaded}
                    addAuditLog={addAuditLog}
                  />
                </motion.div>
              )}

              {activeTab === 'Cài đặt' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                    <Settings size={40} className="text-indigo-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">Cài đặt hệ thống</h3>
                    <p className="text-slate-400 text-sm">Tài khoản: <span className="text-white font-semibold">{user.username}</span></p>
                    <p className="text-slate-400 text-sm mt-1">Email: <span className="text-white font-semibold">{user.email}</span></p>
                    <p className="text-slate-500 text-xs mt-4">Các tính năng cài đặt nâng cao sẽ được cập nhật sớm.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
}
