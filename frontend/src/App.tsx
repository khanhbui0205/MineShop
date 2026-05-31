import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import DashboardScreen from './components/DashboardScreen';
import AdminScreen from './components/AdminScreen';
import api from './lib/api';
import type { AuthScreenState } from './types';

export default function App() {
  const [screen, setScreen] = useState<AuthScreenState>('LOGIN');
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Kiểm tra phiên đăng nhập khi tải app
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        const user = response.data;
        setCurrentUser(user);
        // Điều hướng theo role
        if (user.role === 'admin') {
          setScreen('ADMIN');
        } else {
          setScreen('DASHBOARD');
        }
      } catch (err: any) {
        console.error('Kiểm tra phiên thất bại:', err);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      setScreen('ADMIN');
    } else {
      setScreen('DASHBOARD');
    }
  };

  const handleRegisterSuccess = () => {
    setScreen('LOGIN');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setScreen('LOGIN');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <div className="text-center">
          <h2 className="text-xl font-bold text-white tracking-wider">EMERALD REALM</h2>
          <p className="text-slate-400 font-medium mt-1">Đang tải ứng dụng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 font-sans overflow-x-hidden">
      {screen === 'LOGIN' && (
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onNavigateToRegister={() => setScreen('REGISTER')}
        />
      )}

      {screen === 'REGISTER' && (
        <RegisterScreen
          onRegisterSuccess={handleRegisterSuccess}
          onNavigateToLogin={() => setScreen('LOGIN')}
        />
      )}

      {screen === 'DASHBOARD' && currentUser && (
        <DashboardScreen
          user={currentUser}
          onLogout={handleLogout}
        />
      )}

      {screen === 'ADMIN' && currentUser && (
        <AdminScreen
          user={currentUser}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
