/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, type SyntheticEvent } from 'react';
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
  Swords,
  Users,
  Eye,
  EyeOff,
  Check,
  TriangleAlert,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import type { Transaction, UserProfile, StoreItem, PortalTab } from '../types';
import api from '../lib/api';
import { formatVND } from '../lib/utils';
import { getPromotionBadge } from '../lib/promotions';
import { useLocation, useNavigate } from 'react-router-dom';
import paymentService from '../services/paymentService';
import type { MonthlyTopDonator } from '../services/paymentService';
import minecraftService from '../services/minecraftService';
import PromotionBadge from './PromotionBadge';
import notificationService from '../services/notificationService';
import type { NotificationItem } from '../types';
import { toast } from 'react-hot-toast';


interface DashboardScreenProps {
  user: any;
  onLogout: () => void;
}

function mapProfileData(data: any): UserProfile {
  const minecraftUsername = data.minecraftUsername || data.username || '';
  return {
    username: minecraftUsername || data.username || '',
    email: data.email || '',
    balance: data.balance ?? 0,
    totalDeposited: data.totalDeposited ?? 0,
    rank: data.rank || 'Member',
    battlePassLevel: data.battlePassLevel ?? 1,
    battlePassXp: data.battlePassXp ?? 0,
    minecraftUsername,
    minecraftVerified: data.minecraftVerified ?? Boolean(minecraftUsername),
    role: data.role,
  };
}

