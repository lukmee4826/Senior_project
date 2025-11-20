import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Download, ArrowLeft } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';
import { useTheme } from '../ThemeContext';
import * as XLSX from 'xlsx';

interface HistoryDetailPageProps {
  historyId: number;
  onBack: () => void;
}

// รายการชื่อเชื้อ
const bacteriaList = [
  { value: "e-coli", label: "E. coli (Escherichia coli)" },
  { value: "s-aureus", label: "S. aureus (Staphylococcus aureus)" },
  { value: "mrsa", label: "MRSA (Methicillin-resistant S. aureus)" },
  { value: "p-aeruginosa", label: "P. aeruginosa (Pseudomonas aeruginosa)" },
  { value: "k-pneumoniae", label: "K. pneumoniae (Klebsiella pneumoniae)" },
  { value: "a-baumannii", label: "A. baumannii (Acinetobacter baumannii)" },
  { value: "enterococcus", label: "Enterococcus spp." },
  { value: "salmonella", label: "Salmonella spp." },
  { value: "s-pneumoniae", label: "S. pneumoniae (Streptococcus pneumoniae)" },
  { value: "h-influenzae", label: "H. influenzae (Haemophilus influenzae)" },
  { value: "n-gonorrhoeae", label: "N. gonorrhoeae (Neisseria gonorrhoeae)" },
  { value: "c-albicans", label: "C. albicans (Candida albicans)" },
  { value: "other", label: "อื่นๆ" },
];

// Mock Results (ข้อมูลจำลองสำหรับยา)
const mockResults = [
  {
    drugName: "Ampicillin",
    drugCode: "AMP",
    drugDose: "10",
    breakpointCLSI: "S≥17, I=14-16, R≤13",
    breakpointEUCAST: "S≥14, R<14",
    zoneMM: 12,
    sirCLSI: "R",
    sirEUCAST: "R",
  },
  {
    drugName: "Ciprofloxacin",
    drugCode: "CIP",
    drugDose: "5",
    breakpointCLSI: "S≥21, I=16-20, R≤15",
    breakpointEUCAST: "S≥25, I=22-24, R≤21",
    zoneMM: 18,
    sirCLSI: "I",
    sirEUCAST: "R",
  },
  {
    drugName: "Gentamicin",
    drugCode: "GEN",
    drugDose: "10",
    breakpointCLSI: "S≥15, I=13-14, R≤12",
    breakpointEUCAST: "S≥17, R<17",
    zoneMM: 22,
    sirCLSI: "S",
    sirEUCAST: "S",
  },
  {
    drugName: "Tetracycline",
    drugCode: "TET",
    drugDose: "30",
    breakpointCLSI: "S≥15, I=12-14, R≤11",
    breakpointEUCAST: "S≥16, I=13-15, R≤12",
    zoneMM: 14,
    sirCLSI: "I",
    sirEUCAST: "I",
  },
  {
    drugName: "Ceftriaxone",
    drugCode: "CRO",
    drugDose: "30",
    breakpointCLSI: "S≥23, I=20-22, R≤19",
    breakpointEUCAST: "S≥25, I=22-24, R≤21",
    zoneMM: 32,
    sirCLSI: "S",
    sirEUCAST: "S",
  },
  {
    drugName: "Amoxicillin-Clavulanate",
    drugCode: "AMC",
    drugDose: "20/10",
    breakpointCLSI: "S≥18, I=14-17, R≤13",
    breakpointEUCAST: "S≥19, R<19",
    zoneMM: 16,
    sirCLSI: "I",
    sirEUCAST: "R",
  },
];

