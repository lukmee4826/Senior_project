import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Logo } from '../Logo';
import { ThemeToggle } from '../ThemeToggle';
import { useTheme } from '../ThemeContext';
import { Eye, EyeOff } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
  onNavigate: (page: string) => void;
}

export function LoginPage({ onLogin, onNavigate }: LoginPageProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <Card className={`w-full max-w-md shadow-2xl ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <Logo />
          </div>
          <CardTitle className={`text-2xl ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>เข้าสู่ระบบ</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className={isDark ? 'text-gray-300' : 'text-gray-700'}>อีเมล</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={isDark ? 'bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className={isDark ? 'text-gray-300' : 'text-gray-700'}>รหัสผ่าน</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={isDark ? 'bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500 pr-10' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 pr-10'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={isDark ? 'absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300' : 'absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-700'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" />
                <label htmlFor="remember" className={`text-sm cursor-pointer ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  จดจำฉันไว้ในระบบ
                </label>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('forgot-password')}
                className={`text-sm ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
              >
                ลืมรหัสผ่าน?
              </button>
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
              เข้าสู่ระบบ
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className={`w-full border-t ${isDark ? 'border-gray-700' : 'border-gray-300'}`} />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className={`px-2 text-gray-500 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>หรือ</span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className={isDark ? 'w-full bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750 rounded-lg' : 'w-full bg-white border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg'}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              เข้าสู่ระบบด้วย Google
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            ยังไม่มีบัญชี?{' '}
            <button
              onClick={() => onNavigate('register')}
              className={isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}
            >
              สมัครสมาชิกที่นี่
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