export default function DashboardScreen({ user, onLogout }: DashboardScreenProps) {
  const navigate = useNavigate();
  const location = useLocation();
  // Current user global state from backend
  const [userProfile, setUserProfile] = useState<UserProfile>(() => mapProfileData(user));




  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyTopDonators, setMonthlyTopDonators] = useState<MonthlyTopDonator[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [activeTab, setActiveTab] = useState<PortalTab>(() => ((location.state as any)?.tab as PortalTab) || 'Trang chủ');
  const [storeFilter, setStoreFilter] = useState<'All' | 'Rank' | 'BattlePass' | 'Cosmetic' | 'Coins'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch initial data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [txRes, pkgRes, profileRes] = await Promise.all([
          paymentService.getHistory(1, 50),
          api.get('/packages'),
          api.get('/users/profile') // Get fresh profile with sync balance
        ]);
        setTransactions(txRes.transactions || []);
        setUserProfile(mapProfileData(profileRes.data));
        
        // Map CoinPackage to StoreItem
        const mappedItems: StoreItem[] = pkgRes.data.map((pkg: any) => {
          const baseCoins = Number(pkg.baseCoins ?? pkg.coinAmount ?? 0);
          const rawBonusCoins = Number(pkg.bonusCoins ?? pkg.bonusCoin ?? 0);
          const promotionType = pkg.promotionType ?? (rawBonusCoins > 0 ? 'bonus_coin' : 'none');
          const bonusCoins = rawBonusCoins;
          const promotionPercent = Number(pkg.promotionPercent ?? (baseCoins > 0 && bonusCoins > 0 ? Math.round((bonusCoins / baseCoins) * 1000) / 10 : 0));
          const discountPercent = promotionType === 'discount' ? Number(pkg.discountPercent ?? 0) : 0;
          const originalPrice = Number(pkg.originalPrice ?? pkg.price ?? 0);
          const finalPrice = Number(pkg.finalPrice ?? (discountPercent > 0 ? Math.round(originalPrice - (originalPrice * discountPercent) / 100) : originalPrice));
          const promotionBadgeText = getPromotionBadge({
            promotionType,
            discountPercent,
            bonusCoins,
            baseCoins,
          })?.text ?? '';
          return {
            id: pkg._id,
            _id: pkg._id,
            name: pkg.name,
            description: pkg.description || '',
            price: finalPrice,
            currency: 'USD',
            badge: pkg.category === 'Coin' && promotionBadgeText ? promotionBadgeText : undefined,
            icon: pkg.category === 'Coin' ? 'payments' : pkg.category === 'VIP' ? 'workspace_premium' : 'stars',
            type: pkg.category === 'Coin' ? 'Coins' : pkg.category === 'VIP' ? 'Rank' : 'BattlePass',
            bonusCoin: bonusCoins,
            bonusCoins,
            coinAmount: baseCoins,
            baseCoins,
            promotionPercent,
            promotionType,
            discountPercent,
            originalPrice,
            finalPrice,
            promotionBadgeText,
            commands: pkg.commands || [],
            rights: pkg.rights || [],
            category: pkg.category,
            image: pkg.image,
            items: pkg.items || [],
            duration: pkg.duration || '',
          };
        });
        setStoreItems(mappedItems);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const tab = (location.state as any)?.tab as PortalTab | undefined;
    if (tab) setActiveTab(tab);
  }, [location.state]);

  useEffect(() => {
    const fetchMonthlyTopDonators = async () => {
      try {
        const data = await paymentService.getMonthlyTopDonators();
        setMonthlyTopDonators(data.topDonators || []);
      } catch (error) {
        console.warn('Failed to fetch monthly top donators.');
        setMonthlyTopDonators([]);
      }
    };

    fetchMonthlyTopDonators();
  }, []);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    const loadNotifications = async () => {
      try {
        const [items, count] = await Promise.all([
          notificationService.list(),
          notificationService.unreadCount(),
        ]);
        setUserNotifications(items);
        setUnreadCount(count);
      } catch (error) {
        console.warn('Failed to load notifications.');
      }
    };

    void loadNotifications();

    if (localStorage.getItem('token')) {
      eventSource = notificationService.openStream();
      eventSource.addEventListener('notification:new', (event) => {
        const incoming = JSON.parse((event as MessageEvent).data) as NotificationItem;
        setUserNotifications((prev) => {
          if (prev.some((item) => item.receiptId === incoming.receiptId)) return prev;
          setUnreadCount((count) => count + 1);
          return [incoming, ...prev].slice(0, 50);
        });
        toast(`${incoming.title}: ${incoming.message}`, {
          position: 'top-right',
          duration: 5000,
        });
      });
      eventSource.onerror = () => {
        console.warn('Notification stream disconnected; browser will retry.');
      };
    }

    return () => {
      eventSource?.close();
    };
  }, []);

  // States for Modals
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'refuse' } | null>(null);
  const [userNotifications, setUserNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);

  // Package Purchase States
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<StoreItem | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [playerConfirmed, setPlayerConfirmed] = useState(false);
  const [isVerifyingPlayer, setIsVerifyingPlayer] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  // New: Package Detail Modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<StoreItem | null>(null);
  const [detailModalStep, setDetailModalStep] = useState<'detail' | 'player-check'>('detail');

  // Helper function to trigger interactive popups
  const triggerNotification = (message: string, type: 'success' | 'refuse' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const formatNotificationTime = (date: string) => {
    if (!date) return '';
    return new Date(date).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    setSelectedNotificationId(item.receiptId);
    if (item.isRead) return;

    try {
      const updated = await notificationService.markRead(item.receiptId);
      setUserNotifications((prev) => prev.map((notificationItem) => (
        notificationItem.receiptId === item.receiptId ? updated : notificationItem
      )));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      triggerNotification('Khong the danh dau thong bao da doc', 'refuse');
    }
  };

  const handleReadAllNotifications = async () => {
    try {
      await notificationService.markAllRead();
      const readAt = new Date().toISOString();
      setUserNotifications((prev) => prev.map((item) => ({ ...item, isRead: true, readAt })));
      setUnreadCount(0);
    } catch (error) {
      triggerNotification('Khong the doc tat ca thong bao', 'refuse');
    }
  };

  const linkedMcName = userProfile.minecraftUsername || userProfile.username;
  const defaultMinecraftAvatarUrl = 'https://mc-heads.net/avatar/Steve';
  const getMinecraftAvatarUrl = (username?: string) => {
    const playerName = String(username || '').trim();
    return `https://mc-heads.net/avatar/${encodeURIComponent(playerName || 'Steve')}`;
  };
  const playerAvatarUrl = getMinecraftAvatarUrl(linkedMcName);
  const handleAvatarError = (event: SyntheticEvent<HTMLImageElement>) => {
    if (event.currentTarget.src !== defaultMinecraftAvatarUrl) {
      event.currentTarget.src = defaultMinecraftAvatarUrl;
    }
  };
  const monthlyTopByRank = new Map(monthlyTopDonators.map((donator) => [donator.rank, donator]));
  const formatTopAmount = (amount: number) => `${new Intl.NumberFormat('vi-VN').format(amount)} VND`;
  const getItemBaseCoins = (item?: StoreItem | null) => Number(item?.baseCoins ?? item?.coinAmount ?? 0);
  const getItemBonusCoins = (item?: StoreItem | null) => Number(item?.bonusCoins ?? item?.bonusCoin ?? 0);
  const getItemTotalCoins = (item?: StoreItem | null) => getItemBaseCoins(item) + getItemBonusCoins(item);

  // Requirement 5: Auto refresh balance helper
  const refreshBalance = useCallback(async () => {
    if (!linkedMcName) return;
    try {
      const res = await minecraftService.getPlayerBalance(linkedMcName);
      setUserProfile(prev => ({ ...prev, balance: res.balance }));
    } catch (err) {
      console.warn('Failed to refresh balance.');
    }
  }, [linkedMcName]);

  useEffect(() => {
    if (activeTab === 'Trang chủ' || activeTab === 'Cửa hàng') {
      refreshBalance();
    }
    
    const interval = setInterval(refreshBalance, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, [activeTab, refreshBalance]);

  useEffect(() => {
    if (activeTab !== 'Lịch sử') return;

    const fetchPaymentHistory = async () => {
      try {
        const data = await paymentService.getHistory(1, 50);
        setTransactions(data.transactions || []);
      } catch (error) {
        console.warn('Failed to refresh payment history.');
      }
    };

    fetchPaymentHistory();
    const interval = setInterval(fetchPaymentHistory, 3000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const handlePurchaseItem = (item: StoreItem) => {
    // Show details first
    setSelectedDetail(item);
    setDetailModalStep('detail');
    setShowDetailModal(true);
  };


  // Dynamic filter for shop items
  const filteredStoreItems = storeItems.filter(item => {
    const matchesFilter = storeFilter === 'All' || item.type === storeFilter;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const resetPurchaseModal = () => {
    setShowPurchaseModal(false);
    setPlayerConfirmed(false);
    setVerifyError('');
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setDetailModalStep('detail');
    setPlayerConfirmed(false);
    setVerifyError('');
  };

  const handleVerifyPlayer = async () => {
    if (!linkedMcName || isVerifyingPlayer) return;

    setIsVerifyingPlayer(true);
    setVerifyError('');
    try {
      const res = await minecraftService.getPlayerBalance(linkedMcName);
      if (res.success) {
        setPlayerConfirmed(true);
        triggerNotification('Kiểm tra player thành công', 'success');
      }
    } catch (error: any) {
      setPlayerConfirmed(false);
      const message = error.response?.data?.error === 'PLAYER_NOT_FOUND'
        ? 'Không tìm thấy player'
        : (error.response?.data?.message || 'Không tìm thấy player');
      setVerifyError(message);
      triggerNotification(message, 'refuse');
    } finally {
      setIsVerifyingPlayer(false);
    }
  };

  const handleConfirmPurchase = async (packageOverride?: StoreItem) => {
    const packageToBuy = packageOverride || selectedPackage;
    if (!packageToBuy) return;

    if (!linkedMcName) {
      triggerNotification('Tài khoản chưa có Minecraft Username đã xác minh.', 'refuse');
      return;
    }

    if (!playerConfirmed) {
      triggerNotification('Vui lòng xác nhận nhân vật trước khi thanh toán.', 'refuse');
      return;
    }

    try {
      setIsPurchasing(true);
      const response = await paymentService.createPayment(
        packageToBuy.id || (packageToBuy as any)._id
      );
      navigate(`/payment/checkout/${response.transactionId}`);
    } catch (error: any) {
      triggerNotification(error.response?.data?.message || 'Lỗi khi tạo giao dịch.', 'refuse');
    } finally {
      setIsPurchasing(false);
    }
  };


  return (
    <div className="flex bg-slate-50 text-slate-800 min-h-screen text-sm font-sans flex-col md:flex-row relative">
      
      {/* Floating Dynamic status toast */}
      {createPortal(
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -50, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: -40, x: '-50%' }}
              className={`fixed top-6 left-1/2 z-[9999] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${
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
        </AnimatePresence>,
        document.body
      )}

      {/* SideNavBar - Persistent on Desktop */}
      <nav className="hidden md:flex bg-slate-900 fixed left-0 top-0 h-full w-64 border-r border-slate-800 shadow-2xl flex-col py-8 z-40 justify-between">
        
        {/* Brand logo details exactly as image 1 */}
        <div className="px-6 flex flex-col items-center">
          <img 
            alt="Server Logo" 
            className="w-16 h-16 rounded-xl mb-4 object-cover border-2 border-slate-700 shadow-lg transform hover:scale-105 transition-all" 
            src="/logo.png"
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

        {/* Deposit Button - Link to Store with Coins filter */}
        <div className="px-4 mt-auto py-2">
          <button 
            onClick={() => {
              setStoreFilter('Coins');
              setActiveTab('Cửa hàng');
            }}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-indigo-900/20 text-center cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
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
            src="/logo.png"
          />
          <span className="font-display font-black text-indigo-400 tracking-wider">CỔNG DỊCH VỤ</span>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setStoreFilter('Coins');
              setActiveTab('Cửa hàng');
            }}
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
              Đang quản lý tài khoản: <span className="font-bold text-indigo-600">{linkedMcName}</span> - Minecraft Portal Việt Nam
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



            {/* Bell Indicator */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationOpen((prev) => !prev)}
                className="p-2 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <>
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                    <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center shadow">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  </>
                )}
              </button>

              <AnimatePresence>
                {isNotificationOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    className="absolute right-0 top-12 z-[9999] w-[min(92vw,420px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                      <div>
                        <p className="text-sm font-black text-slate-900">Thong bao</p>
                        <p className="text-[11px] font-semibold text-slate-500">{unreadCount} chua doc</p>
                      </div>
                      <button
                        onClick={handleReadAllNotifications}
                        disabled={unreadCount === 0}
                        className="rounded-lg px-3 py-1.5 text-[11px] font-black text-indigo-600 hover:bg-indigo-50 disabled:text-slate-300 disabled:hover:bg-transparent"
                      >
                        Doc tat ca
                      </button>
                    </div>

                    <div className="max-h-[420px] overflow-y-auto">
                      {userNotifications.length === 0 ? (
                        <div className="px-4 py-10 text-center text-sm font-semibold text-slate-400">
                          Chua co thong bao nao.
                        </div>
                      ) : (
                        userNotifications.map((item) => (
                          <button
                            key={item.receiptId}
                            onClick={() => handleNotificationClick(item)}
                            className={`w-full border-b border-slate-100 px-4 py-3 text-left transition-colors ${
                              item.isRead ? 'bg-white hover:bg-slate-50' : 'bg-indigo-50 hover:bg-indigo-100'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span className={`mt-1.5 h-2.5 w-2.5 rounded-full shrink-0 ${item.isRead ? 'bg-slate-300' : 'bg-red-500'}`} />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-3">
                                  <p className={`truncate text-sm ${item.isRead ? 'font-bold text-slate-700' : 'font-black text-slate-950'}`}>
                                    {item.title}
                                  </p>
                                  <span className="shrink-0 text-[10px] font-semibold text-slate-400">
                                    {formatNotificationTime(item.createdAt)}
                                  </span>
                                </div>
                                <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-slate-500">
                                  {item.message}
                                </p>
                                <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
                                  {item.type}
                                </span>
                                {selectedNotificationId === item.receiptId && (
                                  <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium leading-relaxed text-slate-700 shadow-sm">
                                    {item.message}
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Avatar Profile */}
            <div 
              onClick={() => setActiveTab('Cài đặt')}
              className="w-11 h-11 rounded-[14px] bg-white border border-slate-200 overflow-hidden cursor-pointer hover:border-indigo-500 transition-colors shadow-[0_10px_30px_rgba(0,0,0,.08)]"
            >
              <img 
                alt={`${linkedMcName || 'Steve'} Minecraft avatar`}
                className="w-full h-full object-cover object-center"
                src={playerAvatarUrl}
                onError={handleAvatarError}
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
                      Chào mừng trở lại, <span className="text-indigo-600 font-black">{linkedMcName}</span>
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

                    </div>
                  </div>

                  <div className="z-10 w-full lg:w-auto flex justify-center">
                    <div className="w-40 h-40 sm:w-48 sm:h-48 lg:w-56 lg:h-56 bg-white border border-slate-100 rounded-[18px] shadow-[0_10px_30px_rgba(0,0,0,.08)] relative overflow-hidden flex items-center justify-center group">
                      <img 
                        alt={`${linkedMcName || 'Steve'} Minecraft avatar`}
                        className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform"
                        src={playerAvatarUrl}
                        onError={handleAvatarError}
                      />
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
                      <p className="text-xs text-slate-500 font-semibold font-sans md:mb-1">Số dư coins hiện tại</p>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                        {userProfile.balance.toLocaleString('vi-VN')}{' '}
                        <span className="text-sm font-normal text-slate-400">Coins</span>
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
                      onClick={() => {
                        setStoreFilter('Coins');
                        setActiveTab('Cửa hàng');
                      }}
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
                               <tr key={tx._id || tx.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors text-slate-700">
                                  <td className="py-3.5 px-4 font-bold text-slate-900">
                                    {tx.type}
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">#{tx.transactionId || tx._id?.substring(0, 8)}</div>
                                  </td>
                                  <td className="py-3.5 px-4 text-slate-500 font-medium">
                                    {tx.item}
                                    {(tx.playerName || tx.minecraftUsername) && (
                                      <div className="text-[10px] text-indigo-500 font-bold uppercase mt-0.5">
                                        {tx.playerName || tx.minecraftUsername}
                                      </div>
                                    )}
                                  </td>
                                  <td className={`py-3.5 px-4 font-mono font-bold ${tx.coinsChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {tx.amount}
                                  </td>
                                  <td className="py-3.5 px-4 text-right">
                                    <span className={`inline-block px-2.5 py-1 text-[10px] font-mono tracking-wider font-semibold rounded-lg uppercase border ${
                                      ['completed', 'paid'].includes(String(tx.status).toLowerCase()) 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                      : String(tx.status).toLowerCase() === 'pending'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                                      : 'bg-red-50 text-red-700 border-red-200'
                                    }`}>
                                      {['completed', 'paid'].includes(String(tx.status).toLowerCase()) ? 'Hoàn tất' : 
                                       String(tx.status).toLowerCase() === 'pending' ? 'Chờ xử lý' : 
                                       String(tx.status).toLowerCase() === 'cancelled' ? 'Đã hủy' : 'Thất bại'}
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

                        {monthlyTopDonators.length === 0 ? (
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 text-center">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                              Chưa có dữ liệu nạp thẻ trong tháng này
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-4 items-end pt-2">
                            {monthlyTopByRank.get(2) ? (
                              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center flex flex-col items-center relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-6 h-6 bg-slate-200 text-slate-600 rounded-bl text-xs font-black flex items-center justify-center">2</div>
                                <img alt="Top 2 user avatar" className="w-10 h-10 rounded-full border border-slate-200 mb-2 object-cover shadow-sm" src={monthlyTopByRank.get(2)!.avatar} />
                                <span className="text-xs text-slate-800 block font-bold truncate max-w-full">{monthlyTopByRank.get(2)!.displayName}</span>
                                <span className="text-[10px] text-indigo-600 font-mono font-bold">{formatTopAmount(monthlyTopByRank.get(2)!.totalAmount)}</span>
                              </div>
                            ) : (
                              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center flex flex-col items-center justify-center min-h-[108px]">
                                <span className="text-[10px] text-slate-300 font-bold uppercase">Chưa có top 2</span>
                              </div>
                            )}

                            {monthlyTopByRank.get(1) ? (
                              <div className="bg-white border-2 border-amber-300 rounded-xl p-4 text-center flex flex-col items-center relative overflow-hidden group shadow-lg scale-105 z-10">
                                <div className="absolute top-0 right-0 w-6 h-6 bg-amber-400 text-amber-950 rounded-bl text-xs font-black flex items-center justify-center">1</div>
                                <img alt="Top 1 user avatar" className="w-12 h-12 rounded-full border-2 border-amber-300 mb-2 object-cover shadow" src={monthlyTopByRank.get(1)!.avatar} />
                                <span className="text-xs text-amber-800 block font-extrabold truncate max-w-full">{monthlyTopByRank.get(1)!.displayName}</span>
                                <span className="text-xs text-amber-600 font-mono font-black">{formatTopAmount(monthlyTopByRank.get(1)!.totalAmount)}</span>
                              </div>
                            ) : (
                              <div className="bg-white border-2 border-amber-100 rounded-xl p-4 text-center flex flex-col items-center justify-center min-h-[124px]">
                                <span className="text-[10px] text-slate-300 font-bold uppercase">Chưa có top 1</span>
                              </div>
                            )}

                            {monthlyTopByRank.get(3) ? (
                              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center flex flex-col items-center relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-6 h-6 bg-slate-200 text-slate-600 rounded-bl text-xs font-black flex items-center justify-center">3</div>
                                <img alt="Top 3 user avatar" className="w-10 h-10 rounded-full border border-slate-200 mb-2 object-cover shadow-sm" src={monthlyTopByRank.get(3)!.avatar} />
                                <span className="text-xs text-slate-800 block font-bold truncate max-w-full">{monthlyTopByRank.get(3)!.displayName}</span>
                                <span className="text-[10px] text-amber-600 font-mono font-bold">{formatTopAmount(monthlyTopByRank.get(3)!.totalAmount)}</span>
                              </div>
                            ) : (
                              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center flex flex-col items-center justify-center min-h-[108px]">
                                <span className="text-[10px] text-slate-300 font-bold uppercase">Chưa có top 3</span>
                              </div>
                            )}
                          </div>
                        )}
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
                        {f === 'All' ? 'Tất cả' : f === 'Rank' ? 'Hạng Premium' : f === 'BattlePass' ? 'Battle Pass' : f === 'Cosmetic' ? 'Vật phẩm' : 'Nạp coins'}
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
                    const discountPercent = Number(item.discountPercent || 0);
                    const promotionType = item.promotionType || 'none';
                    const baseCoins = getItemBaseCoins(item);
                    const bonusCoins = getItemBonusCoins(item);
                    const totalCoins = getItemTotalCoins(item);
                    const promotionBadge = getPromotionBadge(item);
                    const hasDiscountPromotion = item.type === 'Coins' && promotionType === 'discount' && discountPercent > 0;
                    const originalPrice = Number(item.originalPrice ?? item.price);
                    const finalPrice = Number(item.finalPrice ?? item.price);
                    return (
                      <div 
                        key={item.id}
                        onClick={() => handlePurchaseItem(item)}
                        className={`rounded-2xl p-6 flex flex-col justify-between border hover:scale-[1.01] transition-all relative group cursor-pointer ${
                          hasDiscountPromotion
                            ? 'border-red-400/35 bg-[linear-gradient(180deg,#fff7f7_0%,#ffffff_100%)] shadow-[0_10px_30px_rgba(239,68,68,0.12)] hover:border-red-400/60'
                            : 'bg-white border-slate-200/80 hover:border-indigo-300 shadow-md'
                        }`}
                      >
                        <PromotionBadge
                          badge={promotionBadge}
                          className="transition-transform duration-200 group-hover:scale-[1.08]"
                        />

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
                            {item.type === 'Coins' && (
                              <p className="text-[11px] text-emerald-600 mt-2 font-black">
                                Nhận {totalCoins.toLocaleString('vi-VN')} Coins
                                {bonusCoins > 0 && (
                                  <span className="block text-[10px] text-slate-500 font-bold mt-0.5">
                                    {baseCoins.toLocaleString('vi-VN')} + {bonusCoins.toLocaleString('vi-VN')} bonus
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Card bottom details */}
                        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold">Đơn giá</span>
                            {hasDiscountPromotion ? (
                              <>
                                <span className="text-xl font-black font-mono text-red-600">
                                  {formatVND(finalPrice)}
                                </span>
                                <span className="text-xs font-bold font-mono text-slate-400 line-through">
                                  {formatVND(originalPrice)}
                                </span>
                              </>
                            ) : (
                              <span className="text-lg font-black font-mono text-slate-950">
                                {item.currency === 'USD' || item.price > 1000 ? formatVND(item.price) : `${item.price.toLocaleString('vi-VN')} Xu`}
                              </span>
                            )}
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
                      <tr className="border-b border-slate-100 text-[11px] text-slate-400 uppercase font-bold text-center">
                        <th className="py-3.5 px-4 text-left">Mã đơn</th>
                        <th className="py-3.5 px-4">Yêu cầu</th>
                        <th className="py-3.5 px-4 text-left">Chi tiết Vật phẩm</th>
                        <th className="py-3.5 px-4">Biến động</th>
                        <th className="py-3.5 px-4">Thời gian</th>
                        <th className="py-3.5 px-4 text-right">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {transactions.map((tx) => (
                        <tr key={tx._id || tx.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors text-slate-700">
                          <td className="py-4 px-4 font-mono text-slate-400 font-semibold uppercase">
                            #{tx.orderCode || tx.id?.substring(0, 8)}
                            {tx.transactionId && <div className="text-[9px] text-slate-300">ID: {tx.transactionId}</div>}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`inline-block px-2 py-0.5 text-[9px] font-mono tracking-widest font-bold rounded-lg uppercase ${
                              tx.type === 'Deposit' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                            }`}>
                              {tx.type === 'Deposit' ? 'Nạp tiền' : 'Cửa hàng'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-slate-900 font-bold">
                            {tx.item}
                            {(tx.playerName || tx.minecraftUsername) && (
                              <div className="text-[9px] text-indigo-500 font-black">
                                PLAYER: {tx.playerName || tx.minecraftUsername}
                              </div>
                            )}
                          </td>
                          <td className={`py-4 px-4 font-mono font-bold text-center ${tx.coinsChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {tx.amount}
                          </td>
                          <td className="py-4 px-4 text-slate-400 font-medium text-center">{tx.date || (tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('vi-VN') : '')}</td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex flex-col items-end gap-1.5">
                              <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${
                                ['completed', 'paid'].includes(String(tx.status).toLowerCase())
                                ? 'bg-emerald-100 text-emerald-700'
                                : String(tx.status).toLowerCase() === 'pending'
                                ? 'bg-amber-100 text-amber-700 animate-pulse'
                                : String(tx.status).toLowerCase() === 'failed'
                                ? 'bg-red-200 text-red-900 font-black'
                                : 'bg-red-100 text-red-700'
                              }`}>
                                {['completed', 'paid'].includes(String(tx.status).toLowerCase()) ? 'Hoàn tất' : 
                                 String(tx.status).toLowerCase() === 'pending' ? 'Chờ xử lý' : 
                                 String(tx.status).toLowerCase() === 'cancelled' ? 'Đã hủy' : 'Thất bại'}
                              </span>
                              {String(tx.status).toLowerCase() === 'pending' && (
                                <button 
                                  onClick={() => navigate('/payment/checkout/' + (tx._id || tx.id))}
                                  className="text-[10px] font-black text-indigo-600 underline hover:text-slate-900"
                                >
                                  TIẾP TỤC
                                </button>
                              )}
                            </div>
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
                      
                      <div className="space-y-1.5 flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <label className="font-bold text-slate-700 uppercase tracking-wide">Minecraft Username</label>
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Verified
                          </span>
                        </div>
                        <input 
                          type="text" 
                          readOnly
                          value={linkedMcName || '—'} 
                          className="w-full bg-slate-100 border border-slate-200 rounded-lg py-3 px-3 text-slate-700 font-bold focus:outline-none transition-all cursor-not-allowed uppercase"
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
                        <input 
                          disabled 
                          type="text" 
                          value={userProfile.rank} 
                          className="w-full bg-slate-50 border border-slate-100 rounded-lg py-3 px-3 text-slate-400 cursor-not-allowed font-medium"
                        />
                        <p className="text-[10px] text-slate-400 font-medium italic">* Cấp bậc được cập nhật tự động khi bạn nâng cấp gói VIP tại Cửa hàng.</p>
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

                    <div className="pt-4 pb-8 border-b border-slate-100">
                      <button 
                        type="submit"
                        className="py-3 px-6 bg-indigo-600 text-white font-bold rounded-lg uppercase tracking-wider hover:bg-slate-900 shadow shadow-indigo-100 transition-all cursor-pointer"
                      >
                        Lưu thông tin cập nhật
                      </button>
                    </div>

                  </form>

                  {/* Change Password Section */}
                  <div className="mt-4">
                    <h3 className="font-display font-extrabold text-lg text-slate-950 uppercase tracking-wider mb-6">
                      Bảo mật & Đổi mật khẩu
                    </h3>
                    <ChangePasswordForm triggerNotification={triggerNotification} />
                  </div>
                </div>

                {/* Right grid: secure variables */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                  
                  {/* Security panel card */}
                  <div className="bg-white rounded-2xl p-6 flex flex-col gap-4 border border-slate-200 shadow-md">
                    {/* Checkbox item 1 */}
                    <div className="flex items-center justify-between py-2 border-b border-slate-50">
                      <div>
                        <span className="block font-bold text-slate-800">Xác thực 2 lớp (2FA)</span>
                        <span className="block text-[10px] text-slate-400 font-medium mt-0.5">Bảo mật mã OTP qua email</span>
                      </div>
                      <input 
                        type="checkbox" 
                        defaultChecked={true}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer" 
                        onChange={() => triggerNotification('Thay đổi trạng thái 2FA thành công')}
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
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-slate-200 overflow-hidden">
                    <img src="/logo.png" alt="Emerald Realm logo" className="w-full h-full object-cover" />
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

      {/* Package Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedDetail && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative z-[1010] bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="relative min-h-40 bg-[linear-gradient(135deg,#111827,#1f2937)] overflow-hidden shrink-0 px-8 py-8">
                <PromotionBadge
                  badge={getPromotionBadge(selectedDetail)}
                  style={{ top: 16, right: 64, maxWidth: 'calc(100% - 104px)' }}
                />
                <button 
                  onClick={closeDetailModal}
                  className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors backdrop-blur-md"
                >
                  <X size={20} />
                </button>
                <div className="pr-12">
                  <span className="px-3 py-1 bg-indigo-600 text-[10px] font-black text-white rounded-full uppercase tracking-widest mb-2 inline-block">
                    {selectedDetail.category || selectedDetail.type}
                  </span>
                  <h3 className="text-3xl font-black text-white uppercase tracking-tight">{selectedDetail.name}</h3>
                  {detailModalStep === 'player-check' && (
                    <p className="text-xs text-slate-300 mt-2 font-semibold uppercase tracking-wider">
                      Kiểm tra player Minecraft
                    </p>
                  )}
                </div>
              </div>

              {detailModalStep === 'detail' ? (
              <>
              <div className="p-8 overflow-y-auto custom-scrollbar flex-grow">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Mô tả gói nạp</h4>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium">
                        {selectedDetail.description || 'Gói nạp này chưa có mô tả chi tiết từ ban quản trị.'}
                      </p>
                      {selectedDetail.duration && (
                        <p className="text-xs text-indigo-600 font-bold mt-2 flex items-center gap-1">
                          <Flame size={12} />
                          Hạn sử dụng: {selectedDetail.duration}
                        </p>
                      )}
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500">Giá trị thực tế</span>
                        <span className="text-sm font-black text-slate-900">{getItemBaseCoins(selectedDetail).toLocaleString()} Xu</span>
                      </div>
                      {getItemBonusCoins(selectedDetail) > 0 && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-600">Thưởng kèm theo</span>
                            <span className="text-sm font-black text-emerald-600">+{getItemBonusCoins(selectedDetail).toLocaleString()} Xu</span>
                          </div>
                          <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-100">
                            <span className="text-xs font-bold text-indigo-600">Tổng cộng nhận</span>
                            <span className="text-sm font-black text-indigo-600">
                              {getItemTotalCoins(selectedDetail).toLocaleString()} Xu
                            </span>
                          </div>
                        </>
                      )}
                      <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Giá thanh toán</span>
                        <span className="text-xl font-black text-indigo-600">{formatVND(selectedDetail.price)}</span>
                      </div>
                    </div>

                    {selectedDetail.items && selectedDetail.items.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Vật phẩm đi kèm</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedDetail.items.map((item, idx) => (
                            <div key={`${item}-${idx}`} className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1.5 rounded-lg border border-slate-200">
                              • {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Quyền lợi đặc biệt</h4>
                      <div className="space-y-2">
                        {(selectedDetail.rights && selectedDetail.rights.length > 0) ? selectedDetail.rights.map((right, idx) => (
                          <div key={`${right}-${idx}`} className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                            <ShieldCheck size={14} className="text-emerald-500" />
                            <span>{right}</span>
                          </div>
                        )) : (
                          <p className="text-xs text-slate-400 font-medium italic">Không có quyền lợi cộng thêm.</p>
                        )}
                      </div>
                    </div>

                    {user.role === 'admin' && selectedDetail.type !== 'Coins' && (
                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Lệnh sẽ thực thi (RCON)</h4>
                        <div className="space-y-1.5">
                          {selectedDetail.commands?.map((cmd, idx) => (
                            <div key={`${cmd}-${idx}`} className="font-mono text-[10px] p-2 bg-slate-900 text-slate-300 rounded border border-slate-800 break-all">
                              {cmd}
                            </div>
                          )) || <span className="text-xs text-slate-400">Không có lệnh đi kèm.</span>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4 shrink-0">
                <button 
                  onClick={closeDetailModal}
                  className="flex-1 py-3.5 bg-white text-slate-500 font-black text-xs uppercase tracking-widest rounded-2xl border border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  Đóng
                </button>
                <button 
                  onClick={() => {
                    setSelectedPackage(selectedDetail);
                    setPlayerConfirmed(false);
                    setVerifyError('');
                    setDetailModalStep('player-check');
                  }}
                  className="flex-[2] py-3.5 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-indigo-200 hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
                >
                  <PlusCircle size={16} />
                  Thanh toán ngay
                </button>
              </div>
              </>
              ) : (
              <>
                <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-grow">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Giá thanh toán</span>
                      <span className="text-lg font-black text-slate-900 font-mono">{formatVND(selectedDetail.price)}</span>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                      <span className="text-[10px] text-indigo-400 font-bold uppercase block mb-1">Xu nhận được</span>
                      <div className="flex items-center gap-1.5">
                        <Coins className="w-4 h-4 text-indigo-600" />
                        <span className="text-lg font-black text-indigo-600 font-mono">
                          {getItemTotalCoins(selectedDetail).toLocaleString()} Xu
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600" />
                      Player Minecraft
                    </label>
                    <div className={`flex items-center gap-3 rounded-xl py-3 px-4 shadow-sm border ${
                      playerConfirmed
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-slate-50 border-indigo-100'
                    }`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        playerConfirmed ? 'bg-emerald-100' : 'bg-indigo-100'
                      }`}>
                        {playerConfirmed
                          ? <CheckCircle className="w-4 h-4 text-emerald-600" />
                          : <Users className="w-4 h-4 text-indigo-600" />
                        }
                      </div>
                      <span className="text-sm font-black text-slate-900 flex-1">{linkedMcName}</span>
                      {playerConfirmed && (
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Đã xác nhận</span>
                      )}
                    </div>

                    {!playerConfirmed && (
                      <button
                        type="button"
                        onClick={handleVerifyPlayer}
                        disabled={isVerifyingPlayer || !linkedMcName}
                        className="w-full py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-black uppercase tracking-wider hover:bg-indigo-100 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                      >
                        {isVerifyingPlayer ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                        {isVerifyingPlayer ? 'Đang kiểm tra...' : 'Kiểm tra player'}
                      </button>
                    )}

                    {verifyError && (
                      <p className="text-[10px] text-rose-500 font-medium">{verifyError}</p>
                    )}
                  </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4 shrink-0">
                  <button
                    onClick={() => {
                      setDetailModalStep('detail');
                      setPlayerConfirmed(false);
                      setVerifyError('');
                    }}
                    className="flex-1 py-3.5 bg-white text-slate-500 font-black text-xs uppercase tracking-widest rounded-2xl border border-slate-200 hover:bg-slate-100 transition-colors"
                  >
                    Quay lại
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPackage(selectedDetail);
                      handleConfirmPurchase(selectedDetail);
                    }}
                    disabled={isPurchasing || !linkedMcName || !playerConfirmed}
                    className={`flex-[2] py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                      !isPurchasing && linkedMcName && playerConfirmed
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-slate-900'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isPurchasing ? 'Đang xử lý...' : 'Tiếp tục thanh toán'}
                  </button>
                </div>
              </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. MODAL PURCHASE PACKAGE & PLAYER VALIDATION */}
      <AnimatePresence>
        {showPurchaseModal && selectedPackage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 text-slate-800"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-0 w-full max-w-lg shadow-2xl border border-white/20 overflow-hidden"
            >
              {/* Header with Image/Icon */}
              <div className="relative h-40 bg-indigo-600 flex items-center justify-center">
                <PromotionBadge
                  badge={getPromotionBadge(selectedPackage)}
                  style={{ left: 14, right: 'auto' }}
                />
                <div className="absolute inset-0 opacity-20">
                  <div className="w-full h-full bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
                </div>
                <div className="z-10 text-white flex flex-col items-center">
                  <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-2 shadow-lg">
                     {selectedPackage.icon === 'workspace_premium' && <Award className="w-10 h-10" />}
                     {selectedPackage.icon === 'stars' && <Flame className="w-10 h-10" />}
                     {selectedPackage.icon === 'payments' && <Coins className="w-10 h-10" />}
                     {/* Fallback */}
                     {!['workspace_premium', 'stars', 'payments'].includes(selectedPackage.icon) && <Gem className="w-10 h-10" />}
                  </div>
                  <h3 className="font-display font-black text-xl uppercase tracking-widest">{selectedPackage.name}</h3>
                </div>
                <button 
                  onClick={resetPurchaseModal}
                  className="absolute right-4 top-4 p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer border border-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                {/* Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Giá thanh toán</span>
                    <span className="text-lg font-black text-slate-900 font-mono">{formatVND(selectedPackage.price)}</span>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                    <span className="text-[10px] text-indigo-400 font-bold uppercase block mb-1">Xu nhận được</span>
                    <div className="flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-indigo-600" />
                      <span className="text-lg font-black text-indigo-600 font-mono">
                        {getItemTotalCoins(selectedPackage).toLocaleString()} Xu
                      </span>
                    </div>
                  </div>
                </div>

                {selectedPackage.description && (
                   <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                     <span className="text-[10px] text-slate-400 font-bold uppercase block mb-2">Mô tả & Hướng dẫn</span>
                     <p className="text-xs text-slate-600 leading-relaxed italic">
                        {selectedPackage.description}
                     </p>
                   </div>
                )}

                {/* Delivery destination */}
                <div className="space-y-3">
                   <label className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-2">
                     <Users className="w-4 h-4 text-indigo-600" />
                     Deliver To
                   </label>
                   <div className={`flex items-center gap-3 rounded-xl py-3 px-4 shadow-sm border ${
                     playerConfirmed
                       ? 'bg-emerald-50 border-emerald-200'
                       : 'bg-slate-50 border-indigo-100'
                   }`}>
                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                       playerConfirmed ? 'bg-emerald-100' : 'bg-indigo-100'
                     }`}>
                       {playerConfirmed
                         ? <CheckCircle className="w-4 h-4 text-emerald-600" />
                         : <Users className="w-4 h-4 text-indigo-600" />
                       }
                     </div>
                     <span className="text-sm font-black text-slate-900 flex-1">{linkedMcName}</span>
                     {playerConfirmed && (
                       <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Đã xác nhận</span>
                     )}
                   </div>
                   <p className="text-[10px] text-slate-400 italic">
                     Vật phẩm sẽ được gửi đến tài khoản Minecraft đã xác minh của bạn.
                   </p>

                   {!playerConfirmed && (
                     <button
                       type="button"
                       onClick={handleVerifyPlayer}
                       disabled={isVerifyingPlayer || !linkedMcName}
                       className="w-full py-3.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold uppercase tracking-wider transition-all cursor-pointer text-xs border border-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                       {isVerifyingPlayer
                         ? <><RefreshCw className="w-4 h-4 animate-spin" /> Đang kiểm tra...</>
                         : <><ShieldCheck className="w-4 h-4" /> Xác nhận nhân vật</>
                       }
                     </button>
                   )}

                   {verifyError && (
                     <p className="text-[10px] text-rose-500 font-medium">{verifyError}</p>
                   )}
                </div>

                {/* Actions */}
                <div className="pt-2 flex flex-col gap-3">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={resetPurchaseModal}
                      className="flex-1 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase transition-colors cursor-pointer text-xs"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmPurchase()}
                      disabled={isPurchasing || !linkedMcName || !playerConfirmed}
                      className={`flex-1 py-4 rounded-2xl font-display font-bold uppercase tracking-widest transition-all cursor-pointer text-xs shadow-lg ${
                        !isPurchasing && linkedMcName && playerConfirmed
                        ? 'bg-indigo-600 text-white hover:bg-slate-900 shadow-indigo-200' 
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                      }`}
                    >
                      {isPurchasing ? 'Đang xử lý...' : 'Thanh toán ngay'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

function ChangePasswordForm({ triggerNotification }: { triggerNotification: (msg: string) => void }) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const validate = (name: string, value: string) => {
    let error = '';
    if (!value) {
      error = 'Trường này là bắt buộc';
    } else if (name === 'newPassword') {
      if (value.length < 8) error = 'Mật khẩu phải có ít nhất 8 ký tự';
      else if (!/\d/.test(value)) error = 'Mật khẩu phải chứa ít nhất một chữ số';
    } else if (name === 'confirmPassword') {
      if (value !== formData.newPassword) error = 'Mật khẩu xác nhận không khớp';
    }
    return error;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    const error = validate(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
    
    // Also re-validate confirm if new password changes
    if (name === 'newPassword' && formData.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: value === formData.confirmPassword ? '' : 'Mật khẩu xác nhận không khớp' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation
    const e1 = validate('currentPassword', formData.currentPassword);
    const e2 = validate('newPassword', formData.newPassword);
    const e3 = validate('confirmPassword', formData.confirmPassword);
    
    if (e1 || e2 || e3) {
      setErrors({ currentPassword: e1, newPassword: e2, confirmPassword: e3 });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.put('/users/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      
      if (response.data.success) {
        triggerNotification('Đổi mật khẩu thành công!');
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        triggerNotification(response.data.message || 'Có lỗi xảy ra');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Mật khẩu hiện tại không chính xác';
      setErrors(prev => ({ ...prev, currentPassword: msg }));
      triggerNotification(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = !errors.currentPassword && !errors.newPassword && !errors.confirmPassword && 
                     formData.currentPassword && formData.newPassword && formData.confirmPassword;

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-xs">
      <div className="space-y-1.5 relative">
        <label className="font-bold text-slate-700 uppercase tracking-wide">Mật khẩu hiện tại</label>
        <div className="relative">
          <input 
            type={showCurrent ? "text" : "password"}
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            placeholder="••••••••"
            className={`w-full bg-slate-50 border ${errors.currentPassword ? 'border-red-300' : 'border-slate-200'} rounded-lg py-3 px-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all pr-10`}
          />
          <button 
            type="button" 
            onClick={() => setShowCurrent(!showCurrent)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.currentPassword && <p className="text-[10px] text-red-500 font-bold flex items-center gap-1"><TriangleAlert size={10} /> {errors.currentPassword}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="font-bold text-slate-700 uppercase tracking-wide">Mật khẩu mới</label>
          <div className="relative">
            <input 
              type={showNew ? "text" : "password"}
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className={`w-full bg-slate-50 border ${errors.newPassword ? 'border-red-300' : 'border-slate-200'} rounded-lg py-3 px-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all pr-10`}
            />
            <button 
              type="button" 
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="space-y-1 mt-2">
             <div className={`flex items-center gap-1 text-[10px] font-bold ${formData.newPassword.length >= 8 ? 'text-emerald-500' : 'text-slate-400'}`}>
               <Check size={10} /> Ít nhất 8 ký tự
             </div>
             <div className={`flex items-center gap-1 text-[10px] font-bold ${/\d/.test(formData.newPassword) ? 'text-emerald-500' : 'text-slate-400'}`}>
               <Check size={10} /> Chứa ít nhất 1 chữ số
             </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="font-bold text-slate-700 uppercase tracking-wide">Xác nhận mật khẩu</label>
          <div className="relative">
            <input 
              type={showConfirm ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className={`w-full bg-slate-50 border ${errors.confirmPassword ? 'border-red-300' : 'border-slate-200'} rounded-lg py-3 px-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all pr-10`}
            />
            <button 
              type="button" 
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-[10px] text-red-500 font-bold flex items-center gap-1"><TriangleAlert size={10} /> {errors.confirmPassword}</p>}
        </div>
      </div>

      <div className="pt-2">
        <button 
          type="submit"
          disabled={isLoading || !isFormValid}
          className="py-3 px-8 bg-slate-900 text-white font-black rounded-xl uppercase tracking-widest hover:bg-indigo-600 shadow-lg shadow-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Đang xử lý...
            </>
          ) : (
            'Cập nhật mật khẩu'
          )}
        </button>
      </div>
    </form>
  );
}