// Mock history data detail
const mockHistoryDetail: Record<number, any> = {
  1: {
    id: 1,
    batchName: 'Batch 23 ต.ค. 2568 14:32',
    date: '23 ต.ค. 2568',
    time: '14:32',
    resultCount: 5,
    images: [
      { id: 1, bacteria: 'e-coli' },
      { id: 2, bacteria: 's-aureus' },
      { id: 3, bacteria: 'e-coli' },
      { id: 4, bacteria: 'p-aeruginosa' },
      { id: 5, bacteria: 'k-pneumoniae' },
    ]
  },
  2: {
    id: 2,
    batchName: 'Batch 22 ต.ค. 2568 09:15',
    date: '22 ต.ค. 2568',
    time: '09:15',
    resultCount: 6,
    images: [
      { id: 1, bacteria: 's-aureus' },
      { id: 2, bacteria: 's-aureus' },
      { id: 3, bacteria: 'mrsa' },
      { id: 4, bacteria: 's-aureus' },
      { id: 5, bacteria: 's-aureus' },
      { id: 6, bacteria: 's-aureus' },
    ]
  },
  3: {
    id: 3,
    batchName: 'Batch 20 ต.ค. 2568 16:45',
    date: '20 ต.ค. 2568',
    time: '16:45',
    resultCount: 4,
    images: [
      { id: 1, bacteria: 'p-aeruginosa' },
      { id: 2, bacteria: 'p-aeruginosa' },
      { id: 3, bacteria: 'k-pneumoniae' },
      { id: 4, bacteria: 'p-aeruginosa' },
    ]
  },
  4: {
    id: 4,
    batchName: 'Batch 18 ต.ค. 2568 11:20',
    date: '18 ต.ค. 2568',
    time: '11:20',
    resultCount: 7,
    images: [
      { id: 1, bacteria: 's-aureus' },
      { id: 2, bacteria: 's-aureus' },
      { id: 3, bacteria: 'mrsa' },
      { id: 4, bacteria: 's-aureus' },
      { id: 5, bacteria: 's-aureus' },
      { id: 6, bacteria: 'enterococcus' },
      { id: 7, bacteria: 's-aureus' },
    ]
  },
};

