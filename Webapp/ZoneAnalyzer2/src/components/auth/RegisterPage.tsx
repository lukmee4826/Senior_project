import React, { useState } from 'react';
import { toast } from 'sonner';
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

  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    try {
      setIsLoading(true);
      const data = {
        full_name: fullname,
        email: email,
        password: password
      };

      const response = await fetch('http://127.0.0.1:8000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        toast.success('สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ');
        onNavigate('login');
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
      }
    } catch (error) {
      toast.error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
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
          <CardTitle className={`text-2xl ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>สมัครสมาชิก</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullname" className={isDark ? 'text-gray-300' : 'text-gray-700'}>ชื่อ - นามสกุล</Label>
              <Input
                id="fullname"
                type="text"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                className={isDark ? 'bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'}
                required
              />
            </div>
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
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className={isDark ? 'text-gray-300' : 'text-gray-700'}>ยืนยันรหัสผ่าน</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
            <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
              {isLoading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
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
