import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider, useTheme } from './components/ThemeContext';
import { HomePage } from './components/HomePage';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';
import { Navbar } from './components/layout/Navbar';
import { MobileNav } from './components/layout/MobileNav';
import { AnalysisDashboard } from './components/dashboard/AnalysisDashboard';
import { HistoryPage } from './components/dashboard/HistoryPage';
import { ProfilePage } from './components/dashboard/ProfilePage';
import { AdminPage } from './components/dashboard/AdminPage';
import { Toaster } from './components/ui/sonner';
import { getAuthToken, removeAuthToken, fetchWithAuth } from './utils/api';

function AppContent() {
  const { theme } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState(!!getAuthToken());

  useEffect(() => {
    const handleUnauthorized = () => {
      setIsAuthenticated(false);
      removeAuthToken();
    };

    window.addEventListener('auth-unauthorized', handleUnauthorized);

    if (isAuthenticated) {
      fetchWithAuth('/users/me').then(res => {
        if (!res.ok) handleUnauthorized();
      }).catch(() => handleUnauthorized());
    }

    return () => {
      window.removeEventListener('auth-unauthorized', handleUnauthorized);
    };
  }, [isAuthenticated]);

  return (
    <Router>
      <RoutesContent 
        isAuthenticated={isAuthenticated} 
        setIsAuthenticated={setIsAuthenticated} 
        theme={theme} 
      />
    </Router>
  );
}

function RoutesContent({ isAuthenticated, setIsAuthenticated, theme }: { isAuthenticated: boolean, setIsAuthenticated: (val: boolean) => void, theme: string }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = () => {
    setIsAuthenticated(true);
    navigate('/dashboard');
  };

  const handleRegister = () => {
    setIsAuthenticated(true);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    removeAuthToken();
    setIsAuthenticated(false);
    navigate('/');
  };

  const handleAuthNavigate = (page: string) => {
    if (page === 'home') navigate('/');
    else navigate('/' + page);
  };

  const handleAppNavigate = (page: string) => {
    navigate('/' + page);
  };

  // Extract current page path for Navbar active state (e.g. '/dashboard' -> 'dashboard')
  const currentPagePath = location.pathname.split('/')[1] || 'dashboard';

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<HomePage onNavigate={handleAuthNavigate} />} />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} onNavigate={handleAuthNavigate} />} />
        <Route path="/register" element={<RegisterPage onRegister={handleRegister} onNavigate={handleAuthNavigate} />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage onNavigate={handleAuthNavigate} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <div className={theme === 'dark' ? 'min-h-screen bg-gray-950' : 'min-h-screen bg-gray-50'}>
      <Navbar currentPage={currentPagePath} onNavigate={handleAppNavigate} onLogout={handleLogout} />

      <main className="min-h-[calc(100vh-4rem)]">
        <Routes>
          <Route path="/dashboard" element={<AnalysisDashboard />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/profile" element={<ProfilePage onLogout={handleLogout} />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>

      <MobileNav currentPage={currentPagePath} onNavigate={handleAppNavigate} />
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
