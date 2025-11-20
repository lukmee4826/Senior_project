import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Logo } from '../Logo';
import { ThemeToggle } from '../ThemeToggle';
import { useTheme } from '../ThemeContext';
import { Eye, EyeOff } from 'lucide-react';

interface RegisterPageProps {
  onRegister: () => void;
  onNavigate: (page: string) => void;
}

export function RegisterPage({ onRegister, onNavigate }: RegisterPageProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRegister();
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
          <CardTitle className={`text-2xl ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>สมัครสมาชิก</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullname" className={isDark ? 'text-gray-300' : 'text-gray-700'}>ชื่อ - นามสกุล</Label>
              <Input
                id="fullname"
                type="text"
                className={isDark ? 'bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className={isDark ? 'text-gray-300' : 'text-gray-700'}>อีเมล</Label>
              <Input
                id="email"
                type="email"
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
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className={isDark ? 'text-gray-300' : 'text-gray-700'}>ยืนยันรหัสผ่าน</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={isDark ? 'bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500 pr-10' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 pr-10'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={isDark ? 'absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300' : 'absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-700'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <Checkbox id="terms" required />
              <label htmlFor="terms" className={`text-sm cursor-pointer leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                ฉันยอมรับข้อตกลงและนโยบายความเป็นส่วนตัว
              </label>
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
              สมัครสมาชิก
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            มีบัญชีอยู่แล้ว?{' '}
            <button
              onClick={() => onNavigate('login')}
              className={isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}
            >
              เข้าสู่ระบบที่นี่
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
