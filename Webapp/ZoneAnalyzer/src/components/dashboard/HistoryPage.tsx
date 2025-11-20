import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Search, Eye, Trash2, Calendar } from 'lucide-react';
import { Badge } from '../ui/badge';
import { useTheme } from '../ThemeContext';

const mockHistory = [
  {
    id: 1,
    batchName: 'Batch 23 ต.ค. 2568 14:32',
    date: '23 ต.ค. 2568',
    time: '14:32',
    resultCount: 5,
  },
  {
    id: 2,
    batchName: 'Batch 22 ต.ค. 2568 09:15',
    date: '22 ต.ค. 2568',
    time: '09:15',
    resultCount: 6,
  },
  {
    id: 3,
    batchName: 'Batch 20 ต.ค. 2568 16:45',
    date: '20 ต.ค. 2568',
    time: '16:45',
    resultCount: 4,
  },
  {
    id: 4,
    batchName: 'Batch 18 ต.ค. 2568 11:20',
    date: '18 ต.ค. 2568',
    time: '11:20',
    resultCount: 7,
  },
];

export function HistoryPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState(mockHistory);
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);

  const handleDelete = (id: number) => {
    if (confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) {
      setHistory(history.filter(item => item.id !== id));
    }
  };

  const handleViewDetail = (id: number) => {
    setSelectedHistoryId(id);
  };

  const handleBackFromDetail = () => {
    setSelectedHistoryId(null);
  };

  // If viewing detail, show detail page
  if (selectedHistoryId !== null) {
    // Import dynamically
    const { HistoryDetailPage } = require('./HistoryDetailPage');
    return <HistoryDetailPage historyId={selectedHistoryId} onBack={handleBackFromDetail} />;
  }

  const filteredHistory = history.filter(item =>
    item.batchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.date.includes(searchQuery)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <h1 className={`text-3xl mb-8 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>ประวัติการวิเคราะห์</h1>

      <div className="mb-6">
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          <Input
            placeholder="ค้นหาจาก batch name หรือ วันที่..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={isDark ? 'pl-10 bg-gray-900 border-gray-800 text-gray-100 focus:border-blue-500' : 'pl-10 bg-white border-gray-300 text-gray-900 focus:border-blue-500'}
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredHistory.map((item) => (
          <Card key={item.id} className={`p-6 transition-colors shadow-lg ${isDark ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-shrink-0">
                <div className={`w-20 h-20 rounded-lg border flex items-center justify-center shadow-md ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="w-12 h-12 rounded-full border-2 border-blue-400 relative">
                    <div className="absolute top-1 left-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-400/40"></div>
                    <div className="absolute bottom-2 right-1 w-1.5 h-1.5 rounded-full bg-red-500 ring-2 ring-red-400/40"></div>
                  </div>
                </div>
              </div>

              <div className="flex-grow space-y-2">
                <h3 className={`text-lg ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{item.batchName}</h3>
                <div className={`flex flex-wrap items-center gap-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{item.date} เวลา {item.time}</span>
                  </div>
                  <Badge variant="outline" className={isDark ? 'border-gray-700 text-gray-300' : 'border-gray-300 text-gray-700'}>
                    {item.resultCount} รายการ
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleViewDetail(item.id)}
                  className={isDark ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750 rounded-lg' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg'}
                >
                  <Eye className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">ดูรายละเอียด</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDelete(item.id)}
                  className={isDark ? 'bg-gray-800 border-gray-700 text-red-400 hover:bg-red-950 hover:border-red-800 rounded-lg' : 'bg-white border-gray-300 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-lg'}
                >
                  <Trash2 className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">ลบ</span>
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {filteredHistory.length === 0 && (
          <Card className={`p-12 text-center shadow-lg ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>ไม่พบรายการที่ค้นหา</p>
          </Card>
        )}
      </div>
    </div>
  );
}