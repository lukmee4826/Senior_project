import React from 'react';
import { Upload, History, User } from 'lucide-react';
import { useTheme } from '../ThemeContext';

interface MobileNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function MobileNav({ currentPage, onNavigate }: MobileNavProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <div className={`md:hidden fixed bottom-0 left-0 right-0 shadow-2xl z-50 ${isDark ? 'bg-gray-900 border-t border-gray-800' : 'bg-white border-t border-gray-200'}`}>
      <div className="grid grid-cols-3 h-16">
        <button
          onClick={() => onNavigate('dashboard')}
          className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
            currentPage === 'dashboard'
              ? isDark ? 'text-blue-400 bg-gray-800' : 'text-blue-600 bg-blue-50'
              : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Upload className="w-5 h-5" />
          <span className="text-xs">วิเคราะห์</span>
        </button>
        <button
          onClick={() => onNavigate('history')}
          className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
            currentPage === 'history'
              ? isDark ? 'text-blue-400 bg-gray-800' : 'text-blue-600 bg-blue-50'
              : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <History className="w-5 h-5" />
          <span className="text-xs">ประวัติ</span>
        </button>
        <button
          onClick={() => onNavigate('profile')}
          className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
            currentPage === 'profile'
              ? isDark ? 'text-blue-400 bg-gray-800' : 'text-blue-600 bg-blue-50'
              : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-xs">โปรไฟล์</span>
        </button>
      </div>
    </div>
  );
}
