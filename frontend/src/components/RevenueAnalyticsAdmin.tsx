import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  DollarSign,
  Package,
  Users,
  ChevronRight,
  ChevronLeft,
  BarChart3,
  FileSpreadsheet,
  Crown,
  Search,
  ShoppingCart,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  History as HistoryIcon
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import api from '../lib/api';
import { formatVND } from '../lib/utils';
import * as XLSX from 'xlsx';

interface RevenueStats {
  revenue: {
    total: number;
    today: number;
    week: number;
    month: number;
    year: number;
    averageOrderValue: number;
    uniqueCustomers: number;
  };
  orders: {
    total: number;
    successful: number;
    pending: number;
    cancelled: number;
    failed: number;
  };
  charts: {
    sevenDays: { _id: string; revenue: number; count: number }[];
    thirtyDays: { _id: string; revenue: number; count: number }[];
    twelveMonths: { _id: string; revenue: number; count: number }[];
  };
  topPackages: {
    _id: string;
    packageName: string;
    soldCount: number;
    revenue: number;
  }[];
  topBuyers: {
    _id: string;
    minecraftUsername: string;
    username: string;
    orderCount: number;
    totalSpent: number;
  }[];
}


export default function RevenueAnalyticsAdmin() {
  const [data, setData] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartRange, setChartRange] = useState<'7d' | '30d' | '12m'>('7d');
  
  // Transactions Table State
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTx, setTotalTx] = useState(0);

  useEffect(() => {
    fetchRevenueData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, page]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/stats/revenue');
      setData(res.data);
    } catch (err) {
      console.error('Error fetching revenue data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setTxLoading(true);
      const res = await api.get('/admin/stats/transactions', {
        params: {
          search: searchTerm,
          status: statusFilter,
          page,
          limit: 10
        }
      });
      setTransactions(res.data.transactions);
      setTotalPages(res.data.totalPages);
      setTotalTx(res.data.total);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setTxLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!data) return;

    const workbook = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['Thống kê doanh thu', ''],
      ['Tổng doanh thu', data.revenue.total],
      ['Hôm nay', data.revenue.today],
      ['Tuần này', data.revenue.week],
      ['Tháng này', data.revenue.month],
      ['Năm nay', data.revenue.year],
      ['Giá trị đơn hàng trung bình', data.revenue.averageOrderValue],
      ['Khách hàng unique', data.revenue.uniqueCustomers],
      ['', ''],
      ['Thống kê Đơn hàng', ''],
      ['Tổng đơn hàng', data.orders.total],
      ['Thành công', data.orders.successful],
      ['Đang chờ', data.orders.pending],
      ['Bị hủy', data.orders.cancelled],
      ['Thất bại', data.orders.failed],
      ['Tỷ lệ thành công', `${((data.orders.successful / (data.orders.total || 1)) * 100).toFixed(1)}%`]
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Tổng quan');

    // Top Packages Sheet
    const packageData = data.topPackages.map(pkg => ({
      'Tên gói': pkg.packageName,
      'Số lượng bán': pkg.soldCount,
      'Doanh thu': pkg.revenue
    }));
    const packageSheet = XLSX.utils.json_to_sheet(packageData);
    XLSX.utils.book_append_sheet(workbook, packageSheet, 'Top Gói Nạp');

    // Top Buyers Sheet
    const buyerData = data.topBuyers.map(buyer => ({
      'Minecraft Username': buyer.minecraftUsername,
      'Portal Username': buyer.username,
      'Số đơn hàng': buyer.orderCount,
      'Tổng chi tiêu': buyer.totalSpent
    }));
    const buyerSheet = XLSX.utils.json_to_sheet(buyerData);
    XLSX.utils.book_append_sheet(workbook, buyerSheet, 'Top Người Mua');

    XLSX.writeFile(workbook, `Bao_cao_doanh_thu_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm animate-pulse">Đang phân tích dữ liệu...</p>
      </div>
    );
  }

  const chartData = 
    chartRange === '7d' ? data.charts.sevenDays :
    chartRange === '30d' ? data.charts.thirtyDays :
    data.charts.twelveMonths;

  const orderPieData = [
    { name: 'Thành công', value: data.orders.successful, color: '#10b981' },
    { name: 'Đang chờ', value: data.orders.pending, color: '#f59e0b' },
    { name: 'Đã hủy', value: data.orders.cancelled, color: '#94a3b8' },
    { name: 'Thất bại', value: data.orders.failed, color: '#ef4444' }
  ].filter(d => d.value > 0);

  const successRate = (data.orders.successful / (data.orders.total || 1)) * 100;

  return (
    <div className="space-y-8 pb-12">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <BarChart3 className="text-indigo-400" />
            Phân Tích Doanh Thu
          </h2>
          <p className="text-slate-400 text-sm mt-1">Dữ liệu tổng hợp từ hệ thống giao dịch của MineShop</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-900/20 cursor-pointer"
          >
            <FileSpreadsheet size={16} />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng doanh thu', value: data.revenue.total, icon: <DollarSign />, color: 'from-emerald-500 to-teal-600', sub: 'Tất cả đơn thành công' },
          { label: 'Gói nạp bán chạy', value: data.topPackages[0]?.packageName || 'N/A', icon: <Package />, color: 'from-blue-500 to-indigo-600', sub: `${data.topPackages[0]?.soldCount || 0} lượt bán`, isCurrency: false },
          { label: 'Đơn hàng thành công', value: data.orders.successful, icon: <ShoppingCart />, color: 'from-violet-500 to-purple-600', sub: `Tỷ lệ: ${successRate.toFixed(1)}%`, isCurrency: false },
          { label: 'Khách hàng', value: data.revenue.uniqueCustomers, icon: <Users />, color: 'from-amber-500 to-orange-600', sub: `Avg Order: ${formatVND(data.revenue.averageOrderValue)}`, isCurrency: false },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#141821] border border-white/10 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm group"
          >
            <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color} w-fit text-white mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-xl font-black text-white mt-1">
              {stat.isCurrency === false ? stat.value : formatVND(stat.value as number)}
            </h3>
            <p className="mt-2 text-[10px] text-slate-500 font-bold">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Area Chart */}
        <div className="lg:col-span-2 bg-[#141821] border border-white/5 rounded-3xl p-6 shadow-xl overflow-hidden">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="font-bold text-lg text-white">Biển động doanh thu</h3>
              <p className="text-xs text-slate-500">Thống kê các đơn hàng completed</p>
            </div>
            <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/5">
              {(['7d', '30d', '12m'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setChartRange(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    chartRange === r ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  {r === '7d' ? '7 Ngày' : r === '30d' ? '30 Ngày' : '12 Tháng'}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis 
                  dataKey="_id" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                  tickFormatter={(val) => `${val / 1000}k`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a2030', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Pie Chart */}
        <div className="bg-[#141821] border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col">
          <h3 className="font-bold text-lg text-white mb-1">Cơ cấu đơn hàng</h3>
          <p className="text-xs text-slate-500 mb-6">Trạng thái giao dịch hệ thống</p>
          
          <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={1000}
                >
                  {orderPieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a2030', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-white">{data.orders.total}</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tổng Đơn</span>
            </div>
          </div>

          <div className="mt-8 space-y-3">
             <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold">Thành công</span>
                <span className="text-emerald-400 font-black">{data.orders.successful}</span>
             </div>
             <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold">Đang chờ</span>
                <span className="text-amber-400 font-black">{data.orders.pending}</span>
             </div>
             <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold">Hủy/Lỗi</span>
                <span className="text-red-400 font-black">{data.orders.cancelled + data.orders.failed}</span>
             </div>
             <div className="mt-4 p-3 bg-white/3 rounded-xl border border-white/5">
                <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase mb-2">
                   <span>Tỷ lệ hoàn tất</span>
                   <span>{successRate.toFixed(1)}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                   <div 
                    className="h-full bg-emerald-500" 
                    style={{ width: `${successRate}%` }} 
                   />
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Transactions Table Section */}
      <div className="bg-[#141821] border border-white/5 rounded-3xl p-8 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h3 className="font-bold text-xl text-white flex items-center gap-3">
              <HistoryIcon className="text-indigo-400" />
              Lịch Sử Giao Dịch
            </h3>
            <p className="text-xs text-slate-500 mt-1">Danh sách tất cả các đơn hàng trên toàn hệ thống</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Tìm mã đơn, nhân vật..." 
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              />
            </div>
            <select 
              className="bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-xs text-white focus:outline-none cursor-pointer"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="" className="bg-[#1a2030]">Tất cả trạng thái</option>
              <option value="completed" className="bg-[#1a2030]">Thành công</option>
              <option value="pending" className="bg-[#1a2030]">Đang chờ</option>
              <option value="cancelled" className="bg-[#1a2030]">Đã hủy</option>
              <option value="failed" className="bg-[#1a2030]">Thất bại</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">
                <th className="pb-4 px-4">Mã đơn</th>
                <th className="pb-4 px-4">Khách hàng</th>
                <th className="pb-4 px-4">Vật phẩm</th>
                <th className="pb-4 px-4 text-right">Số tiền</th>
                <th className="pb-4 px-4 text-center">Ngày duyệt</th>
                <th className="pb-4 px-4 text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {txLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse">
                    <td colSpan={6} className="py-4 h-12 bg-white/2 rounded-lg" />
                  </tr>
                ))
              ) : transactions.length > 0 ? (
                transactions.map((tx) => (
                  <tr key={tx._id} className="group hover:bg-white/3 transition-colors">
                    <td className="py-4 px-4">
                      <span className="font-mono text-xs font-bold text-slate-500">#{tx.orderCode || tx._id.substring(0,8)}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 p-1">
                          <img src={`https://minotar.net/avatar/${tx.minecraftUsername}/32`} alt="" className="w-full h-full rounded" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white uppercase">{tx.minecraftUsername}</p>
                          <p className="text-[10px] text-slate-500">@{tx.user?.username || 'Guest'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-xs font-bold text-slate-300">{tx.item}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm font-black text-white font-mono">{formatVND(tx.amount || 0)}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-xs text-slate-500 font-medium">
                        {new Date(tx.createdAt).toLocaleDateString('vi-VN', { 
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${
                        tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                        tx.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                        tx.status === 'cancelled' ? 'bg-slate-500/10 text-slate-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {tx.status === 'completed' ? <CheckCircle2 size={10} /> :
                         tx.status === 'pending' ? <Clock size={10} /> :
                         tx.status === 'cancelled' ? <XCircle size={10} /> : <AlertCircle size={10} />}
                        {tx.status === 'completed' ? 'Hoàn tất' : 
                         tx.status === 'pending' ? 'Chờ duyệt' : 
                         tx.status === 'cancelled' ? 'Đã hủy' : 'Thất bại'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-sm font-medium">
                    Không tìm thấy giao dịch nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-between items-center">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
              Hiển thị {transactions.length} / {totalTx} đơn hàng
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const p = i + 1;
                  if (totalPages > 5 && Math.abs(p - page) > 1 && p !== 1 && p !== totalPages) {
                    if (p === 2 || p === totalPages - 1) return <span key={p} className="text-slate-600 px-1">...</span>;
                    return null;
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${
                        page === p ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-500 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Top Packages */}
         <div className="bg-[#141821] border border-white/5 rounded-3xl p-8 shadow-xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-bold text-lg text-white flex items-center gap-3">
                <Crown className="text-amber-400" />
                Vinh Danh Gói Nạp
              </h3>
            </div>
            <div className="space-y-4">
               {data.topPackages.map((pkg, idx) => (
                 <div key={pkg._id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/3 border border-white/5 hover:border-white/10 transition-all group">
                    <div className="text-lg font-black text-slate-700 w-6">#{idx + 1}</div>
                    <div className="flex-grow">
                       <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors uppercase">{pkg.packageName}</h4>
                       <p className="text-[10px] text-slate-500 font-bold mt-1">Đã bán {pkg.soldCount} lượt • {formatVND(pkg.revenue)}</p>
                    </div>
                    <div className="w-1.5 h-12 bg-white/5 rounded-full overflow-hidden">
                       <div className="w-full bg-indigo-500/50" style={{ height: `${(pkg.soldCount / data.topPackages[0].soldCount) * 100}%` }} />
                    </div>
                 </div>
               ))}
            </div>
         </div>

         {/* Top Buyers */}
         <div className="bg-[#141821] border border-white/5 rounded-3xl p-8 shadow-xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-bold text-lg text-white flex items-center gap-3">
                <Users className="text-sky-400" />
                Đại Gia Server
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
               {data.topBuyers.map((buyer) => (
                 <div key={buyer._id} className="p-4 rounded-2xl bg-white/3 border border-white/5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 p-1 shrink-0 overflow-hidden">
                       <img 
                        src={`https://minotar.net/avatar/${buyer.minecraftUsername}/64`} 
                        alt="" 
                        className="w-full h-full rounded"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://minotar.net/avatar/Steve/64'; }}
                       />
                    </div>
                    <div className="min-w-0">
                       <h4 className="text-xs font-black text-white truncate uppercase">{buyer.minecraftUsername}</h4>
                       <p className="text-[10px] text-emerald-500 font-bold font-mono truncate">{formatVND(buyer.totalSpent)}</p>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}
