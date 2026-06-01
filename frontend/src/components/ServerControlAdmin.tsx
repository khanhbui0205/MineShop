import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, 
  Send, 
  Activity, 
  Clock, 
  History as HistoryIcon,
  Server,
  Globe,
  Settings,
  XCircle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import api from '../lib/api';
import type { ServerCommand } from '../types';

export default function ServerControlAdmin() {
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ServerCommand[]>([]);
  const [status, setStatus] = useState<{ online: boolean; host?: string; port?: number; error?: string }>({ online: false });
  const [statusLoading, setStatusLoading] = useState(true);
  const [lastResponse, setLastResponse] = useState<{ command: string; response: string; success: boolean; timestamp: string } | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await api.get('/admin/server-control/history');
      setHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch command history');
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      setStatusLoading(true);
      const response = await api.get('/admin/server-control/status');
      setStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch server status');
      setStatus({ online: false, error: 'Không thể kết nối API' });
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
    fetchStatus();
    
    // Auto refresh status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchHistory, fetchStatus]);

  const handleSendCommand = async () => {
    if (!command.trim() || loading) return;

    try {
      setLoading(true);
      const res = await api.post('/admin/server-control/execute', { command: command.trim() });
      
      setLastResponse({
        command: command.trim(),
        response: res.data.response,
        success: res.data.success,
        timestamp: new Date().toLocaleTimeString('vi-VN')
      });

      setCommand('');
      fetchHistory();
    } catch (error: any) {
      setLastResponse({
        command: command.trim(),
        response: error.response?.data?.message || 'Lỗi hệ thống khi gửi lệnh',
        success: false,
        timestamp: new Date().toLocaleTimeString('vi-VN')
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Server Status Hero */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div 
          whileHover={{ y: -3 }}
          className="md:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between overflow-hidden relative"
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${status.online ? 'bg-emerald-600/20 text-emerald-400' : 'bg-red-600/20 text-red-400'}`}>
              <Server size={24} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">Minecraft Server</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-2 h-2 rounded-full ${status.online ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                <span className={`text-xs font-bold uppercase tracking-wider ${status.online ? 'text-emerald-400' : 'text-red-400'}`}>
                  {statusLoading ? 'Đang kiểm tra...' : status.online ? 'Trạng thái: Online' : 'Trạng thái: Offline'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="hidden sm:flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Globe size={14} />
              <span className="font-mono text-slate-300">{status.host || 'Chưa cấu hình'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Settings size={14} />
              <span className="font-mono text-slate-300">Port: {status.port || '25575'}</span>
            </div>
          </div>

          {!status.online && !statusLoading && status.error && (
            <div className="absolute bottom-2 left-6 right-6">
               <p className="text-[10px] text-red-400 font-medium truncate">Lỗi: {status.error}</p>
            </div>
          )}
        </motion.div>

        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-center"
        >
           <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-2">
             <Activity size={12} className="text-indigo-400" />
             RCON Protocol
           </p>
           <h3 className="text-xl font-extrabold text-white mt-1">Sẵn sàng</h3>
           <p className="text-xs text-slate-500 mt-2">Gửi lệnh trực tiếp tới bảng điều khiển Minecraft Server.</p>
        </motion.div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Command Console */}
        <section className="space-y-4">
          <div className="bg-[#141821] border border-white/10 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Terminal size={18} className="text-indigo-400" />
                Console Command
              </h3>
              <div className="text-[10px] bg-indigo-600/20 text-indigo-400 px-2 py-1 rounded-md font-bold uppercase">
                Admin Execution
              </div>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <textarea
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="Nhập lệnh Minecraft (ví dụ: say Hello, lp user..., eco give...)"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-emerald-400 font-mono text-sm h-32 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) handleSendCommand();
                  }}
                />
                <div className="absolute bottom-3 right-3 text-[10px] text-slate-600 font-bold uppercase">
                  Ctrl + Enter để gửi
                </div>
              </div>

              <button
                onClick={handleSendCommand}
                disabled={loading || !command.trim()}
                className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                  loading || !command.trim() 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20 cursor-pointer'
                }`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={18} />
                    <span>Gửi lệnh thực thi</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Last Response */}
          <AnimatePresence>
            {lastResponse && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`border rounded-2xl p-5 shadow-lg ${lastResponse.success ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-red-950/20 border-red-500/30'}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    {lastResponse.success ? (
                      <CheckCircle2 size={16} className="text-emerald-400" />
                    ) : (
                      <XCircle size={16} className="text-red-400" />
                    )}
                    <span className={`text-xs font-bold uppercase tracking-wider ${lastResponse.success ? 'text-emerald-400' : 'text-red-400'}`}>
                      {lastResponse.success ? 'Thành công' : 'Thất bại'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{lastResponse.timestamp}</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Lệnh đã gửi:</p>
                    <code className="text-xs bg-black/40 px-2 py-1 rounded text-slate-300 block w-full">{lastResponse.command}</code>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Kết quả từ Server:</p>
                    <pre className="text-xs bg-black/50 p-3 rounded-xl text-emerald-400 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {lastResponse.response || '(Không có phản hồi từ server)'}
                    </pre>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* History Table */}
        <section className="bg-white/5 border border-white/10 rounded-2xl flex flex-col h-full max-h-[600px]">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h4 className="font-bold text-white flex items-center gap-2">
              <HistoryIcon size={18} className="text-indigo-400" />
              Lịch sử lệnh (10 lệnh gần nhất)
            </h4>
            <button 
              onClick={fetchHistory}
              className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-all cursor-pointer"
            >
              <Clock size={14} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-500 gap-3">
                 <AlertCircle size={32} className="opacity-20" />
                 <p className="text-sm italic">Chưa có lịch sử lệnh nào được thực hiện.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {history.map((item) => (
                  <div key={item._id} className="p-4 hover:bg-white/3 transition-colors group">
                    <div className="flex justify-between items-start mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${item.success ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        <span className="text-[11px] font-mono text-indigo-400 font-bold">
                          {(item.adminId as any)?.username || 'Admin'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(item.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-white mb-2 line-clamp-1">{item.command}</p>
                    <div className="bg-black/20 rounded-lg p-2 overflow-hidden group-hover:bg-black/40 transition-colors">
                       <p className="text-[10px] text-slate-400 line-clamp-2 italic">
                         {item.response || '(Không có phản hồi)'}
                       </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="px-6 py-3 bg-white/3 border-t border-white/5 text-[10px] text-slate-500 text-center uppercase tracking-widest font-bold">
            End of History
          </div>
        </section>
      </div>
    </div>
  );
}
