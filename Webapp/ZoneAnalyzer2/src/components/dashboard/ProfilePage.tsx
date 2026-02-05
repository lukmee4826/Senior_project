import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { User, Building, Lock, LogOut, Edit, Save } from 'lucide-react';
import { useTheme } from '../ThemeContext';

import { useEffect } from 'react';

interface ProfilePageProps {
  onLogout: () => void;
}

export function ProfilePage({ onLogout }: ProfilePageProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [editingName, setEditingName] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState(false);
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/users/me");
      if (response.ok) {
        const data = await response.json();
        setName(data.full_name || "");
        setInstitution(data.institution || "");
        setEmail(data.email || "");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const updateUserProfile = async (updates: { full_name?: string, institution?: string }) => {
    try {
      const response = await fetch("http://127.0.0.1:8000/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        alert("Failed to update profile");
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      return false;
    }
  };

  const handleSaveName = async () => {
    const success = await updateUserProfile({ full_name: name });
    if (success) {
      setEditingName(false);
      // alert('บันทึกข้อมูลเรียบร้อยแล้ว'); 
    }
  };

  const handleSaveInstitution = async () => {
    const success = await updateUserProfile({ institution: institution });
    if (success) {
      setEditingInstitution(false);
      // alert('บันทึกข้อมูลเรียบร้อยแล้ว');
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    alert('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <h1 className={`text-3xl mb-8 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>โปรไฟล์</h1>

      <Card className={`p-6 mb-6 shadow-xl ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <h2 className={`text-xl mb-6 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>ข้อมูลส่วนตัว</h2>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>อีเมล</Label>
            <Input
              value={email}
              readOnly
              className={isDark ? 'bg-gray-800 border-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'}
            />
          </div>

          <div className="space-y-2">
            <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>ชื่อ - นามสกุล</Label>
            <div className="flex gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!editingName}
                className={isDark ? 'bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500 disabled:opacity-60' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 disabled:opacity-60'}
              />
              {editingName ? (
                <Button
                  onClick={handleSaveName}
                  className="bg-green-600 hover:bg-green-700 text-white rounded-lg"
                >
                  <Save className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => setEditingName(true)}
                  variant="outline"
                  className={isDark ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750 rounded-lg' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg'}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>สถาบัน/โรงพยาบาล</Label>
            <div className="flex gap-2">
              <Input
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                disabled={!editingInstitution}
                className={isDark ? 'bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500 disabled:opacity-60' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 disabled:opacity-60'}
              />
              {editingInstitution ? (
                <Button
                  onClick={handleSaveInstitution}
                  className="bg-green-600 hover:bg-green-700 text-white rounded-lg"
                >
                  <Save className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => setEditingInstitution(true)}
                  variant="outline"
                  className={isDark ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750 rounded-lg' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg'}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card className={`p-6 mb-6 shadow-xl ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <h2 className={`text-xl mb-6 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>เปลี่ยนรหัสผ่าน</h2>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className={isDark ? 'text-gray-300' : 'text-gray-700'}>รหัสผ่านปัจจุบัน</Label>
            <Input
              id="currentPassword"
              type="password"
              className={isDark ? 'bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword" className={isDark ? 'text-gray-300' : 'text-gray-700'}>รหัสผ่านใหม่</Label>
            <Input
              id="newPassword"
              type="password"
              className={isDark ? 'bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className={isDark ? 'text-gray-300' : 'text-gray-700'}>ยืนยันรหัสผ่านใหม่</Label>
            <Input
              id="confirmPassword"
              type="password"
              className={isDark ? 'bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'}
              required
            />
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
            <Lock className="w-4 h-4 mr-2" />
            บันทึกรหัสผ่านใหม่
          </Button>
        </form>
      </Card>

      <Card className={`p-6 shadow-xl ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <Button
          onClick={onLogout}
          variant="destructive"
          className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg"
        >
          <LogOut className="w-4 h-4 mr-2" />
          ออกจากระบบ
        </Button>
      </Card>
    </div>
  );
}