export function HistoryDetailPage({ historyId, onBack }: HistoryDetailPageProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedImage, setSelectedImage] = useState(0);

  const historyData = mockHistoryDetail[historyId];

  if (!historyData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
        <Button
          onClick={onBack}
          variant="outline"
          className={`mb-6 ${isDark ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          กลับ
        </Button>
        <Card className={`p-12 text-center shadow-lg ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>ไม่พบข้อมูล</p>
        </Card>
      </div>
    );
  }

  const currentImage = historyData.images[selectedImage];

  const getInterpretationColor = (interp: string) => {
    switch (interp) {
      case "S":
        return "bg-green-600 hover:bg-green-600";
      case "I":
        return "bg-yellow-600 hover:bg-yellow-600";
      case "R":
        return "bg-red-600 hover:bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  const getInterpretationText = (interp: string) => {
    switch (interp) {
      case "S":
        return "Sensitive";
      case "I":
        return "Intermediate";
      case "R":
        return "Resistant";
      default:
        return interp;
    }
  };

  const getBacteriaName = (bacteriaValue: string) => {
    if (!bacteriaValue) return "ไม่ได้ระบุชื่อเชื้อ";
    const bacteria = bacteriaList.find((b) => b.value === bacteriaValue);
    return bacteria?.label || "ไม่ได้ระบุชื่อเชื้อ";
  };

  // --- ฟังก์ชัน Export Excel (Updated) ---
  const handleExportExcel = () => {
    // 1. สร้าง Workbook ใหม่
    const wb = XLSX.utils.book_new();
    
    // 2. สร้าง Array สำหรับเก็บข้อมูลทั้งหมดที่จะใส่ใน Sheet เดียว
    const wsData: any[][] = [];

    // --- ส่วน Header หลักของไฟล์ ---
    wsData.push(["AST ANALYSIS REPORT"]);
    wsData.push([""]); // เว้นบรรทัด
    wsData.push(["Batch Name:", historyData.batchName]);
    wsData.push(["Date:", historyData.date]);
    wsData.push(["Time:", historyData.time]);
    wsData.push(["Total Images:", historyData.images.length]);
    wsData.push([""]); 
    wsData.push([""]); 

    // 3. วนลูปสร้างข้อมูลสำหรับ *ทุกภาพ* ใน Batch
    historyData.images.forEach((img: any, index: number) => {
      // Header ของแต่ละภาพ
      wsData.push([`Image No.:`, index + 1]);
      wsData.push([`Bacteria:`, getBacteriaName(img.bacteria)]);
      wsData.push([""]); // เว้นบรรทัดก่อนเริ่มตาราง

      // หัวตาราง
      const tableHeader = [
        "Drug Name", 
        "Code", 
        "Dose (µg)", 
        "Zone (mm)", 
        "CLSI Breakpoints", 
        "EUCAST Breakpoints", 
        "CLSI Result", 
        "EUCAST Result"
      ];
      wsData.push(tableHeader);

      // ข้อมูลในตาราง (ในแอปจริง ข้อมูล results จะต้องผูกกับ img แต่ละตัว)
      // ในตัวอย่างนี้เราใช้ mockResults ซ้ำๆ เพื่อแสดงผลลัพธ์
      mockResults.forEach(r => {
        wsData.push([
          r.drugName, 
          r.drugCode, 
          r.drugDose, 
          r.zoneMM, 
          r.breakpointCLSI, 
          r.breakpointEUCAST, 
          r.sirCLSI, 
          r.sirEUCAST
        ]);
      });

      // เว้นบรรทัดระหว่างภาพ เพื่อความสวยงาม และเตรียมพร้อมสำหรับภาพถัดไป
      wsData.push([""]);
      wsData.push([""]);
      wsData.push(["------------------------------------------------------------"]); // เส้นคั่น (Optional)
      wsData.push([""]);
    });

    // 4. สร้าง Worksheet จากข้อมูลที่รวมมาทั้งหมด
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // จัดความกว้างคอลัมน์
    ws['!cols'] = [
      { wch: 25 }, // Drug Name
      { wch: 10 }, // Code
      { wch: 10 }, // Dose
      { wch: 10 }, // Zone
      { wch: 25 }, // CLSI BP
      { wch: 25 }, // EUCAST BP
      { wch: 10 }, // CLSI Res
      { wch: 10 }, // EUCAST Res
    ];

    // 5. เพิ่ม Sheet ลงใน Workbook และบันทึกไฟล์
    XLSX.utils.book_append_sheet(wb, ws, "Full Report");
    
    const safeBatchName = historyData.batchName.replace(/[^a-z0-9ก-๙]/gi, '_');
    XLSX.writeFile(wb, `AST_Report_${safeBatchName}_All.xlsx`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <Button
        onClick={onBack}
        variant="outline"
        className={`mb-6 ${isDark ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        กลับ
      </Button>

      <Card className={`p-6 shadow-xl ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
        <div className="mb-6">
          <h1 className={`text-3xl mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            {historyData.batchName}
          </h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            วิเคราะห์เมื่อ: {historyData.date} เวลา {historyData.time}
          </p>
        </div>

        {historyData.images.length > 1 && (
          <div className="mb-6">
            <h3 className={`text-lg mb-3 ${isDark ? "text-gray-200" : "text-gray-800"}`}>
              เลือกภาพจานเพาะเชื้อ ({historyData.images.length} รายการ)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {historyData.images.map((img: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === idx
                      ? "border-blue-500 shadow-lg shadow-blue-500/20"
                      : isDark ? "border-gray-700 hover:border-gray-600" : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className={`w-full h-full flex items-center justify-center ${isDark ? "bg-gray-800" : "bg-gray-50"}`}>
                    <div className="text-center">
                      <div className={`w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center ${isDark ? "bg-gray-700" : "bg-gray-200"}`}>
                        <div className="w-12 h-12 rounded-full border-2 border-blue-400 relative">
                          <div className="absolute top-1 left-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-400/40"></div>
                          <div className="absolute bottom-2 right-1 w-1.5 h-1.5 rounded-full bg-red-500 ring-2 ring-red-400/40"></div>
                        </div>
                      </div>
                      <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        รูปภาพที่ {idx + 1}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ภาพผลลัพธ์ */}
        <div className="mb-6">
          <h3 className={`text-lg mb-3 ${isDark ? "text-gray-200" : "text-gray-800"}`}>
            ภาพผลลัพธ์การวิเคราะห์
          </h3>
          <div className={`aspect-square max-w-2xl mx-auto rounded-lg overflow-hidden border shadow-lg ${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
            <div className="w-full h-full flex items-center justify-center p-8">
              <div className="relative w-full max-w-sm aspect-square">
                {/* Petri dish */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 border-4 border-gray-600 shadow-2xl"></div>

                {/* Clear zones with detection circles */}
                <div className="absolute top-1/4 left-1/4 w-16 h-16">
                  <div className="w-full h-full rounded-full bg-red-400/30 ring-4 ring-green-500 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-red-500/60"></div>
                  </div>
                </div>

                <div className="absolute top-1/3 right-1/4 w-20 h-20">
                  <div className="w-full h-full rounded-full bg-red-400/30 ring-4 ring-blue-500 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-red-500/60"></div>
                  </div>
                </div>

                <div className="absolute bottom-1/4 left-1/3 w-14 h-14">
                  <div className="w-full h-full rounded-full bg-red-400/30 ring-4 ring-green-500 flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full bg-red-500/60"></div>
                  </div>
                </div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12">
                  <div className="w-full h-full rounded-full bg-red-400/30 ring-4 ring-yellow-500 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-red-500/60"></div>
                  </div>
                </div>

                <div className="absolute bottom-1/3 right-1/3 w-18 h-18">
                  <div className="w-full h-full rounded-full bg-red-400/30 ring-4 ring-green-500 flex items-center justify-center">
                    <div className="w-9 h-9 rounded-full bg-red-500/60"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ตารางสรุปผล */}
        <div>
          <h3 className={`text-lg mb-3 ${isDark ? "text-gray-200" : "text-gray-800"}`}>สรุปผลการวิเคราะห์</h3>
          
          {/* Bacteria name header */}
          <div className={`rounded-t-lg border-t border-x px-4 py-3 ${isDark ? "bg-gray-800/70 border-gray-700" : "bg-blue-50 border-gray-200"}`}>
            <h4 className={`${isDark ? "text-blue-400" : "text-blue-700"}`}>
              ชื่อเชื้อ: {getBacteriaName(currentImage.bacteria)}
            </h4>
          </div>

          <div className={`rounded-b-lg border overflow-hidden shadow-lg ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10">
                  <TableRow className={isDark ? "border-gray-700 hover:bg-gray-800" : "border-gray-200 hover:bg-gray-50"}>
                    <TableHead className={`sticky top-0 ${isDark ? "text-gray-300 bg-gray-800" : "text-gray-700 bg-white"}`}>
                      ชื่อยา
                    </TableHead>
                    <TableHead className={`text-center sticky top-0 ${isDark ? "text-gray-300 bg-gray-800" : "text-gray-700 bg-white"}`}>
                      โค้ดยา
                    </TableHead>
                    <TableHead className={`text-center sticky top-0 ${isDark ? "text-gray-300 bg-gray-800" : "text-gray-700 bg-white"}`}>
                      ขนาดยา (µg)
                    </TableHead>
                    <TableHead className={`text-center sticky top-0 ${isDark ? "text-gray-300 bg-gray-800" : "text-gray-700 bg-white"}`}>
                      ขนาด Zone (mm)
                    </TableHead>
                    <TableHead className={`text-center sticky top-0 ${isDark ? "text-gray-300 bg-gray-800" : "text-gray-700 bg-white"}`}>
                      Breakpoint (CLSI)
                    </TableHead>
                    <TableHead className={`text-center sticky top-0 ${isDark ? "text-gray-300 bg-gray-800" : "text-gray-700 bg-white"}`}>
                      Breakpoint (EUCAST)
                    </TableHead>
                    <TableHead className={`text-center sticky top-0 ${isDark ? "text-gray-300 bg-gray-800" : "text-gray-700 bg-white"}`}>
                      แปลผล CLSI
                    </TableHead>
                    <TableHead className={`text-center sticky top-0 ${isDark ? "text-gray-300 bg-gray-800" : "text-gray-700 bg-white"}`}>
                      แปลผล EUCAST
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockResults.map((result, idx) => (
                    <TableRow
                      key={idx}
                      className={isDark ? "border-gray-700 hover:bg-gray-750" : "border-gray-200 hover:bg-gray-50"}
                    >
                      <TableCell className={isDark ? "text-gray-200" : "text-gray-900"}>
                        {result.drugName}
                      </TableCell>
                      <TableCell className={`text-center ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        {result.drugCode}
                      </TableCell>
                      <TableCell className={`text-center ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        {result.drugDose}
                      </TableCell>
                      <TableCell className={`text-center ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        {result.zoneMM}
                      </TableCell>
                      <TableCell className={`text-center text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        {result.breakpointCLSI}
                      </TableCell>
                      <TableCell className={`text-center text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        {result.breakpointEUCAST}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={getInterpretationColor(
                            result.sirCLSI,
                          )}
                        >
                          {getInterpretationText(
                            result.sirCLSI,
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={getInterpretationColor(
                            result.sirEUCAST,
                          )}
                        >
                          {getInterpretationText(
                            result.sirEUCAST,
                          )}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="mt-6">
            <Button 
              onClick={handleExportExcel}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              <Download className="w-4 h-4 mr-2" />
              ดาวน์โหลดรายงานรวม (XLSX)
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}