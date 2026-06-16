/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Mail, Lock, CheckCircle, RefreshCw, Swords, Users, Video, Phone, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

import api from '../lib/api';

interface RegisterScreenProps {
  onRegisterSuccess: () => void;
  onNavigateToLogin: () => void;
}

export default function RegisterScreen({ onRegisterSuccess, onNavigateToLogin }: RegisterScreenProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Password validation requirements
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  
  const isPhoneValid = phoneNumber.length === 0 || /^(0|\+84)(3[2-9]|5[6-9]|7[0-9]|8[1-9]|9[0-9])[0-9]{7}$/.test(phoneNumber);

  const isFormValid = 
    username.trim().length >= 3 && 
    email.includes('@') && 
    hasMinLength && 
    hasUppercase && 
    isPhoneValid &&
    password === confirmPassword && 
    agreeTerms &&
    isVerified;

  const handleVerifyMinecraft = async () => {
    if (username.trim().length < 3) {
      setErrorMessage('Tên người dùng quá ngắn');
      return;
    }
    setErrorMessage('');
    setIsChecking(true);
    try {
      // Use the public check-player endpoint
      const response = await api.post('/minecraft/check-player', { playerName: username.trim() });
      if (response.data.success && response.data.playerExists) {
        // Requirement 2: Check if already registered
        if (response.data.isRegistered) {
          setIsVerified(false);
          setErrorMessage('This Minecraft account is already registered.');
          return;
        }

        setIsVerified(true);
        setUsername(response.data.username); // Normalize casing
        setSuccessMsg(`Xác minh thành công nhân vật: ${response.data.username}`);
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setIsVerified(false);
        setErrorMessage(response.data.message || 'Nhân vật không tồn tại trên server.');
      }
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Không tìm thấy nhân vật này trên server. Bạn phải tham gia server ít nhất 1 lần.');
      setIsVerified(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setErrorMessage('');
    setLoading(true);
    try {
      await api.post('/auth/register', {
        username: username.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        password,
        minecraftUsername: username.trim(),
      });

      setSuccessMsg('Đăng kí tài khoản thành công! Đang chuyển hướng sang Đăng nhập...');
      setTimeout(() => {
        onRegisterSuccess();
      }, 2000);
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.message || 'Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };



  return (
    <div 
      className="relative min-h-screen flex flex-col justify-between overflow-x-hidden text-slate-800 font-sans bg-slate-50"
    >
      {/* Background Image configured exactly like screen 2 mockup */}
      <div 
        className="fixed inset-0 bg-cover bg-center filter brightness-[0.7] opacity-20 pointer-events-none z-0"
        style={{
          backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBad9NrGNKF7WT1oW5VTvw15pGTmhbC0hsDXlN6jfpByoXj9NdXLyxHRWQK4kB-OYxiicmSEEC-DwZ7s6PEFCN8RLV4sR_Q050j3Aa0vfN7uMqso-CeAdShHqwPUB_vOEZb05JqO6tZ08sKPImvJGgXwEFqd_FgyaMACqcZlan1h5pYs08Ni9h55xxB1x5SwNY4aFCA8zMLJBNbiICqj23Mihhc3fFRv4flILHOYd_dM5OVFJGJwrYVPBYZb_hjRAdG-9OshZuz7SA')`,
        }}
      />

      <main className="relative z-10 flex-grow flex items-center justify-center px-4 py-20 bg-slate-900/10 backdrop-blur-[3px]">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Header text container above cards */}
          <div className="text-center mb-8">
            <h1 className="font-display text-4xl font-extrabold text-indigo-600 tracking-tight mb-2">
              EMERALD REALM
            </h1>
            <p className="text-sm font-medium text-slate-500 font-sans">
              Đăng ký tài khoản tham gia thế giới Minecraft đỉnh cao.
            </p>
          </div>

          {/* Setup registration card (White card with clean border) */}
          <div className="bg-white rounded-2xl p-8 shadow-2xl border border-slate-200/80">
            {errorMessage && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 text-xs p-3 rounded mb-5">
                {errorMessage}
              </div>
            )}
            {successMsg && (
              <div className="bg-indigo-50 border-l-4 border-indigo-500 text-indigo-700 text-xs p-3 rounded mb-5 font-medium">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              
              {/* Username Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold tracking-wide text-slate-700 uppercase" htmlFor="reg-username">
                    Tên người dùng (Minecraft)
                  </label>
                  {isVerified && (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Đã xác minh
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="relative group flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600">
                      <User className="w-4 h-4" />
                    </span>
                    <input 
                      id="reg-username"
                      required
                      type="text"
                      placeholder="Steve"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setIsVerified(false);
                      }}
                      className={`w-full bg-slate-50 border ${isVerified ? 'border-emerald-500' : 'border-slate-200'} rounded-lg py-3 pl-10 pr-4 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyMinecraft}
                    disabled={isChecking || username.trim().length < 3 || isVerified}
                    className={`px-4 rounded-lg font-bold text-xs uppercase transition-all flex items-center justify-center min-w-[100px] ${
                      isVerified 
                      ? 'bg-emerald-100 text-emerald-700 cursor-default' 
                      : 'bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 cursor-pointer'
                    }`}
                  >
                    {isChecking ? <RefreshCw className="w-4 h-4 animate-spin" /> : isVerified ? 'Đã Check' : 'Kiểm tra'}
                  </button>
                </div>
                {!isVerified && !isChecking && (
                  <p className="text-[10px] text-slate-400 italic">* Phải nhập đúng tên trong game và bấm Kiểm tra để tiếp tục.</p>
                )}
              </div>

              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold tracking-wide text-slate-700 uppercase" htmlFor="reg-email">
                  Địa chỉ Email
                </label>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input 
                    id="reg-email"
                    required
                    type="email"
                    placeholder="steve@minecraft.net"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 pl-10 pr-4 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  />
                </div>
              </div>

              {/* Phone Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold tracking-wide text-slate-700 uppercase" htmlFor="reg-phone">
                  Số điện thoại
                </label>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input 
                    id="reg-phone"
                    type="text"
                    placeholder="09xx xxx xxx"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className={`w-full bg-slate-50 border ${!isPhoneValid ? 'border-red-500' : 'border-slate-200'} rounded-lg py-3 pl-10 pr-4 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300`}
                  />
                </div>
                {!isPhoneValid && <p className="text-[10px] text-red-500 font-medium">SĐT không hợp lệ (Ví dụ: 0912345678)</p>}
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold tracking-wide text-slate-700 uppercase" htmlFor="reg-password">
                  Mật khẩu
                </label>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input 
                    id="reg-password"
                    required
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 pl-10 pr-12 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    {password.length > 5 && hasMinLength && hasUppercase && (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                </div>

                {/* Password requirement indicators */}
                <div className="mt-3 space-y-1.5 px-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Điều kiện mật khẩu:</p>
                  <div className="flex items-center gap-2">
                    <span className={hasMinLength ? 'text-emerald-500' : 'text-red-500'}>
                      {hasMinLength ? '✓' : '✗'}
                    </span>
                    <span className={`text-xs ${hasMinLength ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>Tối thiểu 8 ký tự</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={hasUppercase ? 'text-emerald-500' : 'text-red-500'}>
                      {hasUppercase ? '✓' : '✗'}
                    </span>
                    <span className={`text-xs ${hasUppercase ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>Có ít nhất 1 chữ cái viết hoa</span>
                  </div>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold tracking-wide text-slate-700 uppercase" htmlFor="reg-confirm">
                  Xác nhận mật khẩu
                </label>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600">
                    <RefreshCw className="w-4 h-4" />
                  </span>
                  <input 
                    id="reg-confirm"
                    required
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 pl-10 pr-12 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    {password && confirmPassword && (
                      password === confirmPassword ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-bold">!</div>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start mt-2">
                <input 
                  id="agree-terms"
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label className="ml-2.5 text-xs text-slate-500 font-sans leading-relaxed cursor-pointer" htmlFor="agree-terms">
                  Tôi đồng ý với{' '}
                  <span onClick={() => alert('Chi tiết Điều khoản sẽ hiển thị khi server chính thức ra mắt.')} className="text-indigo-600 hover:text-indigo-700 transition-colors underline cursor-pointer font-medium">
                    Điều khoản Dịch vụ
                  </span>{' '}
                  &{' '}
                  <span onClick={() => alert('Chính sách bảo mật được bảo lưu vô thời hạn.')} className="text-indigo-600 hover:text-indigo-700 transition-colors underline cursor-pointer font-medium">
                    Chính sách Bảo mật
                  </span>
                </label>
              </div>

              {/* Button Sign Up */}
              <button 
                type="submit"
                disabled={!isFormValid || loading}
                className={`w-full mt-2 py-3 rounded-lg font-display font-bold text-sm uppercase tracking-wider transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                  isFormValid && !loading
                  ? 'bg-indigo-600 text-white hover:bg-slate-800 shadow-lg shadow-indigo-100 cursor-pointer' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                }`}
              >
                {loading ? 'Đang xử lý...' : 'Đăng ký ngay'}
              </button>


            </form>

            {/* Back to login */}
            <div className="mt-6 text-center text-xs text-slate-500 font-sans">
              Bạn đã có tài khoản?{' '}
              <button 
                type="button"
                onClick={onNavigateToLogin}
                className="text-indigo-600 hover:text-indigo-700 font-bold ml-1 cursor-pointer transition-all"
              >
                Đăng nhập
              </button>
            </div>

          </div>
        </motion.div>
      </main>

      {/* Footer to mirror professional and clean presentation */}
      <footer className="relative z-10 w-full bg-slate-900 text-slate-400 py-16 px-8 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          
          <div className="space-y-4 col-span-1">
            <div className="flex items-center gap-3">
              <span className="font-display font-black tracking-wider text-white text-lg">EMERALD REALM</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-xs">
              Thế hệ máy chủ Minecraft đỉnh cao dành cho game thủ sáng tạo và cạnh tranh lành mạnh. Hãy tham gia cùng hàng ngàn dũng sĩ.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-display font-semibold text-xs tracking-wider text-slate-200 uppercase">Liên kết nhanh</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Trạng thái Server</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Bảng xếp hạng</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Tuyển quản trị viên</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Cửa hàng quyên góp</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-display font-semibold text-xs tracking-wider text-slate-200 uppercase">Hỗ trợ</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Trung tâm Trợ giúp</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Gửi Ticket phản hồi</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Thư viện Wiki mội</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Báo cáo người chơi</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-display font-semibold text-xs tracking-wider text-slate-200 uppercase">Liên kết</h4>
            <div className="flex gap-4 mb-3">
              <button className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-all">
                <Swords className="w-4 h-4" />
              </button>
              <button className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-all">
                <Users className="w-4 h-4" />
              </button>
              <button className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-all">
                <Video className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 font-sans break-all">
              Email: support@emeraldrealm.com
            </p>
          </div>

        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left text-slate-500">
          <p className="text-xs">
            © 2016 Emerald Realm. Not an official Minecraft product. Not approved by or associated with Mojang or Microsoft.
          </p>
          <div className="flex gap-4 text-xs">
            <a href="#" className="hover:text-indigo-400 transition-all">Điều khoản Dịch vụ</a>
            <a href="#" className="hover:text-indigo-400 transition-all">Chính sách Bảo mật</a>
            <a href="#" className="hover:text-indigo-400 transition-all">Chính sách Cookie</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
