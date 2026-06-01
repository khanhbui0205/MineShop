import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Lock, 
  Link as LinkIcon, 
  CheckCircle2, 
  Settings, 
  Sliders, 
  Smartphone, 
  Shield, 
  Laptop, 
  Eye, 
  EyeOff,
  UserCheck,
  X
} from 'lucide-react';
import type { ActiveSession } from '../types';

interface SettingsAdminProps {
  initialSessions: ActiveSession[];
}

export default function SettingsAdmin({ initialSessions }: SettingsAdminProps) {
  // Account Information States
  const [email, setEmail] = useState('steve.craft@realm.net');
  const [username] = useState('SteveCraft2024');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [tempEmail, setTempEmail] = useState(email);

  // Password States
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState('Trống');
  const [strengthScore, setStrengthScore] = useState(0); // 0 to 3

  // Account linkage state
  const [isLinked, setIsLinked] = useState(true);

  // Security Toggles
  const [is2FAEnabled, setIs2FAEnabled] = useState(true);
  const [isLoginAlertsEnabled, setIsLoginAlertsEnabled] = useState(false);
  const [sessions] = useState<ActiveSession[]>(initialSessions);
  const [isSessionsModalOpen, setIsSessionsModalOpen] = useState(false);

  // Preferences Toggles
  const [themeMode, setThemeMode] = useState<'Dark' | 'Light'>('Dark');
  const [language, setLanguage] = useState('Tiếng Việt');
  const [receiveNewsletters, setReceiveNewsletters] = useState(true);

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Password Strength Logic
  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (val.length === 0) {
      setStrengthScore(0);
      setPasswordFeedback('Trống');
    } else if (val.length < 6) {
      setStrengthScore(1);
      setPasswordFeedback('Yếu');
    } else if (val.length < 10) {
      setStrengthScore(2);
      setPasswordFeedback('Trung bình');
    } else {
      setStrengthScore(3);
      setPasswordFeedback('Rất Mạnh');
    }
  };

  const handleSavePassword = (e: FormEvent) => {
    e.preventDefault();
    if (!password) return;
    showToast(`Đã lưu mật khẩu bảo mật phân khúc xếp hạng "${passwordFeedback}" thành công!`);
    setPassword('');
    setStrengthScore(0);
    setPasswordFeedback('Trống');
  };

  const handleEmailSave = () => {
    if (!tempEmail.includes('@') || !tempEmail.includes('.')) {
      showToast('Lỗi: Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }
    setEmail(tempEmail);
    setIsEditingEmail(false);
    showToast(`Địa chỉ hòm thư đã được chuyển sang ${tempEmail}`);
  };

  const toggleLinkage = () => {
    setIsLinked(!isLinked);
    showToast(isLinked ? 'Đã hủy gói kết nối tài khoản Mojang.' : 'Bắt đầu kết nối đồng bộ đặc quyền của SteveCraft2024.');
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Dynamic Toast Alerts */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-4 z-[99] bg-primary text-on-primary px-6 py-4 rounded-xl font-bold flex items-center gap-3 shadow-[0_4px_12px_rgba(79,70,229,0.3)]"
          >
            <CheckCircle2 size={18} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile/Hero Banner Section */}
      <section className="relative h-64 w-full overflow-hidden rounded-2xl border border-white/10" id="profile-hero-banner">
        <img 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDWNAoM_nYwPrfzsbAv-LkxQA2q-zzJsuCIZ7jit6flEvMs_C_D8ZfKJ9feVRy39PsP_44hyqBXc98hyrC1OEve3QTS_CTyFcvk_y7f6PwWaenvOi9IK7vrcyUHPZtMUMvMz1ZP2Dj0uygDj8jLJ3GITZ4lAGkTikkaTSICMABGBSLcpte6Vb2N6VA439zfRjxHNlWXZFEQ_QkceOH6CIcjVZMFpVHRqwhz01hMXIxmczBXvaSqTKIKrivRpZsg9DvfqFYVDfBxqIw" 
          alt="Hình nền hồ sơ" 
          className="w-full h-full object-cover opacity-40 focus:outline-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
        
        {/* Absolute Avatar & Meta Section */}
        <div className="absolute -bottom-6 left-6 right-6 flex flex-col md:flex-row items-start md:items-end gap-6 pb-2">
          <div className="relative group/avatar">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl border-4 border-surface overflow-hidden bg-surface-container shadow-[0_0_30px_rgba(78,222,163,0.2)]">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJAFyaopZkRRqWqcU9ZEsWyOSeQ9s335_2S5Y-Kvd4Fm6m0LmUnHj7JCEsx0y2BN0TBVqKhmyaQmFuEGpBCkMegDbRcmGO1mooHxP90PQa8lMIUK0KzxrQIaj5G9bm29p0127MpIhYHAqQ0pRRLM2g_Msg-qrr_8rqU6AIIaQQfYYR-2uFYCyzQpEb-z2wsy8cCk_fhQXUSWK6dbH90Y1tm2vlx0TsTrTrfeDKH1cuQN1iSMPj3ByF3qKrjtSLH8DlpEJ6cLHNVVQ" 
                alt="Ảnh đại diện Steve_Admin" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          <div className="mb-2">
            <h1 className="text-3xl md:text-4xl text-on-surface tracking-tight font-bold font-headline">{username}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-on-surface-variant font-medium">
              <span className="bg-primary/20 text-primary border border-primary/30 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">
                Thứ Hạng: MVP+
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={14} className="text-primary" />
                Đã gia nhập từ Tháng 1/2024
              </span>
              <span className="flex items-center gap-1 text-primary font-bold">
                <UserCheck size={14} />
                Tài Khoản Đã Xác Minh
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid: Info Form and settings */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-12 !pt-6">
        {/* Account Details Panel (Left Pillar) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-surface-container/60 border border-white/10 rounded-2xl p-6 md:p-8 space-y-8" id="settings-form-panel">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <Settings size={22} className="text-primary" />
              <h3 className="font-headline text-xl font-bold text-on-surface animate-pulse">Thiết Lập Tài Khoản</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email Control */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">Địa Chỉ Hòm Thư (Email)</label>
                <div className="relative">
                  {isEditingEmail ? (
                    <div className="flex gap-2">
                      <input 
                        type="email"
                        value={tempEmail}
                        onChange={(e) => setTempEmail(e.target.value)}
                        className="flex-1 bg-surface-container-lowest border border-primary rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none"
                      />
                      <button 
                        onClick={handleEmailSave}
                        className="bg-primary text-on-primary font-bold px-4 rounded-xl text-xs hover:opacity-90 cursor-pointer"
                      >
                        Lưu
                      </button>
                      <button 
                        onClick={() => {
                          setIsEditingEmail(false);
                          setTempEmail(email);
                        }}
                        className="border border-white/10 px-3 rounded-xl text-xs hover:bg-white/5 text-on-surface"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <div className="w-full bg-surface-container-lowest/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface flex justify-between items-center bg-surface/40">
                      <span>{email}</span>
                      <button 
                        onClick={() => setIsEditingEmail(true)}
                        className="text-primary text-xs font-bold hover:underline cursor-pointer"
                      >
                        Sửa đổi
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Minecraft username Control */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">Tên Nhân Vật Minecraft</label>
                <div className="bg-surface-container-lowest/50 border border-white/10 px-4 py-3 rounded-xl flex justify-between items-center bg-surface/40 select-none">
                  <span className="text-sm text-on-surface opacity-80">{username}</span>
                  <Lock size={14} className="text-primary" />
                </div>
                <p className="text-[11px] text-on-surface-variant italic">Quá trình thay đổi tên nhân vật chỉ được hoàn chỉnh qua cổng thông tin Mojang trực thuộc.</p>
              </div>
            </div>

            {/* Password Updates Section */}
            <div className="pt-8 border-t border-white/5 space-y-6">
              <form onSubmit={handleSavePassword} className="max-w-md space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">Thay Đổi Mật Khẩu</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-surface-container-lowest border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Độ mạnh bảo mật mật khẩu</span>
                    <span className={`text-[11px] font-bold uppercase ${
                      strengthScore === 3 ? 'text-primary' : strengthScore === 2 ? 'text-tertiary' : 'text-error'
                    }`}>
                      {passwordFeedback}
                    </span>
                  </div>
                  
                  {/* Strength Bar */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className={`h-1.5 rounded-full transition-all ${strengthScore >= 1 ? 'bg-primary' : 'bg-white/5'}`} />
                    <div className={`h-1.5 rounded-full transition-all ${strengthScore >= 2 ? 'bg-primary' : 'bg-white/5'}`} />
                    <div className={`h-1.5 rounded-full transition-all ${strengthScore >= 3 ? 'bg-primary' : 'bg-white/5'}`} />
                    <div className="h-1.5 rounded-full bg-white/5" />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={!password}
                  className="bg-surface-container-high hover:border-primary border border-white/10 px-6 py-3 rounded-xl text-primary font-bold transition-all text-sm cursor-pointer disabled:opacity-40 disabled:hover:border-white/10 mt-2"
                >
                  Lưu mật khẩu mới
                </button>
              </form>
            </div>
          </div>

          {/* Mojang linking Card */}
          <div className="bg-surface-container/60 border border-white/10 rounded-2xl p-6 md:p-8 border-l-[6px] border-l-primary" id="mojang-linkage-panel">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/10">
                  <LinkIcon size={24} />
                </div>
                <div>
                  <h3 className="font-headline text-lg font-bold text-on-surface">Liên Kết Nhân Vật Minecraft</h3>
                  <p className="text-sm text-on-surface-variant max-w-md mt-1 font-medium">
                    Đồng hành kết nối tài khoản Mojang/Microsoft của bạn để tự động nhận các gói vật phẩm, phần thưởng và số dư danh hiệu một cách bảo an tối đa.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-start sm:items-end gap-2">
                {isLinked ? (
                  <>
                    <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary/15 rounded-full border border-primary/20 text-xs text-primary font-bold">
                      <UserCheck size={14} />
                      <span>Đã liên kết với SteveCraft2024</span>
                    </div>
                    <button 
                      onClick={toggleLinkage}
                      className="text-xs text-error font-bold hover:underline cursor-pointer"
                    >
                      Bỏ Liên Kết
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={toggleLinkage}
                      className="bg-primary text-on-primary font-bold px-4 py-2 rounded-lg text-xs hover:opacity-90 transition-all cursor-pointer shadow-lg"
                    >
                      Bắt Đầu Liên Kết Mojang
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Security & Preferences Section (Right Column) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Security Card */}
          <div className="bg-surface-container/60 border border-white/10 p-6 rounded-2xl space-y-6 shadow-xl" id="security-config-panel">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <Shield size={20} className="text-primary animate-pulse" />
              <h3 className="font-headline text-base font-bold text-on-surface">Bảo Mật Bộ Máy</h3>
            </div>

            <div className="space-y-5">
              {/* Two-Factor Auth Switch */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-on-surface font-headline">Bảo Mật 2 Lớp (2FA)</p>
                  <p className="text-xs text-on-surface-variant opacity-75 font-medium">Xác thực đăng nhập nghiêm ngặt</p>
                </div>
                <button 
                  onClick={() => {
                    setIs2FAEnabled(!is2FAEnabled);
                    showToast(is2FAEnabled ? 'Xác thực 2 lớp bảo mật đã bị vô hiệu hóa.' : 'Xác thực 2 lớp bảo mật đã có hiệu lực.');
                  }}
                  className={`w-12 h-6.5 rounded-full relative p-1 transition-all duration-300 cursor-pointer ${
                    is2FAEnabled ? 'bg-primary' : 'bg-surface-container-highest'
                  }`}
                >
                  <div className={`w-4.5 h-4.5 rounded-full absolute top-[4px] transition-all duration-300 ${
                    is2FAEnabled ? 'right-1 bg-on-primary' : 'left-1 bg-outline'
                  }`} />
                </button>
              </div>

              {/* Login Alerts Switch */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-on-surface font-headline">Thông Báo Truy Cập</p>
                  <p className="text-xs text-on-surface-variant opacity-75 font-medium">Gửi Email khi có phiên làm việc mới</p>
                </div>
                <button 
                  onClick={() => {
                    setIsLoginAlertsEnabled(!isLoginAlertsEnabled);
                    showToast(isLoginAlertsEnabled ? 'Đã tắt nhận email cảnh báo đăng nhập mới.' : 'Hệ thống đã bật gửi cảnh báo đăng nhập về Email của bạn.');
                  }}
                  className={`w-12 h-6.5 rounded-full relative p-1 transition-all duration-300 cursor-pointer ${
                    isLoginAlertsEnabled ? 'bg-primary' : 'bg-surface-container-highest'
                  }`}
                >
                  <div className={`w-4.5 h-4.5 rounded-full absolute top-[4px] transition-all duration-300 ${
                    isLoginAlertsEnabled ? 'right-1 bg-on-primary' : 'left-1 bg-outline'
                  }`} />
                </button>
              </div>

              {/* Active Sessions Button */}
              <button 
                onClick={() => setIsSessionsModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-sm font-bold text-on-surface cursor-pointer mt-4"
              >
                <Smartphone size={16} className="text-primary" />
                <span>Số Phiên Kết Nối ({sessions.length})</span>
              </button>
            </div>
          </div>

          {/* Preferences Card */}
          <div className="bg-surface-container/60 border border-white/10 p-6 rounded-2xl space-y-6 shadow-xl" id="preferences-panel">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <Sliders size={20} className="text-primary" />
              <h3 className="font-headline text-base font-bold text-on-surface">Cấu Hình Chung</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">Sắc Thái Hiển Thị (Giao diện)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setThemeMode('Dark')}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border font-bold text-sm transition-all cursor-pointer ${
                      themeMode === 'Dark' 
                        ? 'bg-primary/10 border-primary text-primary' 
                        : 'border-white/5 text-on-surface-variant hover:bg-white/5 opacity-50'
                    }`}
                  >
                    <span>Ban Đêm</span>
                  </button>
                  <button 
                    onClick={() => setThemeMode('Light')}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border font-bold text-sm transition-all cursor-pointer ${
                      themeMode === 'Light' 
                        ? 'bg-primary/10 border-primary text-primary shadow-glow' 
                        : 'border-white/5 text-on-surface-variant hover:bg-white/5 opacity-50'
                    }`}
                  >
                    <span>Ban Ngày</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">Bản Địa Ngôn Ngữ</label>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                >
                  <option value="English (US)">English (US)</option>
                  <option value="Deutsch">Deutsch</option>
                  <option value="Español">Español</option>
                  <option value="Tiếng Việt">Tiếng Việt</option>
                </select>
              </div>

              <div className="flex items-center gap-3.5 pt-4">
                <input 
                  type="checkbox"
                  id="newsletter-check"
                  checked={receiveNewsletters}
                  onChange={(e) => setReceiveNewsletters(e.target.checked)}
                  className="w-4 h-4 rounded border-white/15 bg-surface text-primary focus:ring-primary cursor-pointer"
                />
                <label htmlFor="newsletter-check" className="text-sm text-on-surface-variant cursor-pointer select-none font-medium">
                  Nhận thư báo cập nhật và tin tức sự kiện của Vương Quốc
                </label>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Active Sessions Overlay Popup Modal */}
      <AnimatePresence>
        {isSessionsModalOpen && (
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-surface/85 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-high border border-white/15 w-full max-w-md rounded-2xl p-6 relative shadow-2xl"
              id="sessions-modal-box"
            >
              <button 
                onClick={() => setIsSessionsModalOpen(false)}
                className="absolute right-4 top-4 p-2 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              <h3 className="font-headline text-xl font-bold text-primary mb-2 flex items-center gap-2">
                <Smartphone size={20} />
                <span>Các Thiết Bị Đang Kết Nối</span>
              </h3>
              <p className="text-xs text-on-surface-variant mb-6 border-b border-white/5 pb-2">
                Danh sách các phiên và máy tính đang giữ quyền cập nhật an toàn vào hệ hống chỉ huy.
              </p>

              <div className="space-y-4 max-h-[300px] overflow-y-auto">
                {sessions.map((sess) => (
                  <div 
                    key={sess.id} 
                    className={`flex items-center justify-between p-3 rounded-xl border bg-surface-container-lowest/40 ${
                      sess.isCurrent ? 'border-primary/35 bg-primary/5' : 'border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${sess.isCurrent ? 'text-primary bg-primary/10' : 'text-on-surface-variant bg-white/5'}`}>
                        {sess.device.includes('Desktop') || sess.device.includes('Ứng dụng PC') || sess.device.includes('Chrome') ? <Laptop size={18} /> : <Smartphone size={18} />}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-on-surface font-headline">{sess.device}</p>
                        <p className="text-[11px] text-on-surface-variant font-mono mt-0.5">{sess.location} • {sess.ip}</p>
                      </div>
                    </div>
                    <div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sess.isCurrent ? 'bg-primary/20 text-primary animate-pulse' : 'bg-white/5 text-on-surface-variant'
                      }`}>
                        {sess.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 pt-6 mt-4 border-t border-white/5">
                <button 
                  onClick={() => setIsSessionsModalOpen(false)}
                  className="w-full py-2.5 bg-white/5 text-on-surface font-semibold rounded-xl text-center text-sm hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Đóng Cửa Sổ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
