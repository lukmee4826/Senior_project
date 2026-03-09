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
import { setAuthToken } from '../../utils/api';
import { toast } from 'sonner';

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

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', email); // OAuth2PasswordRequestForm expects 'username'
      formData.append('password', password);

      const response = await fetch('http://127.0.0.1:8000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }

      const data = await response.json();
      setAuthToken(data.access_token);

      toast.success('เข้าสู่ระบบสำเร็จ');
      onLogin();

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setIsLoading(false);
    }
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
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg" disabled={isLoading}>
              {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
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
