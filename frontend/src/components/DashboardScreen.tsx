/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Home, 
  ShoppingCart, 
  History as HistoryIcon, 
  Settings as SettingsIcon, 
  HelpCircle, 
  LogOut, 
  Bell, 
  Wallet, 
  PlusCircle, 
  Sparkles, 
  Star, 
  Award, 
  Trophy, 
  Gem, 
  Search, 
  ShieldCheck, 
  Coins, 
  Flame, 
  MessageSquare, 
  Mail, 
  ArrowUpRight, 
  X,
  CreditCard,
  Swords,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Transaction, UserProfile, StoreItem, PortalTab } from '../types';
import { TOP_DONATORS } from '../data';
import api from '../lib/api';
import { formatVND } from './AdminScreen';
import { useNavigate } from 'react-router-dom';
import paymentService from '../services/paymentService';


interface DashboardScreenProps {
  user: any;
  onLogout: () => void;
}

export default function DashboardScreen({ user, onLogout }: DashboardScreenProps) {
  // Current user global state from backend
  const [userProfile, setUserProfile] = useState<UserProfile>({
    username: user.username,
    email: user.email,
    balance: user.balance || 0,
    totalDeposited: user.totalDeposited || 0,
    rank: user.rank || 'Member',
    battlePassLevel: user.battlePassLevel || 1,
    battlePassXp: user.battlePassXp || 0,
  });


  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [activeTab, setActiveTab] = useState<PortalTab>('Trang chủ');
  const [storeFilter, setStoreFilter] = useState<'All' | 'Rank' | 'BattlePass' | 'Cosmetic' | 'Coins'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Daily claim check
  const [dailyClaimed, setDailyClaimed] = useState(false);

  // Fetch initial data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [txRes, pkgRes] = await Promise.all([
          api.get('/store/transactions'),
          api.get('/packages')
        ]);
        setTransactions(txRes.data);
        
        // Map CoinPackage to StoreItem
        const mappedItems: StoreItem[] = pkgRes.data.map((pkg: any) => ({
          id: pkg._id,
          _id: pkg._id,
          name: pkg.name,
          description: pkg.description || '',
          price: pkg.price,
          currency: 'USD', // Still use USD internally to trigger VNĐ formatting in UI
          badge: pkg.bonusCoin > 0 ? `+${pkg.bonusCoin.toLocaleString('vi-VN')} Xu Thưởng` : undefined,
          icon: pkg.category === 'Coin' ? 'payments' : pkg.category === 'VIP' ? 'workspace_premium' : 'stars',
          type: pkg.category === 'Coin' ? 'Coins' : pkg.category === 'VIP' ? 'Rank' : 'BattlePass',
        }));
        setStoreItems(mappedItems);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };
    fetchDashboardData();
  }, []);


  // States for Modals
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('20000'); // VNĐ
  const [depositCode, setDepositCode] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'refuse' } | null>(null);

  // Helper function to trigger interactive popups
  const triggerNotification = (message: string, type: 'success' | 'refuse' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // 1. Claim Daily Coins
  const handleClaimDaily = async () => {
    if (dailyClaimed) {
      triggerNotification('Bạn đã nhận quà hằng ngày rồi! Vui lòng thử lại sau 24 giờ.', 'refuse');
      return;
    }

    try {
      const response = await api.post('/users/claim-daily');
      setUserProfile(prev => ({
        ...prev,
        balance: response.data.balance
      }));
      setDailyClaimed(true);

      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        type: 'Deposit',
        item: 'Quà đăng nhập hằng ngày',
        amount: '+5 Coins',
        coinsChange: 5,
        date: 'Vừa xong',
        status: 'Completed'
      };
      setTransactions(prev => [newTx, ...prev]);
      triggerNotification('Chúc mừng! Đã cộng +5 Coins vào số dư tài khoản của bạn.');
    } catch (error: any) {
      triggerNotification('Không thể nhận quà. Vui lòng thử lại sau.', 'refuse');
    }
  };

  // 2. Perform Deposit Code / USD top up
  const handlePerformDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositCode.trim() && !depositAmount) {
      alert('Vui lòng điền thông tin nạp tiền');
      return;
    }

    let coinsToAdd = 0;
    let cashAdded = 0;

    if (depositCode.trim()) {
      // Simulate Gift Card
      coinsToAdd = 500;
      cashAdded = 50000;
      setDepositCode('');
    } else {
      // Simulate card payment
      const vnd = parseInt(depositAmount);
      cashAdded = vnd;
      // 1000 VNĐ = 10 Coi
      coinsToAdd = (vnd / 1000) * 10;
    }

    try {
      const response = await api.post('/users/deposit', {
        amount: cashAdded,
        coins: coinsToAdd
      });

      setUserProfile(prev => ({
        ...prev,
        balance: response.data.balance,
        totalDeposited: response.data.totalDeposited
      }));

      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        type: 'Deposit',
        item: depositCode.trim() ? 'Nạp thẻ cào / Giftcode' : `Nạp ${formatVND(cashAdded)} qua thẻ`,
        amount: `+${coinsToAdd} Coins`,
        coinsChange: coinsToAdd,
        date: 'Hôm nay, vừa nạp',
        status: 'Completed'
      };

      setTransactions(prev => [newTx, ...prev]);
      setShowDepositModal(false);
      triggerNotification(`Giao dịch thành công! Số dư đã được cộng thêm +${coinsToAdd.toLocaleString('vi-VN')} Xu.`);
    } catch (error: any) {
      triggerNotification('Giao dịch thất bại. Vui lòng thử lại.', 'refuse');
    }
  };


  const navigate = useNavigate();

  // 3. Purchase Store Item
  const handlePurchaseItem = async (item: StoreItem) => {
    // If it's a paid package (Coins, VIP, BattlePass)
    if (item.currency === 'USD' || item.price >= 1000) {
      try {
        const response = await paymentService.createPayment(item.id || (item as any)._id);
        navigate(`/payment/checkout/${response.transactionId}`);
      } catch (error: any) {
        triggerNotification(error.response?.data?.message || 'Không thể tạo yêu cầu thanh toán. Vui lòng thử lại.', 'refuse');
      }
      return;
    }

    // Small coin purchases using balance (if any)
    if (userProfile.balance < item.price) {
      triggerNotification(`Số dư tài khoản không đủ.`, 'refuse');
      return;
    }

    try {
      const response = await api.post(`/packages/purchase/${item.id || (item as any)._id}`);
      setUserProfile(prev => ({
        ...prev,
        balance: response.data.balance,
      }));
      triggerNotification(`Thành công! Bạn đã mua ${item.name}.`);
    } catch (error: any) {
      triggerNotification('Mua hàng thất bại.', 'refuse');
    }
  };


  // Dynamic filter for shop items
  const filteredStoreItems = storeItems.filter(item => {
    const matchesFilter = storeFilter === 'All' || item.type === storeFilter;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });


  return (
    <div className="flex bg-slate-50 text-slate-800 min-h-screen text-sm font-sans flex-col md:flex-row relative">
      
      {/* Floating Dynamic status toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -40, x: '-50%' }}
            className={`fixed top-6 left-1/2 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${
              notification.type === 'success' 
              ? 'bg-indigo-600 text-white border-indigo-500/20 font-semibold' 
              : 'bg-red-600 text-white border-red-500/20'
            }`}
          >
            {notification.type === 'success' ? (
              <Sparkles className="w-5 h-5 animate-bounce text-yellow-300" />
            ) : (
              <X className="w-5 h-5 text-red-100" />
            )}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SideNavBar - Persistent on Desktop */}
      <nav className="hidden md:flex bg-slate-900 fixed left-0 top-0 h-full w-64 border-r border-slate-800 shadow-2xl flex-col py-8 z-40 justify-between">
        
        {/* Brand logo details exactly as image 1 */}
        <div className="px-6 flex flex-col items-center">
          <img 
            alt="Server Logo" 
            className="w-16 h-16 rounded-xl mb-4 object-cover border-2 border-slate-700 shadow-lg transform hover:scale-105 transition-all" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0rulQzv0m0tH8eJIAhPmYx58pkh5NyqFcZ7Svvt6qbXLfO6aqY5_bnQF5Th-ckwDQ-hLLAnlqhyr4PuY0eG28L2raQPw_kdPGwFOaJFwb4UcifCF8bJuqsTUbJIjXu-bis_PUFZZcKX2Ek8IzbTfCXfjAK0jREK8byOZPKCnr2LitVLUVp_vDMGxHujYq37H0H3vSeel6OkYNhOYdf_2Ic-QSAGMOZ_gOICpQUOEQhcAsz6RM7XAlRc4WtkbLXNhfJ8TZLXMqulo"
          />
          <h1 className="font-display font-extrabold text-lg text-white tracking-wider uppercase text-center">
            EMERALD REALM
          </h1>
          <span className="text-[10px] font-bold text-indigo-300 uppercase bg-indigo-500/10 px-3 mt-2 py-1 rounded-full border border-indigo-500/20">
            Hạng Bạch Kim
          </span>
        </div>

        {/* Action tabs list */}
        <div className="flex flex-col gap-1 w-full px-3 mt-4">
          
          {/* Tab HOME */}
          <button 
            onClick={() => setActiveTab('Trang chủ')}
            className={`flex items-center gap-4 py-3 px-4 rounded-lg w-full transition-all duration-300 cursor-pointer ${
              activeTab === 'Trang chủ' 
              ? 'bg-indigo-600 font-semibold text-white shadow-lg shadow-indigo-900/30' 
              : 'text-slate-400 hover:bg-slate-800/60 hover:text-indigo-400 text-left font-medium'
            }`}
          >
            <Home className="w-5 h-5" />
            <span>Trang chủ</span>
          </button>

          {/* Tab STORE */}
          <button 
            onClick={() => setActiveTab('Cửa hàng')}
            className={`flex items-center gap-4 py-3 px-4 rounded-lg w-full transition-all duration-300 cursor-pointer ${
              activeTab === 'Cửa hàng' 
              ? 'bg-indigo-600 font-semibold text-white shadow-lg shadow-indigo-900/30' 
              : 'text-slate-400 hover:bg-slate-800/60 hover:text-indigo-400 text-left font-medium'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Cửa hàng</span>
          </button>

          {/* Tab HISTORY */}
          <button 
            onClick={() => setActiveTab('Lịch sử')}
            className={`flex items-center gap-4 py-3 px-4 rounded-lg w-full transition-all duration-300 cursor-pointer ${
              activeTab === 'Lịch sử' 
              ? 'bg-indigo-600 font-semibold text-white shadow-lg shadow-indigo-900/30' 
              : 'text-slate-400 hover:bg-slate-800/60 hover:text-indigo-400 text-left font-medium'
            }`}
          >
            <HistoryIcon className="w-5 h-5" />
            <span>Lịch sử</span>
          </button>

          {/* Tab SETTINGS */}
          <button 
            onClick={() => setActiveTab('Cài đặt')}
            className={`flex items-center gap-4 py-3 px-4 rounded-lg w-full transition-all duration-300 cursor-pointer ${
              activeTab === 'Cài đặt' 
              ? 'bg-indigo-600 font-semibold text-white shadow-lg shadow-indigo-900/30' 
              : 'text-slate-400 hover:bg-slate-800/60 hover:text-indigo-400 text-left font-medium'
            }`}
          >
            <SettingsIcon className="w-5 h-5" />
            <span>Cài đặt</span>
          </button>

        </div>

        {/* Deposit Button Exactly like screenshot 1 but clean Professional style */}
        <div className="px-4 mt-auto py-2">
          <button 
            onClick={() => setShowDepositModal(true)}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-indigo-900/20 text-center cursor-pointer transition-all"
          >
            Nạp Xu Ngay
          </button>
        </div>

        {/* Supporting bottom links */}
        <div className="flex flex-col gap-1 w-full border-t border-slate-800 pt-4 px-2">
          <button 
            onClick={() => alert(`Cần trợ giúp? Vui lòng gửi email đến support@emeraldrealm.com để nhận hỗ trợ nhanh nhất từ GM.`)}
            className="flex items-center gap-4 py-3 px-4 rounded-lg text-slate-400 hover:bg-slate-800/60 hover:text-indigo-400 w-full text-left font-medium transition-colors"
          >
            <HelpCircle className="w-5 h-5" />
            <span>Hỗ trợ</span>
          </button>
          <button 
            onClick={onLogout}
            className="flex items-center gap-4 py-3 px-4 rounded-lg text-slate-400 hover:bg-red-950/40 hover:text-red-400 w-full text-left font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Đăng xuất</span>
          </button>
        </div>

      </nav>

      {/* MOBILE HEADER & NAVIGATION */}
      <header className="md:hidden bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40 text-white">
        <div className="flex items-center gap-2">
          <img 
            alt="Server Logo" 
            className="w-8 h-8 rounded-lg object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0rulQzv0m0tH8eJIAhPmYx58pkh5NyqFcZ7Svvt6qbXLfO6aqY5_bnQF5Th-ckwDQ-hLLAnlqhyr4PuY0eG28L2raQPw_kdPGwFOaJFwb4UcifCF8bJuqsTUbJIjXu-bis_PUFZZcKX2Ek8IzbTfCXfjAK0jREK8byOZPKCnr2LitVLUVp_vDMGxHujYq37H0H3vSeel6OkYNhOYdf_2Ic-QSAGMOZ_gOICpQUOEQhcAsz6RM7XAlRc4WtkbLXNhfJ8TZLXMqulo"
          />
          <span className="font-display font-black text-indigo-400 tracking-wider">CỔNG DỊCH VỤ</span>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowDepositModal(true)}
            className="p-2 bg-indigo-600/25 text-indigo-400 rounded-full border border-indigo-500/20"
          >
            <PlusCircle className="w-4 h-4" />
          </button>
          
          <button 
            onClick={onLogout}
            className="text-red-400 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Tab-Bar exactly at page bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-40 flex justify-around py-3">
        <button 
          onClick={() => setActiveTab('Trang chủ')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'Trang chủ' ? 'text-indigo-400' : 'text-slate-400'}`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Trang chủ</span>
        </button>
        <button 
          onClick={() => setActiveTab('Cửa hàng')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'Cửa hàng' ? 'text-indigo-400' : 'text-slate-400'}`}
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Cửa hàng</span>
        </button>
        <button 
          onClick={() => setActiveTab('Lịch sử')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'Lịch sử' ? 'text-indigo-400' : 'text-slate-400'}`}
        >
          <HistoryIcon className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Lịch sử</span>
        </button>
        <button 
          onClick={() => setActiveTab('Cài đặt')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'Cài đặt' ? 'text-indigo-400' : 'text-slate-400'}`}
        >
          <SettingsIcon className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Cài đặt</span>
        </button>
      </div>

      {/* MAIN LAYOUT CANVAS */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen pb-20 md:pb-0 z-10 relative overflow-y-auto">
        
        {/* TopNavBar Header for dashboard */}
        <header className="bg-white border-b border-slate-200/80 flex justify-between items-center px-8 h-20 w-full z-30 sticky top-0">
          <div className="text-left">
            <h2 className="font-display font-extrabold text-xl text-slate-950 tracking-tight capitalize">
              {activeTab}
            </h2>
            <p className="text-xs text-slate-500 font-sans hidden sm:block font-medium">
              Đang quản lý tài khoản: <span className="font-bold text-indigo-600">{userProfile.username}</span> - Minecraft Portal Việt Nam
            </p>
          </div>

          <div className="flex items-center gap-4 text-slate-700">
            
            {/* Coins Balance Medallion */}
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full border border-slate-200 hover:scale-102 transition-transform shadow-sm">
              <Coins className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold text-slate-700">
                Số dư: <span className="text-indigo-600 text-sm font-bold font-mono">{userProfile.balance.toLocaleString('vi-VN')}</span> Xu
              </span>
            </div>

            {/* Daily Login Reward Box */}
            <button 
              onClick={handleClaimDaily}
              disabled={dailyClaimed}
              className={`hidden md:flex items-center gap-1.5 text-xs py-2 px-4 rounded-lg border transition-all ${
                dailyClaimed 
                ? 'opacity-60 cursor-not-allowed text-slate-400 bg-slate-50 border-slate-200' 
                : 'text-amber-800 bg-amber-50 border-amber-200 hover:bg-amber-100/70 font-semibold animate-pulse shadow-sm'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>{dailyClaimed ? 'Đã điểm danh' : 'Nhận 5 Xu'}</span>
            </button>

            {/* Bell Indicator */}
            <button 
              onClick={() => alert('Không có thông báo mới.')}
              className="p-2 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-indigo-600 rounded-full border-2 border-white" />
            </button>

            {/* Avatar Profile */}
            <div 
              onClick={() => setActiveTab('Cài đặt')}
              className="w-10 h-10 rounded-full border border-slate-200 overflow-hidden cursor-pointer hover:border-indigo-500 transition-colors shadow"
            >
              <img 
                alt="Minecraft Character Visor" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXfIooe1QQ4Jl9I4ZVV52LPvlOoe-iyRipUOFrqoJs2xjt9cMh5FrSj63cZHqhQrTSrRbHT6YPdt47tO5gsGLUvPTrDykqBJHZQfT8hj-vc5wVVe0zjfYTNHO3yNjVk6KC1qa4FevwkIBlmbGLS1aj0jxaBHhWWv9eVqhqo3lWHErpdK9VG1J84i94d9A7OrFhamq8Kqy3nNWmtxkPMQlLP47rnfn5R036CGHiCUCSbd2onl8AXtNgr0IFDom2X9tArogFUMXF3Hw"
              />
            </div>

          </div>
        </header>

        {/* ACTIVE MODULE CONTAINER */}
        <main className="p-8 flex-grow flex flex-col gap-10">
          
          <AnimatePresence mode="wait">
            
            {/* TABS 1: HOME PANEL */}
            {activeTab === 'Trang chủ' && (
              <motion.div 
                key="home-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col gap-8"
              >
                {/* Hero section */}
                <section className="bg-white rounded-2xl p-8 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8 border border-slate-200/80 shadow-lg">
                  <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-slate-500/5 rounded-full blur-3xl pointer-events-none" />

                  <div className="z-10 flex-grow text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border-l-4 border-indigo-600 rounded-r mb-4">
                      <span className="text-[10px] uppercase tracking-widest font-mono text-indigo-600 font-bold animate-pulse">Online Portal Live</span>
                    </div>

                    <h2 className="font-display font-extrabold text-3xl text-slate-900 mb-3 leading-tight">
                      Chào mừng trở lại, <span className="text-indigo-600 font-black">{userProfile.username}</span>
                    </h2>
                    
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-4">
                      <span>Tham gia: {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'Mới tham gia'}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full" />
                      <span>Mã công dân: {user._id?.substring(0, 8)}</span>
                    </div>
                    
                    <p className="text-xs text-slate-500 max-w-xl leading-relaxed font-medium">
                      Lịch sử, trạng thái server và đặc quyền của bạn đã được liên kết trực tiếp. Nạp Coins, nâng cấp VIP Rank và mua sắm vật phẩm ranh giới Emerald trong nháy mắt.
                    </p>

                    <div className="mt-6 flex flex-wrap justify-center lg:justify-start gap-3">
                      <button 
                        onClick={() => {
                          setStoreFilter('All');
                          setActiveTab('Cửa hàng');
                        }}
                        className="py-2.5 px-5 bg-indigo-600 hover:bg-slate-900 text-white font-display font-bold text-xs tracking-wider uppercase rounded shadow-md transition-all cursor-pointer"
                      >
                        Khám phá Cửa hàng
                      </button>
                      <button 
                        onClick={handleClaimDaily}
                        disabled={dailyClaimed}
                        className="py-2.5 px-5 bg-slate-50 hover:bg-slate-100 text-indigo-600 border border-slate-200 rounded text-xs transition-colors font-semibold cursor-pointer"
                      >
                        {dailyClaimed ? '✓ Hôm nay đã nhận quà' : '★ Nhận 5 Xu Điểm Danh'}
                      </button>
                    </div>
                  </div>

                  <div className="z-10 w-full lg:w-auto flex justify-center">
                    <div className="w-32 h-64 bg-slate-50 border border-slate-100 rounded-2xl shadow-md relative overflow-hidden flex items-center justify-center group flex-col p-2">
                      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent opacity-60 group-hover:opacity-30 transition-opacity" />
                      <img 
                        alt="Steve model skin rendering" 
                        className="w-full h-full object-contain opacity-95 group-hover:scale-105 transition-transform z-10" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCE7LIekechAs7RUaOoK6U0xrdfZRK_IfCUcU5do0EbYVEfxDC6TFrM4VsLL9VWNJrgmVsEhxVwEK07KiV5pHpJYAVeal3fb2cXqP1uFK1NWCBR6I-cTi7vf0jAVV88fLghJ2xcLDbVmZpF9_vkdBfHxkAetlQjCArcx6oUDRTDtEA4SWXMIvcG2eUd3qFrIZaAqreOB4-1lq2dVSkuPnesBi9ph-PKvmkojvaYd0GifUruUWY8qdUzfpfH_otgF-PoF7b-FVhB3YI"
                      />
                      <span className="text-[9px] font-mono font-bold text-slate-400 z-20 hover:text-indigo-600 tracking-wider">AVATAR VIEW</span>
                    </div>
                  </div>

                </section>

                {/* Stats cards Grid */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  
                  {/* Card 1: Balance */}
                  <div className="bg-white rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden group border border-slate-200/80 shadow-md">
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100">
                        <Gem className="w-5 h-5 text-indigo-600" />
                      </div>
                      <span className="text-[10px] text-indigo-600 font-bold tracking-wider font-mono bg-indigo-50 px-2.5 py-1 rounded-full">Số dư Xu</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold font-sans md:mb-1">Current Balance</p>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                        {userProfile.balance.toLocaleString('vi-VN')}{' '}
                        <span className="text-sm font-normal text-slate-400">Xu Lục Bảo</span>
                      </h3>
                    </div>
                    <div className="absolute bottom-0 left-0 h-1 w-full bg-indigo-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Card 2: Deposited */}
                  <div className="bg-white rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden group border border-slate-200/80 shadow-md">
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                        <Wallet className="w-5 h-5 text-slate-600" />
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold tracking-wider bg-slate-50 px-2.5 py-1 rounded-full">Deposited Wallet</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold font-sans md:mb-1">Tổng cộng nạp</p>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                        {formatVND(userProfile.totalDeposited)}
                      </h3>
                    </div>
                    <div className="absolute bottom-0 left-0 h-1 w-full bg-indigo-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Card 3: Rank */}
                  <div className="bg-white rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden group border border-slate-200/80 shadow-md">
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100">
                        <Award className="w-5 h-5 text-indigo-600" />
                      </div>
                      <span className="text-[10px] text-indigo-600 font-bold tracking-wider bg-indigo-50 px-2.5 py-1 rounded-full">Đặc quyền VIP</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold font-sans md:mb-1">Hạng VIP hiện tại</p>
                      <h3 className="text-2xl font-black text-indigo-600 tracking-tight">
                        {userProfile.rank}
                      </h3>
                    </div>
                    <div className="absolute bottom-0 left-0 h-1 w-full bg-indigo-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Card 4: Battle Pass progress */}
                  <div className="bg-white rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden border border-slate-200/80 shadow-md">
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center border border-amber-150">
                        <Flame className="w-5 h-5 text-amber-500" />
                      </div>
                      <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded">Level {userProfile.battlePassLevel}</span>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-slate-500 mb-1 font-sans font-medium">
                        <span>Tiến trình Battle Pass</span>
                        <span>{userProfile.battlePassXp.toLocaleString()} / 5.000 XP</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full mt-1.5 overflow-hidden border border-slate-200/60">
                        <div 
                          className="h-full bg-indigo-600 animate-pulse" 
                          style={{ width: `${(userProfile.battlePassXp / 5000) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                </section>

                {/* Dashboard layout lower area */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Bento actions */}
                  <div className="lg:col-span-1 flex flex-col gap-4">
                    <h3 className="font-display font-extrabold text-sm text-slate-900 tracking-wide uppercase">
                      Thao tác nhanh
                    </h3>

                    {/* Action 1: Deposit */}
                    <button 
                      onClick={() => setShowDepositModal(true)}
                      className="bg-white rounded-xl p-4 flex items-center justify-between group hover:bg-slate-50 transition-all outline-none text-left border border-slate-200/80 shadow-sm border-l-4 border-l-indigo-600 cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform border border-indigo-100">
                          <PlusCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="block font-bold text-slate-800">Nạp tiền</span>
                          <span className="block text-xs text-slate-400 font-medium">Deposit funds instantly</span>
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    </button>

                    {/* Action 2: Buy Rank */}
                    <button 
                      onClick={() => {
                        setStoreFilter('Rank');
                        setActiveTab('Cửa hàng');
                      }}
                      className="bg-white rounded-xl p-4 flex items-center justify-between group hover:bg-slate-50 transition-all outline-none text-left border border-slate-200/80 shadow-sm border-l-4 border-l-indigo-600 cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 group-hover:scale-105 transition-transform">
                          <Star className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="block font-bold text-slate-800">Mua Rank</span>
                          <span className="block text-xs text-slate-400 font-medium">Upgrade premium status</span>
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    </button>

                    {/* Action 3: Season Store */}
                    <button 
                      onClick={() => {
                        setStoreFilter('BattlePass');
                        setActiveTab('Cửa hàng');
                      }}
                      className="bg-white rounded-xl p-4 flex items-center justify-between group hover:bg-slate-50 transition-all outline-none text-left border border-slate-200/80 shadow-sm border-l-4 border-l-amber-500 cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 group-hover:scale-105 transition-transform">
                          <ShoppingCart className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="block font-bold text-slate-800">Battle Pass Store</span>
                          <span className="block text-xs text-slate-400 font-medium">Phần thưởng độc quyền theo mùa</span>
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
                    </button>

                  </div>

                  {/* Recent Activity Table */}
                  <div className="lg:col-span-2 flex flex-col gap-4">
                    <h3 className="font-display font-extrabold text-sm text-slate-900 tracking-wide uppercase">
                      Giao dịch Gần Khách
                    </h3>

                    {/* Activity Ledger block */}
                    <div className="bg-white rounded-2xl p-6 flex flex-col border border-slate-200/80 shadow-md h-full justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-display font-bold text-sm text-slate-700 uppercase tracking-wide">
                            Lịch sử hoạt động
                          </h4>
                          <button 
                            onClick={() => setActiveTab('Lịch sử')}
                            className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                          >
                            Xem tất cả
                          </button>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-100 text-[11px] text-slate-400">
                                <th className="py-3 px-4 font-bold uppercase">Loại</th>
                                <th className="py-3 px-4 font-bold uppercase">Nội dung</th>
                                <th className="py-3 px-4 font-bold uppercase">Số lượng Coi</th>
                                <th className="py-3 px-4 font-bold text-right uppercase">Trạng thái</th>
                              </tr>
                            </thead>
                            <tbody className="text-xs">
                              {transactions.slice(0, 3).map((tx) => (
                                <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors text-slate-700">
                                  <td className="py-3.5 px-4 font-bold text-slate-900">
                                    {tx.type}
                                  </td>
                                  <td className="py-3.5 px-4 text-slate-500 font-medium">{tx.item}</td>
                                  <td className={`py-3.5 px-4 font-mono font-bold ${tx.coinsChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {tx.amount}
                                  </td>
                                  <td className="py-3.5 px-4 text-right">
                                    <span className={`inline-block px-2.5 py-1 text-[10px] font-mono tracking-wider font-semibold rounded-lg uppercase border ${
                                      tx.status === 'Completed' 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                      : tx.status === 'Claimed' 
                                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                      : 'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}>
                                      {tx.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Top Donators Month HUD */}
                      <div className="mt-6 border-t border-slate-100 pt-6">
                        <h4 className="font-display font-extrabold text-xs text-amber-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-amber-500" />
                          Top Nạp Thẻ Tháng Này
                        </h4>

                        <div className="grid grid-cols-3 gap-4 items-end pt-2">
                          
                          {/* 2nd Place slayer */}
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center flex flex-col items-center relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-6 h-6 bg-slate-200 text-slate-600 rounded-bl text-xs font-black flex items-center justify-center">2</div>
                            <img alt="Slayer user avatar" className="w-10 h-10 rounded-full border border-slate-200 mb-2 object-cover shadow-sm" src={TOP_DONATORS[1].avatar} />
                            <span className="text-xs text-slate-800 block font-bold truncate max-w-full">{TOP_DONATORS[1].name}</span>
                            <span className="text-[10px] text-indigo-600 font-mono font-bold">{TOP_DONATORS[1].amount}</span>
                          </div>

                          {/* 1st Place NotchFan */}
                          <div className="bg-white border-2 border-amber-300 rounded-xl p-4 text-center flex flex-col items-center relative overflow-hidden group shadow-lg scale-105 z-10">
                            <div className="absolute top-0 right-0 w-6 h-6 bg-amber-400 text-amber-950 rounded-bl text-xs font-black flex items-center justify-center">1</div>
                            <img alt="Top donator avatar" className="w-12 h-12 rounded-full border-2 border-amber-300 mb-2 object-cover shadow" src={TOP_DONATORS[0].avatar} />
                            <span className="text-xs text-amber-800 block font-extrabold truncate max-w-full">{TOP_DONATORS[0].name}</span>
                            <span className="text-xs text-amber-600 font-mono font-black">{TOP_DONATORS[0].amount}</span>
                          </div>

                          {/* 3rd Place MinerPro */}
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center flex flex-col items-center relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-6 h-6 bg-slate-200 text-slate-600 rounded-bl text-xs font-black flex items-center justify-center">3</div>
                            <img alt="MinerPro user profile avatar" className="w-10 h-10 rounded-full border border-slate-200 mb-2 object-cover shadow-sm" src={TOP_DONATORS[2].avatar} />
                            <span className="text-xs text-slate-800 block font-bold truncate max-w-full">{TOP_DONATORS[2].name}</span>
                            <span className="text-[10px] text-amber-600 font-mono font-bold">{formatVND(parseInt(TOP_DONATORS[2].amount.replace(/\D/g, '')) * 1000)}</span>
                          </div>

                        </div>
                      </div>

                    </div>

                  </div>

                </section>

              </motion.div>
            )}

            {/* TABS 2: STORE MODULE */}
            {activeTab === 'Cửa hàng' && (
              <motion.div 
                key="store-tab"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-8"
              >
                
                {/* Store layout filters header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex flex-wrap gap-2">
                    
                    {/* Filter buttons */}
                    {(['All', 'Rank', 'BattlePass', 'Cosmetic', 'Coins'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setStoreFilter(f)}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          storeFilter === f 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-150 border border-slate-200/50'
                        }`}
                      >
                        {f === 'All' ? 'Tất cả' : f === 'Rank' ? 'Hạng Premium' : f === 'BattlePass' ? 'Battle Pass' : f === 'Cosmetic' ? 'Vật phẩm đắp' : 'Nạp Coi USD'}
                      </button>
                    ))}
                    
                  </div>

                  {/* Search query box */}
                  <div className="relative w-full md:w-64">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Tìm kiếm vật phẩm..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Grid items listing */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredStoreItems.map((item) => {
                    const isPurchasable = item.currency === 'USD' || userProfile.balance >= item.price;
                    return (
                      <div 
                        key={item.id}
                        className="bg-white rounded-2xl p-6 flex flex-col justify-between border border-slate-200/80 hover:border-indigo-300 hover:scale-[1.01] transition-all relative group shadow-md"
                      >
                        {item.badge && (
                          <span className="absolute top-4 right-4 bg-amber-50 border border-amber-200 text-amber-700 font-mono text-[9px] uppercase font-bold px-2 py-0.5 rounded">
                            {item.badge}
                          </span>
                        )}

                        <div className="space-y-4">
                          {/* Award icon mapping block with dynamic colors */}
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                            item.type === 'Rank' 
                            ? 'bg-indigo-50 text-indigo-600 border-indigo-100' 
                            : item.type === 'BattlePass' 
                            ? 'bg-amber-50 text-amber-600 border-amber-100'
                            : item.type === 'Cosmetic'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : 'bg-teal-50 text-teal-600 border-teal-100'
                          }`}>
                            {item.icon === 'workspace_premium' && <Award className="w-5 h-5" />}
                            {item.icon === 'military_tech' && <Star className="w-5 h-5" />}
                            {item.icon === 'stars' && <Flame className="w-5 h-5" />}
                            {item.icon === 'swords' && <Swords className="w-5 h-5" />}
                            {item.icon === 'diamond' && <Gem className="w-5 h-5" />}
                            {item.icon === 'payments' && <Coins className="w-5 h-5" />}
                          </div>

                          <div>
                            <h4 className="font-display font-extrabold text-slate-900 text-base">
                              {item.name}
                            </h4>
                            <p className="text-xs text-slate-500 mt-2 leading-relaxed font-medium">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {/* Card bottom details */}
                        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold">Đơn giá</span>
                            <span className="text-lg font-black font-mono text-slate-950">
                              {item.currency === 'USD' || item.price > 1000 ? formatVND(item.price) : `${item.price.toLocaleString('vi-VN')} Xu`}
                            </span>
                          </div>

                          <button
                            onClick={() => handlePurchaseItem(item)}
                            className={`py-2 px-4 rounded-lg font-display font-bold text-xs uppercase tracking-wide transition-all cursor-pointer ${
                              item.currency === 'USD'
                              ? 'bg-indigo-600 text-white hover:bg-slate-900 shadow shadow-indigo-150'
                              : isPurchasable 
                              ? 'bg-indigo-600 text-white hover:bg-slate-900 shadow shadow-indigo-150' 
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                            }`}
                          >
                            {item.currency === 'USD' || item.price > 1000 ? 'Thanh toán Thẻ' : isPurchasable ? 'Mua ngay' : 'Không đủ Xu'}
                          </button>
                        </div>

                      </div>
                    );
                  })}

                  {/* Empty state store check */}
                  {filteredStoreItems.length === 0 && (
                    <div className="col-span-full py-16 text-center text-slate-400 font-medium font-sans">
                        Không tìm thấy sản phẩm nào khớp với tìm kiếm.
                    </div>
                  )}

                </section>

              </motion.div>
            )}

            {/* TABS 3: HISTORY MODULE */}
            {activeTab === 'Lịch sử' && (
              <motion.div 
                key="history-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-md"
              >
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                  <div>
                    <h3 className="font-display font-extrabold text-lg text-slate-950 uppercase">
                      Lịch sử giao dịch chi tiết
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      Danh sách biến động số dư và các gói dịch vụ bạn đã mua của tài khoản portal.
                    </p>
                  </div>
                  
                  {/* Ledger statistics indicators */}
                  <div className="flex gap-4">
                    <div className="bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200 text-right font-mono">
                      <span className="text-[10px] uppercase text-slate-400 block font-bold">Số giao dịch</span>
                      <span className="text-sm font-black text-slate-800">{transactions.length} lượt</span>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] text-slate-450 uppercase font-bold">
                        <th className="py-3.5 px-4">Mã Giao dịch</th>
                        <th className="py-3.5 px-4">Yêu cầu giao dịch</th>
                        <th className="py-3.5 px-4">Chi tiết Vật phẩm</th>
                        <th className="py-3.5 px-4">Sự biến động</th>
                        <th className="py-3.5 px-4">Thời gian</th>
                        <th className="py-3.5 px-4 text-right">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors text-slate-700">
                          <td className="py-4 px-4 font-mono text-slate-400 font-semibold uppercase">{tx.id}</td>
                          <td className="py-4 px-4">
                            <span className={`inline-block px-2 py-0.5 text-[9px] font-mono tracking-widest font-bold rounded-lg uppercase ${
                              tx.type === 'Deposit' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                            }`}>
                              {tx.type === 'Deposit' ? 'Nạp tiền Coi' : 'Cửa hàng shop'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-slate-900 font-bold">{tx.item}</td>
                          <td className={`py-4 px-4 font-mono font-bold ${tx.coinsChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {tx.amount}
                          </td>
                          <td className="py-4 px-4 text-slate-400 font-medium">{tx.date}</td>
                          <td className="py-4 px-4 text-right flex items-center justify-end gap-2 h-14">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                            <span className="text-slate-900 font-bold">{tx.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </motion.div>
            )}

            {/* TABS 4: SETTINGS PANEL */}
            {activeTab === 'Cài đặt' && (
              <motion.div 
                key="settings-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                
                {/* Left grid: general profile form */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-8 flex flex-col gap-6 border border-slate-200 shadow-md">
                  <h3 className="font-display font-extrabold text-lg text-slate-950 uppercase tracking-wider mb-2">
                    Thiết lập tài khoản người chơi
                  </h3>

                  <form onSubmit={e => { e.preventDefault(); triggerNotification('Cập nhật tài khoản thành công!'); }} className="space-y-4 text-xs">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-700 uppercase tracking-wide">Minecraft Username</label>
                        <input 
                          type="text" 
                          value={userProfile.username} 
                          onChange={e => {
                            const val = e.target.value;
                            setUserProfile(prev => ({ ...prev, username: val }));
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-700 uppercase tracking-wide">Email đăng ký portal</label>
                        <input 
                          type="email" 
                          value={userProfile.email} 
                          onChange={e => {
                            const val = e.target.value;
                            setUserProfile(prev => ({ ...prev, email: val }));
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                      </div>

                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-700 uppercase tracking-wide">Cấp bậc server (Visual Rank)</label>
                        <select 
                          value={userProfile.rank} 
                          onChange={e => {
                            const val = e.target.value as any;
                            setUserProfile(prev => ({ ...prev, rank: val }));
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Guest">Guest</option>
                          <option value="VIP">VIP</option>
                          <option value="MVP">MVP</option>
                          <option value="MVP+">MVP+</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-700 uppercase tracking-wide">Nhóm thành viên sở hữu</label>
                        <input 
                          disabled 
                          type="text" 
                          value="Thành Viên Cao Cấp (Premium Elite)" 
                          className="w-full bg-slate-50 border border-slate-100 rounded-lg py-3 px-3 text-slate-400 cursor-not-allowed font-medium"
                        />
                      </div>

                    </div>

                    <div className="pt-4">
                      <button 
                        type="submit"
                        className="py-3 px-6 bg-indigo-600 text-white font-bold rounded-lg uppercase tracking-wider hover:bg-slate-900 shadow shadow-indigo-100 transition-all cursor-pointer"
                      >
                        Lưu thông tin cập nhật
                      </button>
                    </div>

                  </form>
                </div>

                {/* Right grid: secure variables */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                  
                  {/* Security panel card */}
                  <div className="bg-white rounded-2xl p-6 flex flex-col gap-4 border border-slate-200 shadow-md">
                    <h4 className="font-display font-extrabold text-sm text-slate-950 uppercase tracking-wider border-b border-slate-100 pb-2">
                      Bảo mật & Liên kết
                    </h4>

                    {/* Checkbox item 1 */}
                    <div className="flex items-center justify-between py-2 border-b border-slate-50">
                      <div>
                        <span className="block font-bold text-slate-800">Xác thực 2 lớp (2FA)</span>
                        <span className="block text-[10px] text-slate-400 font-medium mt-0.5">Bảo mật mã OTP qua điện thoại</span>
                      </div>
                      <input 
                        type="checkbox" 
                        defaultChecked={true}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer" 
                        onChange={() => triggerNotification('Thay đổi trạng thái 2FA thành công')}
                      />
                    </div>

                    {/* Checkbox item 2 */}
                    <div className="flex items-center justify-between py-2 border-b border-slate-50">
                      <div>
                        <span className="block font-bold text-slate-800">Liên kết Discord</span>
                        <span className="block text-[10px] text-slate-400 font-medium mt-0.5">Đồng bộ danh hiệu lên Discord</span>
                      </div>
                      <input 
                        type="checkbox" 
                        defaultChecked={false}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer" 
                        onChange={() => triggerNotification('Liên kết đồng bộ Discord thành công! Hãy liên hệ bot để gạt.')}
                      />
                    </div>

                    {/* Checkbox item 3 */}
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <span className="block font-bold text-slate-800">Thông báo Webhook</span>
                        <span className="block text-[10px] text-slate-400 font-medium mt-0.5">Cảnh báo khi tài khoản đăng nhập</span>
                      </div>
                      <input 
                        type="checkbox" 
                        defaultChecked={true}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer" 
                        onChange={() => triggerNotification('Cài đặt Webhook thành công')}
                      />
                    </div>

                  </div>

                  {/* Character Visor layout info */}
                  <div className="bg-white rounded-2xl p-6 flex flex-col items-center text-center gap-4 border border-slate-200 shadow-md">
                    <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                      <ShieldCheck className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 text-sm">Trạng thái xác minh</h5>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed font-semibold">
                        Minecraft UUID đã liên kết thành phẩm qua cổng Mojang/Microsoft. Thiết bị IP hoạt động: Hà Nội, Việt Nam.
                      </p>
                    </div>
                    <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 font-mono text-[9px] uppercase font-bold py-1.5 px-4 rounded-full">
                      BẢO MẬT - ĐÃ ĐỒNG BỘ
                    </span>
                  </div>

                </div>

              </motion.div>
            )}

          </AnimatePresence>

        </main>

        {/* FOOTER */}
        <footer className="mt-auto border-t border-slate-200 bg-white shadow-inner z-10 text-slate-400 py-12">
          <div className="max-w-7xl mx-auto px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              
              <div className="md:col-span-1 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100">
                    <Gem className="text-indigo-600 w-4 h-4" />
                  </div>
                  <span className="font-display font-extrabold tracking-wider text-slate-900 text-base">EMERALD REALM</span>
                </div>
                <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                  Trải nghiệm sinh tồn Minecraft hoàn mỹ trên nền tảng Portal nạp tài nguyên cao cấp và đội ngũ chăm sóc 24/7.
                </p>
              </div>

              <div>
                <h4 className="font-display font-bold text-xs text-slate-900 mb-6 uppercase tracking-wider">Liên kết nhanh</h4>
                <ul className="space-y-3 text-xs text-slate-500 font-medium">
                  <li><button onClick={() => setActiveTab('Trang chủ')} className="hover:text-indigo-600 transition-colors text-left cursor-pointer">Trang chủ</button></li>
                  <li><button onClick={() => setActiveTab('Cửa hàng')} className="hover:text-indigo-600 transition-colors text-left cursor-pointer">Cửa hàng & Hạng</button></li>
                  <li><a href="#" className="hover:text-indigo-600 transition-colors text-left">Community Forums</a></li>
                  <li><a href="#" className="hover:text-indigo-600 transition-colors text-left">Vote for Server</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-display font-bold text-xs text-slate-900 mb-6 uppercase tracking-wider">Support & Legal</h4>
                <ul className="space-y-3 text-xs text-slate-500 font-medium">
                  <li><a href="#" className="hover:text-indigo-600 transition-colors text-left">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-indigo-600 transition-colors text-left">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-indigo-600 transition-colors text-left">Refund Policy</a></li>
                  <li><a href="#" className="hover:text-indigo-600 transition-colors text-left">Contact Support</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-display font-bold text-xs text-slate-900 mb-6 uppercase tracking-wider">Connect With Us</h4>
                <div className="flex gap-4 mb-4">
                  <a href="#" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 transition-all">
                    <MessageSquare className="w-4 h-4" />
                  </a>
                  <a href="#" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 transition-all">
                    <Mail className="w-4 h-4" />
                  </a>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                  Join 12,000+ members on our Discord for events and updates.
                </p>
              </div>

            </div>

            <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-[11px] text-slate-400 font-semibold">
                © 2016 Emerald Realm Minecraft Server Portal. Not affiliated with Mojang AB or Microsoft.
              </p>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-400 animate-pulse" />
                <span className="text-[11px] text-slate-500 uppercase font-mono font-bold">All Systems Operational</span>
              </div>
            </div>

          </div>
        </footer>

      </div>

      {/* 5. MODAL DETAILED DEPOSIT WITH FLUID INPUT SIMULATION */}
      <AnimatePresence>
        {showDepositModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4 text-slate-800"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-slate-200/80"
            >
              
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <CreditCard className="text-indigo-600 w-5 h-5" />
                  <h3 className="font-display font-extrabold text-base text-slate-950 uppercase tracking-wider">
                    Nạp Xu Vào Tài Khoản
                  </h3>
                </div>
                <button 
                  onClick={() => setShowDepositModal(false)}
                  className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-slate-600 cursor-pointer border border-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-indigo-50/50 border-l-4 border-indigo-600 text-indigo-950 text-xs p-3.5 rounded-lg mb-5 leading-relaxed font-sans font-medium">
                💡 Đây là môi trường thử nghiệm Portal. Bạn có thể nạp tiền giả định qua tùy chọn Thẻ tín dụng mô phỏng hoặc nhập Mã kích hoạt quà tặng bất kỳ để thử cộng Coins lập tức.
              </div>

              <form onSubmit={handlePerformDeposit} className="space-y-5 text-xs text-slate-700">
                
                {/* Simulated Option A: Giftcard code */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block uppercase tracking-wide">CÁCH 1: NHẬP MÃ GIFT CARD (Cộng 500 Coins)</label>
                  <input 
                    type="text"
                    placeholder="Ví dụ: EMERALD-GIFT-MOCK"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    value={depositCode}
                    onChange={e => setDepositCode(e.target.value)}
                  />
                </div>

                <div className="text-center text-slate-400 font-bold block my-1">--- HOẶC ---</div>

                {/* Simulated Option B: Select Card USD Top up */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block uppercase tracking-wide">CÁCH 2: THANH TOÁN THẺ ĐỒNG USD</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: '20000', label: '20.000 VNĐ' },
                      { val: '50000', label: '50.000 VNĐ' },
                      { val: '100000', label: '100.000 VNĐ' },
                    ].map(opt => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => {
                          setDepositAmount(opt.val);
                          setDepositCode(''); // clear coupon
                        }}
                        className={`p-2.5 rounded-lg font-mono font-bold text-[11px] text-center border transition-all cursor-pointer ${
                          depositAmount === opt.val && !depositCode
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow shadow-indigo-150'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDepositModal(false)}
                    className="flex-1 py-3 rounded-lg bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold uppercase transition-colors cursor-pointer text-center text-xs"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-lg bg-indigo-600 text-white font-display font-bold uppercase tracking-wider hover:bg-slate-900 transition-all cursor-pointer text-center text-xs shadow shadow-indigo-150"
                  >
                    Xác nhận Nạp Xu
                  </button>
                </div>

              </form>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
