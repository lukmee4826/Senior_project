import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Logo } from '../Logo';
import { ThemeToggle } from '../ThemeToggle';
import { useTheme } from '../ThemeContext';
import { ArrowLeft } from 'lucide-react';

interface ForgotPasswordPageProps {
  onNavigate: (page: string) => void;
}

export function ForgotPasswordPage({ onNavigate }: ForgotPasswordPageProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
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
          <CardTitle className={`text-2xl ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>ลืมรหัสผ่าน</CardTitle>
          <CardDescription className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            {submitted
              ? 'เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปยังอีเมลของคุณแล้ว'
              : 'กรุณากรอกอีเมลของคุณ เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้'}
          </CardDescription>
        </CardHeader>
        {!submitted ? (
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className={isDark ? 'text-gray-300' : 'text-gray-700'}>อีเมล</Label>
                <Input
                  id="email"
                  type="email"
                  className={isDark ? 'bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                ส่งลิงก์รีเซ็ต
              </Button>
            </form>
          </CardContent>
        ) : (
          <CardContent>
            <Button
              onClick={() => onNavigate('login')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              กลับไปหน้าเข้าสู่ระบบ
            </Button>
          </CardContent>
        )}
        <CardFooter className="flex justify-center">
          <button
            onClick={() => onNavigate('login')}
            className={`text-sm flex items-center gap-1 ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
          >
            <ArrowLeft className="w-4 h-4" />
            กลับไปหน้าเข้าสู่ระบบ
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}
