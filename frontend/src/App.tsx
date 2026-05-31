import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import DashboardScreen from './components/DashboardScreen';
import api from './lib/api';

type AuthScreenState = 'LOGIN' | 'REGISTER' | 'DASHBOARD';

export default function App() {
  const [screen, setScreen] = useState<AuthScreenState>('LOGIN');
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        setCurrentUser(response.data);
        setScreen('DASHBOARD');
      } catch (err: any) {
        console.error('Session check failed:', err);
        localStorage.removeItem('token');
        setError('Phiên đăng nhập hết hạn hoặc server không phản hồi.');
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    setScreen('DASHBOARD');
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
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800">EMERALD REALM</h2>
          <p className="text-slate-500 font-medium">Đang tải ứng dụng...</p>
        </div>
      </div>
    );
  }

  // Basic Error display if something goes wrong top-level
  if (error && screen !== 'LOGIN') {
     console.warn("Recoverable error:", error);
     // We don't block the screen, just log it, but if user is stuck we might show something.
  }

  return (
    <div className="bg-[#f8fafc] min-h-screen text-slate-900 select-none font-sans overflow-x-hidden">
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
    </div>
  );
}

