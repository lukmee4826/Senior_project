import React from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from './ThemeContext';
import { Microscope, Zap, Shield, Users, ChevronRight, Github, Mail } from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <div className={isDark ? 'min-h-screen bg-gray-950' : 'min-h-screen bg-gray-50'}>
      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className={isDark ? 'absolute inset-0 bg-gradient-to-br from-blue-900/20 via-gray-950 to-gray-950' : 'absolute inset-0 bg-gradient-to-br from-blue-100 via-gray-50 to-gray-50'}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24">
          <div className="text-center space-y-8">
            <div className="flex justify-center">
              <Logo className="scale-150" />
            </div>
            
            <h1 className={`text-4xl sm:text-5xl md:text-6xl max-w-4xl mx-auto ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              ระบบวิเคราะห์ Clear Zone
              <span className={`block mt-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>จานเพาะเชื้อแบบอัตโนมัติ</span>
            </h1>
            
            <p className={`text-xl max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              วิเคราะห์ความไวของยาปฏิชีวนะด้วย AI ที่แม่นยำ รวดเร็ว และง่ายต่อการใช้งาน
              สำหรับห้องปฏิบัติการทางการแพทย์
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button
                onClick={() => onNavigate('login')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-blue-600/20"
              >
                เข้าสู่ระบบ
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                onClick={() => onNavigate('register')}
                variant="outline"
                className={isDark ? 'bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800 px-8 py-6 text-lg rounded-xl' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100 px-8 py-6 text-lg rounded-xl'}
              >
                สมัครสมาชิก
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className={`text-3xl text-center mb-12 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>คุณสมบัติเด่น</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className={isDark ? 'bg-gray-900 border-gray-800 p-6 hover:border-gray-700 transition-all shadow-xl' : 'bg-white border-gray-200 p-6 hover:border-gray-300 transition-all shadow-xl'}>
            <div className="w-12 h-12 rounded-lg bg-blue-600/20 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className={`text-xl mb-3 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>วิเคราะห์รวดเร็ว</h3>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              ประมวลผลภาพด้วย AI ใช้เวลาเพียงไม่กี่วินาที รองรับการวิเคราะห์แบบ Batch
            </p>
          </Card>

          <Card className={isDark ? 'bg-gray-900 border-gray-800 p-6 hover:border-gray-700 transition-all shadow-xl' : 'bg-white border-gray-200 p-6 hover:border-gray-300 transition-all shadow-xl'}>
            <div className="w-12 h-12 rounded-lg bg-green-600/20 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-green-400" />
            </div>
            <h3 className={`text-xl mb-3 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>แม่นยำสูง</h3>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              ใช้โมเดล YOLO และมาตรฐาน CLSI/EUCAST เพื่อความแม่นยำในการวัดขนาด Zone
            </p>
          </Card>

          <Card className={isDark ? 'bg-gray-900 border-gray-800 p-6 hover:border-gray-700 transition-all shadow-xl' : 'bg-white border-gray-200 p-6 hover:border-gray-300 transition-all shadow-xl'}>
            <div className="w-12 h-12 rounded-lg bg-purple-600/20 flex items-center justify-center mb-4">
              <Microscope className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className={`text-xl mb-3 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>ครบวงจร</h3>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              ตรวจจับ วัดขนาด และแปลผล (S/I/R) พร้อมสร้างรายงาน XLSX ได้ทันที
            </p>
          </Card>
        </div>
      </div>

      {/* How It Works */}
      <div className={isDark ? 'bg-gray-900/50 py-16' : 'bg-gray-100 py-16'}>
        <div className="max-w-7xl mx-auto px-4">
          <h2 className={`text-3xl text-center mb-12 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>วิธีการใช้งาน</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'อัปโหลดภาพ', desc: 'ถ่ายภาพหรือเลือกไฟล์จานเพาะเชื้อ' },
              { step: '2', title: 'เลือกมาตรฐาน', desc: 'กำหนดมาตรฐานการวิเคราะห์' },
              { step: '3', title: 'วิเคราะห์', desc: 'AI ประมวลผลและตรวจจับ Clear Zone' },
              { step: '4', title: 'ดูผลลัพธ์', desc: 'รับรายงานและบันทึกประวัติ' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto mb-4 text-2xl shadow-lg shadow-blue-600/20">
                  {item.step}
                </div>
                <h3 className={`text-lg mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{item.title}</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* About/Team Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className={`text-3xl text-center mb-12 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>เกี่ยวกับโปรเจกต์</h2>
        <Card className={`p-8 shadow-xl max-w-4xl mx-auto ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="space-y-6 text-center">
            <p className={`text-lg leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              ZoneAnalyzer เป็นระบบวิเคราะห์ Clear Zone จานเพาะเชื้อด้วย AI 
              ที่พัฒนาขึ้นเพื่อช่วยเหลือห้องปฏิบัติการทางการแพทย์ในการวิเคราะห์
              ความไวของยาปฏิชีวนะได้อย่างรวดเร็วและแม่นยำ
            </p>
            
            <div className={`pt-6 mt-6 ${isDark ? 'border-t border-gray-800' : 'border-t border-gray-200'}`}>
              <h3 className={`text-xl mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>ทีมพัฒนา</h3>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
                <Card className={`p-6 w-full sm:w-64 transition-all shadow-lg ${isDark ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}>
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mx-auto mb-4 flex items-center justify-center">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <h4 className={`text-lg mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>ทีมพัฒนา</h4>
                  <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    นักศึกษาวิทยาศาสตร์ข้อมูลสุขภาพ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี และ ราชวิทยาลัยจุฬาภรณ์
                  </p>
                  <div className="flex justify-center gap-3">
                    <button className={isDark ? 'text-gray-400 hover:text-blue-400 transition-colors' : 'text-gray-600 hover:text-blue-600 transition-colors'}>
                      <Github className="w-5 h-5" />
                    </button>
                    <button className={isDark ? 'text-gray-400 hover:text-blue-400 transition-colors' : 'text-gray-600 hover:text-blue-600 transition-colors'}>
                      <Mail className="w-5 h-5" />
                    </button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <footer className={`py-8 mt-16 ${isDark ? 'border-t border-gray-800' : 'border-t border-gray-200'}`}>
        <div className={`max-w-7xl mx-auto px-4 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          <p>&copy; 2025 ZoneAnalyzer. All rights reserved.</p>
          <p className="text-sm mt-2">
            Antibiotic Susceptibility Testing Analysis System
          </p>
        </div>
      </footer>
    </div>
  );
}
