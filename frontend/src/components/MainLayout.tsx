import { useState, useEffect } from 'react';
import { 
  Home, 
  ShoppingCart, 
  History as HistoryIcon, 
  Settings as SettingsIcon, 
  LogOut, 
  Coins, 
  Swords,
  ShieldCheck
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../lib/api';

interface MainLayoutProps {
  children: React.ReactNode;
  user: any;
  onLogout: () => void;
}

export default function MainLayout({ children, user, onLogout }: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [balance, setBalance] = useState(user.balance || 0);

  // Fetch updated balance
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await api.get('/auth/me');
        setBalance(response.data.balance);
      } catch (error) {
        console.error('Failed to fetch balance');
      }
    };
    fetchBalance();
  }, [location.pathname]);

  const navItems = [
    { label: 'Trang chủ', path: '/', icon: <Home className="w-5 h-5" /> },
    { label: 'Cửa hàng', path: '/', state: { tab: 'Cửa hàng' }, icon: <ShoppingCart className="w-5 h-5" /> },
    { label: 'Lịch sử', path: '/payment/history', icon: <HistoryIcon className="w-5 h-5" /> },
    { label: 'Cài đặt', path: '/', state: { tab: 'Cài đặt' }, icon: <SettingsIcon className="w-5 h-5" /> },
  ];

  const isActive = (path: string, tab?: string) => {
    if (tab) return location.pathname === '/' && (location.state as any)?.tab === tab;
    return location.pathname === path;
  };

  const handleNavClick = (item: any) => {
    if (item.path === '/' && item.state) {
        // This is a bit tricky since Dashboard handles tabs internally.
        // For simplicity, we navigate to / with state.
        navigate('/', { state: item.state });
    } else {
        navigate(item.path);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans">
      {/* SIDEBAR - DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0f172a] text-white fixed top-0 left-0 h-full z-50">
        <div className="px-8 py-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/40">
            <Swords className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-black text-lg tracking-tighter leading-none">EMERALD</h1>
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest leading-none">Realms Portal</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavClick(item)}
              className={`flex items-center gap-4 py-3 px-4 rounded-xl w-full transition-all duration-200 cursor-pointer ${
                isActive(item.path, item.state?.tab)
                  ? 'bg-indigo-600 font-semibold text-white shadow-lg shadow-indigo-900/30'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-indigo-400 text-left font-medium'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
          
          {user.role === 'admin' && (
            <button
              onClick={() => navigate('/admin')}
              className={`flex items-center gap-4 py-3 px-4 rounded-xl w-full transition-all duration-200 cursor-pointer ${
                location.pathname === '/admin'
                  ? 'bg-indigo-600 font-semibold text-white shadow-lg'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-indigo-400 text-left font-medium'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
              <span>Quản trị</span>
            </button>
          )}
        </nav>

        <div className="px-4 py-6 mt-auto space-y-2">
            <button 
                onClick={() => navigate('/')}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-900/20 text-center cursor-pointer transition-all"
            >
                Nạp Xu Ngay
            </button>
            <button 
                onClick={onLogout}
                className="flex items-center gap-4 py-3 px-4 rounded-xl text-slate-400 hover:bg-red-950/40 hover:text-red-400 w-full text-left font-medium transition-colors cursor-pointer"
            >
                <LogOut className="w-5 h-5" />
                <span>Đăng xuất</span>
            </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="md:hidden bg-[#0f172a] text-white border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
           <Swords className="w-6 h-6 text-indigo-500" />
           <span className="font-black text-indigo-400 tracking-wider">EMERALD REALM</span>
        </div>
        <button onClick={onLogout} className="text-red-400">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* MOBILE NAV BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0f172a] border-t border-slate-800 z-50 flex justify-around py-3">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => handleNavClick(item)}
            className={`flex flex-col items-center gap-1 ${isActive(item.path, item.state?.tab) ? 'text-indigo-400' : 'text-slate-400'}`}
          >
            {item.icon}
            <span className="text-[10px] font-semibold">{item.label}</span>
          </button>
        ))}
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen relative">
        <header className="bg-white border-b border-slate-200 flex justify-between items-center px-8 h-20 sticky top-0 z-40">
           <div>
              <h2 className="font-extrabold text-xl text-slate-900 tracking-tight">MineShop</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider hidden sm:block">
                Xin chào, <span className="text-indigo-600">{user.username}</span>
              </p>
           </div>

           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full border border-slate-200">
                <Coins className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-700">
                  <span className="text-indigo-600 text-sm font-mono">{balance.toLocaleString('vi-VN')}</span> Xu
                </span>
              </div>

              <div className="w-10 h-10 rounded-full border border-slate-200 overflow-hidden cursor-pointer shadow-sm">
                <img 
                  alt="Avatar" 
                  className="w-full h-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXfIooe1QQ4Jl9I4ZVV52LPvlOoe-iyRipUOFrqoJs2xjt9cMh5FrSj63cZHqhQrTSrRbHT6YPdt47tO5gsGLUvPTrDykqBJHZQfT8hj-vc5wVVe0zjfYTNHO3yNjVk6KC1qa4FevwkIBlmbGLS1aj0jxaBHhWWv9eVqhqo3lWHErpdK9VG1J84i94d9A7OrFhamq8Kqy3nNWmtxkPMQlLP47rnfn5R036CGHiCUCSbd2onl8AXtNgr0IFDom2X9tArogFUMXF3Hw"
                />
              </div>
           </div>
        </header>

        <main className="p-4 md:p-8 flex-grow flex flex-col pb-24 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
