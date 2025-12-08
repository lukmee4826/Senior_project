import React, { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Search, Eye, Trash2, Calendar, AlertCircle, RefreshCw } from "lucide-react";
import { Badge } from "../ui/badge";
import { useTheme } from "../ThemeContext";
// เพิ่มบรรทัดนี้: Import Component โดยตรง
import { HistoryDetailPage } from "./HistoryDetailPage"; 

const mockHistory = [
  {
    id: 1,
    batchName: "Batch 23 ต.ค. 2568 14:32",
    date: "23 ต.ค. 2568",
    time: "14:32",
    resultCount: 5,
    daysUntilExpiry: 3,
  },
  {
    id: 2,
    batchName: "Batch 22 ต.ค. 2568 09:15",
    date: "22 ต.ค. 2568",
    time: "09:15",
    resultCount: 6,
    daysUntilExpiry: 15,
  },
  {
    id: 3,
    batchName: "Batch 20 ต.ค. 2568 16:45",
    date: "20 ต.ค. 2568",
    time: "16:45",
    resultCount: 4,
    daysUntilExpiry: 5,
  },
  {
    id: 4,
    batchName: "Batch 18 ต.ค. 2568 11:20",
    date: "18 ต.ค. 2568",
    time: "11:20",
    resultCount: 7,
    daysUntilExpiry: 22,
  },
];

export function HistoryPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [searchQuery, setSearchQuery] = useState("");
  const [history, setHistory] = useState(mockHistory);
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);

  const handleDelete = (id: number) => {
    if (confirm("คุณต้องการลบรายการนี้ใช่หรือไม่?")) {
      setHistory(history.filter((item) => item.id !== id));
    }
  };

  const handleViewDetail = (id: number) => {
    setSelectedHistoryId(id);
  };

  const handleBackFromDetail = () => {
    setSelectedHistoryId(null);
  };

  const handleExtendExpiry = (id: number) => {
    if (confirm("คุณต้องการต่ออายุการเก็บข้อมูลอีก 30 วันใช่หรือไม่?")) {
      setHistory(history.map((item) => 
        item.id === id 
          ? { ...item, daysUntilExpiry: item.daysUntilExpiry + 30 }
          : item
      ));
    }
  };

  // ถ้ามีการเลือกประวัติ ให้แสดงหน้ารายละเอียด
  if (selectedHistoryId !== null) {
    return (
      <HistoryDetailPage
        historyId={selectedHistoryId}
        onBack={handleBackFromDetail}
      />
    );
  }

  const filteredHistory = history.filter(
    (item) =>
      item.batchName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      item.date.includes(searchQuery),
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <h1
        className={`text-3xl mb-8 ${isDark ? "text-gray-100" : "text-gray-900"}`}
      >
        ประวัติการวิเคราะห์
      </h1>

      <div className="mb-6">
        <div className="relative">
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? "text-gray-400" : "text-gray-500"}`}
          />
          <Input
            placeholder="ค้นหาจาก batch name หรือ วันที่..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={
              isDark
                ? "pl-10 bg-gray-900 border-gray-800 text-gray-100 focus:border-blue-500"
                : "pl-10 bg-white border-gray-300 text-gray-900 focus:border-blue-500"
            }
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredHistory.map((item) => {
          const isExpiringSoon = item.daysUntilExpiry <= 7;
          
          return (
            <Card
              key={item.id}
              className={`p-6 transition-colors shadow-lg ${
                isExpiringSoon
                  ? isDark
                    ? "bg-gray-900 border-red-800 border-2 hover:border-red-700"
                    : "bg-white border-red-500 border-2 hover:border-red-400"
                  : isDark
                    ? "bg-gray-900 border-gray-800 hover:border-gray-700"
                    : "bg-white border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* Warning banner for expiring items */}
              {isExpiringSoon && (
                <div
                  className={`mb-4 p-3 rounded-lg border flex items-start gap-3 ${
                    isDark
                      ? "bg-red-950/50 border-red-800"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <AlertCircle
                    className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      isDark ? "text-red-400" : "text-red-600"
                    }`}
                  />
                  <div className="flex-grow">
                    <p
                      className={`${isDark ? "text-red-300" : "text-red-700"}`}
                    >
                      <span>
                        ข้อมูลใกล้หมดอายุ: เหลืออีก {item.daysUntilExpiry} วัน
                      </span>
                    </p>
                    <p
                      className={`text-sm mt-1 ${
                        isDark ? "text-red-400" : "text-red-600"
                      }`}
                    >
                      กดปุ่มต่ออายุเพื่อเก็บข้อมูลไว้อีก 30 วัน
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-shrink-0">
                  <div
                    className={`w-20 h-20 rounded-lg border flex items-center justify-center shadow-md ${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}
                  >
                    <div className="w-12 h-12 rounded-full border-2 border-blue-400 relative">
                      <div className="absolute top-1 left-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-400/40"></div>
                      <div className="absolute bottom-2 right-1 w-1.5 h-1.5 rounded-full bg-red-500 ring-2 ring-red-400/40"></div>
                    </div>
                  </div>
                </div>

                <div className="flex-grow space-y-2">
                  <h3
                    className={`text-lg ${isDark ? "text-gray-100" : "text-gray-900"}`}
                  >
                    {item.batchName}
                  </h3>
                  <div
                    className={`flex flex-wrap items-center gap-4 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {item.date} เวลา {item.time}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        isDark
                          ? "border-gray-700 text-gray-300"
                          : "border-gray-300 text-gray-700"
                      }
                    >
                      {item.resultCount} รายการ
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        isExpiringSoon
                          ? isDark
                            ? "border-red-700 text-red-400 bg-red-950/30"
                            : "border-red-400 text-red-700 bg-red-50"
                          : isDark
                            ? "border-gray-700 text-gray-400"
                            : "border-gray-300 text-gray-600"
                      }
                    >
                      เหลือ {item.daysUntilExpiry} วัน
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {isExpiringSoon && (
                    <Button
                      variant="outline"
                      onClick={() => handleExtendExpiry(item.id)}
                      className={
                        isDark
                          ? "bg-green-950 border-green-800 text-green-400 hover:bg-green-900 hover:border-green-700 rounded-lg"
                          : "bg-green-50 border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400 rounded-lg"
                      }
                    >
                      <RefreshCw className="w-4 h-4 md:mr-2" />
                      <span className="hidden md:inline">ต่ออายุ</span>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => handleViewDetail(item.id)}
                    className={
                      isDark
                        ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750 rounded-lg"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
                    }
                  >
                    <Eye className="w-4 h-4 md:mr-2" />
                    <span className="hidden md:inline">
                      ดูรายละเอียด
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDelete(item.id)}
                    className={
                      isDark
                        ? "bg-gray-800 border-gray-700 text-red-400 hover:bg-red-950 hover:border-red-800 rounded-lg"
                        : "bg-white border-gray-300 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-lg"
                    }
                  >
                    <Trash2 className="w-4 h-4 md:mr-2" />
                    <span className="hidden md:inline">ลบ</span>
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}

        {filteredHistory.length === 0 && (
          <Card
            className={`p-12 text-center shadow-lg ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}
          >
            <p
              className={
                isDark ? "text-gray-400" : "text-gray-600"
              }
            >
              ไม่พบรายการที่ค้นหา
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}