import React from 'react';
import { Logo } from '../Logo';
import { ThemeToggle } from '../ThemeToggle';
import { useTheme } from '../ThemeContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { User, Settings, LogOut } from 'lucide-react';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function Navbar({ currentPage, onNavigate, onLogout }: NavbarProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <nav className={`sticky top-0 z-50 shadow-lg ${isDark ? 'bg-gray-900 border-b border-gray-800' : 'bg-white border-b border-gray-200'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button onClick={() => onNavigate('dashboard')} className="flex-shrink-0">
            <Logo />
          </button>
          
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`px-3 py-2 rounded-lg transition-colors ${
                currentPage === 'dashboard'
                  ? isDark ? 'text-blue-400 bg-gray-800' : 'text-blue-600 bg-blue-50'
                  : isDark ? 'text-gray-300 hover:text-gray-100 hover:bg-gray-800' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              วิเคราะห์ภาพ
            </button>
            <button
              onClick={() => onNavigate('history')}
              className={`px-3 py-2 rounded-lg transition-colors ${
                currentPage === 'history'
                  ? isDark ? 'text-blue-400 bg-gray-800' : 'text-blue-600 bg-blue-50'
                  : isDark ? 'text-gray-300 hover:text-gray-100 hover:bg-gray-800' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              ประวัติ
            </button>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                <Avatar className="w-9 h-9 bg-blue-600">
                  <AvatarFallback className="bg-blue-600 text-white">
                    <User className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                <span className={`hidden md:block ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>ผู้ใช้งาน</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent className={isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-900'}>
                <DropdownMenuItem
                  onClick={() => onNavigate('profile')}
                  className={`cursor-pointer ${isDark ? 'hover:bg-gray-700 focus:bg-gray-700' : 'hover:bg-gray-100 focus:bg-gray-100'}`}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  ตั้งค่าบัญชี
                </DropdownMenuItem>
                <DropdownMenuSeparator className={isDark ? 'bg-gray-700' : 'bg-gray-200'} />
                <DropdownMenuItem
                  onClick={onLogout}
                  className={`cursor-pointer text-red-400 ${isDark ? 'hover:bg-gray-700 focus:bg-gray-700' : 'hover:bg-gray-100 focus:bg-gray-100'}`}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  ออกจากระบบ
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
