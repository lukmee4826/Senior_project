import React, { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Download, Save } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { useTheme } from "../ThemeContext";

interface ResultsViewProps {
  mode: "single" | "batch";
  fileCount: number;
  bacteriaSelections: Record<number, string>;
  onSave: () => void;
}

// รายการชื่อเชื้อ
const bacteriaList = [
  { value: "e-coli", label: "E. coli (Escherichia coli)" },
  {
    value: "s-aureus",
    label: "S. aureus (Staphylococcus aureus)",
  },
  {
    value: "mrsa",
    label: "MRSA (Methicillin-resistant S. aureus)",
  },
  {
    value: "p-aeruginosa",
    label: "P. aeruginosa (Pseudomonas aeruginosa)",
  },
  {
    value: "k-pneumoniae",
    label: "K. pneumoniae (Klebsiella pneumoniae)",
  },
  {
    value: "a-baumannii",
    label: "A. baumannii (Acinetobacter baumannii)",
  },
  { value: "enterococcus", label: "Enterococcus spp." },
  { value: "salmonella", label: "Salmonella spp." },
  {
    value: "s-pneumoniae",
    label: "S. pneumoniae (Streptococcus pneumoniae)",
  },
  {
    value: "h-influenzae",
    label: "H. influenzae (Haemophilus influenzae)",
  },
  {
    value: "n-gonorrhoeae",
    label: "N. gonorrhoeae (Neisseria gonorrhoeae)",
  },
  {
    value: "c-albicans",
    label: "C. albicans (Candida albicans)",
  },
  { value: "other", label: "อื่นๆ" },
];

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

export function ResultsView({
  mode,
  fileCount,
  bacteriaSelections,
  onSave,
}: ResultsViewProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [selectedImage, setSelectedImage] = useState(0);

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

  // Get bacteria name for current selected image
  const getBacteriaName = (imageIndex: number) => {
    const bacteriaValue = bacteriaSelections[imageIndex];
    if (!bacteriaValue) return "ไม่ได้ระบุชื่อเชื้อ";
    const bacteria = bacteriaList.find((b) => b.value === bacteriaValue);
    return bacteria?.label || "ไม่ได้ระบุชื่อเชื้อ";
  };

  return (
    <Card className={`p-6 shadow-xl ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
      <h2 className={`text-2xl mb-6 ${isDark ? "text-gray-100" : "text-gray-900"}`}>
        ผลการวิเคราะห์
      </h2>

      {mode === "batch" && fileCount > 1 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: fileCount }).map((_, idx) => (
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
      )}

      {/* ภาพผลลัพธ์ */}
      <div className="mb-6">
        <h3 className={`text-lg mb-3 ${isDark ? "text-gray-200" : "text-gray-800"}`}>
          ภาพผลลัพธ์
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
        <h3 className={`text-lg mb-3 ${isDark ? "text-gray-200" : "text-gray-800"}`}>สรุปผล</h3>
        
        {/* Bacteria name header */}
        <div className={`rounded-t-lg border-t border-x px-4 py-3 ${isDark ? "bg-gray-800/70 border-gray-700" : "bg-blue-50 border-gray-200"}`}>
          <h4 className={`${isDark ? "text-blue-400" : "text-blue-700"}`}>
            ชื่อเชื้อ: {getBacteriaName(selectedImage)}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
            <Download className="w-4 h-4 mr-2" />
            ดาวน์โหลดรายงาน (XLSX)
          </Button>
          <Button
            onClick={onSave}
            variant="outline"
            className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750 rounded-lg"
          >
            <Save className="w-4 h-4 mr-2" />
            บันทึกลงในประวัติ
          </Button>
        </div>
      </div>
    </Card>
  );
}