import React, { useState } from 'react';
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
import { Toaster } from './components/ui/sonner';

type AuthPage = 'home' | 'login' | 'register' | 'forgot-password';
type AppPage = 'dashboard' | 'history' | 'profile';

function AppContent() {
  const { theme } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authPage, setAuthPage] = useState<AuthPage>('home');
  const [currentPage, setCurrentPage] = useState<AppPage>('dashboard');

  const handleLogin = () => {
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const handleRegister = () => {
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAuthPage('home');
  };

  const handleAuthNavigate = (page: string) => {
    setAuthPage(page as AuthPage);
  };

  const handleAppNavigate = (page: string) => {
    setCurrentPage(page as AppPage);
  };

  if (!isAuthenticated) {
    switch (authPage) {
      case 'home':
        return <HomePage onNavigate={handleAuthNavigate} />;
      case 'login':
        return <LoginPage onLogin={handleLogin} onNavigate={handleAuthNavigate} />;
      case 'register':
        return <RegisterPage onRegister={handleRegister} onNavigate={handleAuthNavigate} />;
      case 'forgot-password':
        return <ForgotPasswordPage onNavigate={handleAuthNavigate} />;
    }
  }

  return (
    <div className={theme === 'dark' ? 'min-h-screen bg-gray-950' : 'min-h-screen bg-gray-50'}>
      <Navbar currentPage={currentPage} onNavigate={handleAppNavigate} onLogout={handleLogout} />
      
      <main className="min-h-[calc(100vh-4rem)]">
        {currentPage === 'dashboard' && <AnalysisDashboard />}
        {currentPage === 'history' && <HistoryPage />}
        {currentPage === 'profile' && <ProfilePage onLogout={handleLogout} />}
      </main>

      <MobileNav currentPage={currentPage} onNavigate={handleAppNavigate} />
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
