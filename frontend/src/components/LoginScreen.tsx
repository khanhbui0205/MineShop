/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LogIn, Lock, User, MessageSquare, Share2, AtSign, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

import api from '../lib/api';

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
  onNavigateToRegister: () => void;
}

export default function LoginScreen({ onLoginSuccess, onNavigateToRegister }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ thông tin đăng nhập.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await api.post('/auth/login', {
        username: username.trim(),
        password
      });

      const { token, ...user } = response.data;
      localStorage.setItem('token', token);
      onLoginSuccess(user);
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.message || 'Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };


  return (
    <div 
      className="relative min-h-screen flex flex-col justify-between overflow-x-hidden text-slate-800 font-sans bg-slate-50"
    >
      {/* Background Image structure mapped to professional clean background overlay */}
      <div 
        className="fixed inset-0 bg-cover bg-center filter brightness-[0.7] opacity-20 pointer-events-none z-0"
        style={{
          backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuB80tIVshCOmL-0jF4y5ITyUrp10AHh4muxxW7uFpLBMbGCxHMHkdGO4fxnT2xlAuMhwmhjj4zOx7YXiihgjK5aK_L-VPMlXhRDuIojMQx7OsEsl6RxndQW6d2JyiGEj7XBSkNYospNpp-DhVEb6Rn_pyNb-KYgaZ9mFz25BAHxwijyzhiHtAJrNGa8HGu_fNOVWrs2b_r7nJxQQRFMffn9sDX6CMAh7i8i7cGLLANU2vRbwYUbO3se6ScHFV2km4yMKOzKYVW-Idg')`,
        }}
      />

      {/* Ambient glowing particles */}
      <div className="absolute inset-x-0 top-1/4 h-96 bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none -z-1" />
      <div className="absolute inset-x-0 bottom-1/4 h-96 bg-indigo-600/5 rounded-full blur-[140px] pointer-events-none -z-1" />

      {/* Main Content Area in Slate 900 overlay look */}
      <main className="relative z-10 flex-grow flex items-center justify-center px-4 py-8 sm:py-14 md:py-20 bg-slate-900/10 backdrop-blur-[3px]">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-[calc(100vw-2rem)] sm:max-w-md min-w-0"
        >
          {/* Main Card (Crisp White Card with Slate Shadows) */}
          <div className="min-w-0 bg-white rounded-2xl p-5 sm:p-8 md:p-10 flex flex-col gap-6 sm:gap-8 shadow-2xl border border-slate-200/80">
            
            {/* Logo header */}
            <div className="text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-indigo-100 border border-slate-200 overflow-hidden">
                <img src="/logo.png" alt="Emerald Realm logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="break-words text-center font-display text-[1.35rem] sm:text-3xl font-extrabold text-indigo-600 tracking-tight leading-tight">
                  EMERALD REALM
                </h1>
                <p className="max-w-full break-words text-sm text-slate-500 mt-1.5 font-sans">
                  Vui lòng đăng nhập để vào bảng điều khiển.
                </p>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 border-l-4 border-red-500 text-red-700 text-xs p-3 rounded"
              >
                {errorMessage}
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              
              {/* Input Username */}
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600">
                  <User className="w-4 h-4" />
                </span>
                <input 
                  id="login-username"
                  type="text"
                  required
                  placeholder="Tên đăng nhập hoặc Email"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 pl-10 pr-4 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              {/* Input Password */}
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600">
                  <Lock className="w-4 h-4" />
                </span>
                <input 
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Mật khẩu"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 pl-10 pr-10 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Keep Remember me & Forgot Password */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500 mt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox"
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="group-hover:text-slate-800 transition-colors">Ghi nhớ đăng nhập</span>
                </label>
                <button 
                  type="button"
                  onClick={() => alert('Chức năng khôi phục mật khẩu sẽ được admin liên hệ qua Email đăng ký.')}
                  className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline transition-all"
                >
                  Quên mật khẩu?
                </button>
              </div>

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={loading}
                className="w-full mt-4 min-h-11 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                <LogIn className="w-4 h-4" />
              </button>
            </form>

            {/* Bottom transition links */}
            <div className="text-center text-xs text-slate-500 border-t border-slate-100 pt-6 font-sans">
              Bạn chưa có tài khoản?
              <button 
                type="button"
                onClick={onNavigateToRegister}
                className="text-indigo-600 font-bold hover:underline ml-2 uppercase tracking-wider"
              >
                Tạo tài khoản
              </button>
            </div>
            
          </div>
        </motion.div>
      </main>

      {/* Footer mirroring layout -> beautiful elegant light grey background */}
      <footer className="relative z-10 w-full bg-slate-900 text-slate-400 py-10 sm:py-16 px-4 sm:px-8 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          
          <div className="space-y-4 col-span-1">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Emerald Realm logo" className="w-8 h-8 rounded-lg object-cover" />
              <span className="font-display font-black tracking-wider text-white text-lg">EMERALD REALM</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-xs">
              Môi trường Minecraft tối tân với nhiều tính năng nâng cao, cộng đồng xây dựng sáng tạo và chế độ sinh tồn kỳ thú.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button className="w-9 h-9 rounded-full bg-slate-800 hover:bg-indigo-600 hover:text-white flex items-center justify-center text-slate-300 transition-all">
                <MessageSquare className="w-4 h-4" />
              </button>
              <button className="w-9 h-9 rounded-full bg-slate-800 hover:bg-indigo-600 hover:text-white flex items-center justify-center text-slate-300 transition-all">
                <Share2 className="w-4 h-4" />
              </button>
              <button className="w-9 h-9 rounded-full bg-slate-800 hover:bg-indigo-600 hover:text-white flex items-center justify-center text-slate-300 transition-all">
                <AtSign className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-display font-semibold text-sm text-slate-200">Hỗ trợ</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Trung tâm Hỗ trợ</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Báo lỗi hệ thống</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Yêu cầu trợ giúp</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Trạng thái Server</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-display font-semibold text-sm text-slate-200">Cộng đồng</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Kênh Discord chính thức</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Diễn đàn thảo luận</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Wiki hướng dẫn</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Cửa hàng phần quà</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-display font-semibold text-sm text-slate-200">Pháp lý</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Điều khoản Dịch vụ</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Chính sách Bảo mật</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Chính sách Cookie</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Luật lệ Server</a></li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left text-slate-500">
          <p className="text-xs">
            © 2026 Emerald Realm Minecraft. Bản quyền được bảo lưu.
          </p>
          <p className="text-xs text-center md:text-right font-mono">
            Không liên kết với Mojang AB hoặc Microsoft.
          </p>
        </div>
      </footer>
    </div>
  );
}
