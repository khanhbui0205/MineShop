import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import DashboardScreen from './components/DashboardScreen';
import AdminScreen from './components/AdminScreen';
import CheckoutPage from './features/payment/CheckoutPage';
import SuccessPage from './features/payment/SuccessPage';
import FailedPage from './features/payment/FailedPage';
import MainLayout from './components/MainLayout';
import api from './lib/api';

import { Toaster, toast } from 'react-hot-toast';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
        setCurrentUser(response.data);
      } catch (err: any) {
        console.error('Kiểm tra phiên thất bại:', err);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Health check logic
    const checkHealth = async () => {
      try {
        const res = await api.get('/health');
        if (res.data.success) {
          toast.success("Đã kết nối tới máy chủ", { id: 'health-check' });
        }
      } catch (error) {
        toast.error("Không thể kết nối tới máy chủ", { id: 'health-check' });
      }
    };
    checkHealth();
  }, []);

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-6">
        <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl">
          <img src="/logo.png" alt="Emerald Realm logo" className="w-full h-full object-cover" />
          <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-2xl animate-spin" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white tracking-wider">EMERALD REALM</h2>
          <p className="text-slate-400 font-medium mt-1">Đang tải ứng dụng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 font-sans overflow-x-hidden">
      <Toaster
        position="top-right"
        containerStyle={{ zIndex: 9999 }}
        toastOptions={{ style: { zIndex: 9999 } }}
      />
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={currentUser ? <Navigate to="/" /> : <LoginScreen onLoginSuccess={handleLoginSuccess} onNavigateToRegister={() => navigate('/register')} />} 
        />
        <Route 
          path="/register" 
          element={currentUser ? <Navigate to="/" /> : <RegisterScreen onRegisterSuccess={() => navigate('/login')} onNavigateToLogin={() => navigate('/login')} />} 
        />

        {/* Protected Routes */}
        <Route 
          path="/" 
          element={
            currentUser ? (
              currentUser.role === 'admin' ? (
                <Navigate to="/admin" />
              ) : (
                <DashboardScreen user={currentUser} onLogout={handleLogout} />
              )
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        <Route 
          path="/admin" 
          element={
            currentUser?.role === 'admin' ? (
              <AdminScreen user={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        
        <Route 
          path="/admin/server-control" 
          element={
            currentUser?.role === 'admin' ? (
              <AdminScreen user={currentUser} onLogout={handleLogout} initialTab="Server Control" />
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        {/* Payment Routes with Shared Layout */}
        <Route 
          path="/payment/checkout/:id" 
          element={
            currentUser 
            ? <MainLayout user={currentUser} onLogout={handleLogout}><CheckoutPage /></MainLayout> 
            : <Navigate to="/login" />
          } 
        />
        <Route 
          path="/payment/success" 
          element={
            currentUser 
            ? <MainLayout user={currentUser} onLogout={handleLogout}><SuccessPage /></MainLayout> 
            : <Navigate to="/login" />
          } 
        />
        <Route 
          path="/payment/cancel" 
          element={
            currentUser 
            ? <MainLayout user={currentUser} onLogout={handleLogout}><FailedPage /></MainLayout> 
            : <Navigate to="/login" />
          } 
        />
        <Route 
          path="/payment/history" 
          element={
            currentUser 
            ? <Navigate to="/" state={{ tab: 'Lịch sử' }} replace />
            : <Navigate to="/login" />
          } 
        />


        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}
