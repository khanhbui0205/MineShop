import { useState, type FormEvent, type ReactNode } from 'react';
import { AlertTriangle, Bell, CreditCard, Info, Megaphone, Send, User, Users } from 'lucide-react';

import notificationService from '../services/notificationService';
import type { AuditLog, NotificationTargetType, NotificationType } from '../types';

interface NotificationAdminProps {
  showToast: (message: string, type?: 'success' | 'error') => void;
  addAuditLog: (message: string, detail: string, borderType: AuditLog['borderType']) => void;
}

const notificationTypes: { value: NotificationType; label: string; icon: ReactNode }[] = [
  { value: 'system', label: 'He thong', icon: <Info size={16} /> },
  { value: 'promotion', label: 'Khuyen mai', icon: <Megaphone size={16} /> },
  { value: 'payment', label: 'Thanh toan', icon: <CreditCard size={16} /> },
  { value: 'warning', label: 'Canh bao', icon: <AlertTriangle size={16} /> },
];

const getErrorMessage = (error: unknown, fallback: string) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: { data?: { message?: unknown } } }).response?.data?.message === 'string'
  ) {
    return (error as { response: { data: { message: string } } }).response.data.message;
  }

  return fallback;
};

export default function NotificationAdmin({ showToast, addAuditLog }: NotificationAdminProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<NotificationType>('system');
  const [targetType, setTargetType] = useState<NotificationTargetType>('all');
  const [targetPlayerName, setTargetPlayerName] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !message.trim()) {
      showToast('Vui long nhap day du tieu de va noi dung', 'error');
      return;
    }
    if (targetType === 'player' && !targetPlayerName.trim()) {
      showToast('Vui long nhap playerName', 'error');
      return;
    }

    try {
      setIsSending(true);
      const result = await notificationService.create({
        title: title.trim(),
        message: message.trim(),
        type,
        targetType,
        targetPlayerName: targetType === 'player' ? targetPlayerName.trim() : '',
      });

      showToast(`Da gui thong bao toi ${result.recipientCount} user`);
      addAuditLog(
        `Gui thong bao: ${title.trim()}`,
        targetType === 'all' ? 'Gui toi tat ca user' : `Gui toi player ${targetPlayerName.trim()}`,
        'primary'
      );
      setTitle('');
      setMessage('');
      setTargetPlayerName('');
      setType('system');
      setTargetType('all');
    } catch (error: unknown) {
      showToast(getErrorMessage(error, 'Gui thong bao that bai'), 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-white">Gui thong bao</h3>
          <p className="text-sm text-slate-400 mt-1">Tao thong bao cho toan bo user hoac mot player cu the.</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center">
          <Bell size={22} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <label className="space-y-2">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Tieu de</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={160}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Vi du: Bao tri may chu"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Loai thong bao</span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as NotificationType)}
              className="admin-select w-full border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {notificationTypes.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Gui den</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTargetType('all')}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                targetType === 'all'
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-slate-900 border-white/10 text-slate-300 hover:border-white/20'
              }`}
            >
              <Users size={18} />
              <span className="text-sm font-bold">Tat ca user</span>
            </button>
            <button
              type="button"
              onClick={() => setTargetType('player')}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                targetType === 'player'
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-slate-900 border-white/10 text-slate-300 hover:border-white/20'
              }`}
            >
              <User size={18} />
              <span className="text-sm font-bold">Player cu the</span>
            </button>
          </div>
        </div>

        {targetType === 'player' && (
          <label className="space-y-2 block">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">PlayerName</span>
            <input
              value={targetPlayerName}
              onChange={(event) => setTargetPlayerName(event.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Nhap Minecraft username"
            />
          </label>
        )}

        <label className="space-y-2 block">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Noi dung</span>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={4000}
            rows={7}
            className="w-full resize-none bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
            placeholder="Nhap noi dung thong bao..."
          />
        </label>

        <div className="flex items-center justify-between gap-4 pt-2">
          <div className="flex flex-wrap gap-2">
            {notificationTypes.map((item) => (
              <span
                key={item.value}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold ${
                  type === item.value
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-900 text-slate-400 border-white/10'
                }`}
              >
                {item.icon}
                {item.label}
              </span>
            ))}
          </div>
          <button
            type="submit"
            disabled={isSending}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
            {isSending ? 'Dang gui...' : 'Gui thong bao'}
          </button>
        </div>
      </form>
    </div>
  );
}
