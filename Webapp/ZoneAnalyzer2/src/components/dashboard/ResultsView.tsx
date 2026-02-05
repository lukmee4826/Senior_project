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
import { exportToXLSX } from "../../utils/exportUtils";

interface ResultsViewProps {
  mode: "single" | "batch";
  fileCount: number;
  bacteriaSelections: Record<number, string>;
  onSave: () => void;
  analysisResults: any[];
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

// Mock results removed

export function ResultsView({
  mode,
  fileCount,
  bacteriaSelections,
  onSave,
  analysisResults,
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

  const handleDownload = () => {
    // Format data for export
    const exportData = analysisResults.map((result, index) => ({
      batchName: "Current Analysis",
      date: new Date().toLocaleDateString("th-TH"),
      time: new Date().toLocaleTimeString("th-TH"),
      plate: {
        ...result.plate,
        strain_code: getBacteriaName(index)
      }
    }));
    exportToXLSX(exportData, "analysis_report");
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
              className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedImage === idx
                ? "border-blue-500 shadow-lg shadow-blue-500/20"
                : isDark ? "border-gray-700 hover:border-gray-600" : "border-gray-300 hover:border-gray-400"
                }`}
            >
              <div className={`w-full h-full flex flex-col items-center justify-center p-2 ${isDark ? "bg-gray-800" : "bg-gray-50"}`}>
                <div className={`w-16 h-16 mb-2 rounded-md overflow-hidden bg-gray-200`}>
                  {analysisResults[idx]?.plate?.result_image_url ? (
                    <img
                      src={`http://127.0.0.1:8000/uploaded_images/${analysisResults[idx].plate.result_image_url.split('\\').pop().split('/').pop()}`}
                      alt={`Plate ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                  )}
                </div>
                <p className={`text-xs truncate max-w-full px-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  รูปภาพที่ {idx + 1}
                </p>
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
              {/* Display Image from Backend */}
              {analysisResults[selectedImage]?.plate?.result_image_url ? (
                <img
                  src={`http://127.0.0.1:8000/uploaded_images/${analysisResults[selectedImage].plate.result_image_url.split('\\').pop().split('/').pop()}`}
                  alt="Analyzed Plate"
                  className="w-full h-full object-contain rounded-lg shadow-md"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">No Image Available</div>
              )}
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
                {(analysisResults[selectedImage]?.plate?.results || []).map((result: any, idx: number) => (
                  <TableRow
                    key={idx}
                    className={isDark ? "border-gray-700 hover:bg-gray-750" : "border-gray-200 hover:bg-gray-50"}
                  >
                    <TableCell className={isDark ? "text-gray-200" : "text-gray-900"}>
                      {result.antibiotic?.name || "Unknown"}
                    </TableCell>
                    <TableCell className={`text-center ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      {result.antibiotic?.name ? result.antibiotic.name.substring(0, 3).toUpperCase() : "-"}
                    </TableCell>
                    <TableCell className={`text-center ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      {result.antibiotic?.concentration_ug || "-"}
                    </TableCell>
                    <TableCell className={`text-center ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      {result.diameter_mm.toFixed(1)}
                    </TableCell>
                    <TableCell className={`text-center text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      - {/* TODO: Add breakpoints to API response */}
                    </TableCell>
                    <TableCell className={`text-center text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      -
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={getInterpretationColor(
                          result.clsi_interpretation || "S" // Default or actual
                        )}
                      >
                        {getInterpretationText(
                          result.clsi_interpretation || "S"
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={getInterpretationColor(
                          result.eucast_interpretation || "S"
                        )}
                      >
                        {getInterpretationText(
                          result.eucast_interpretation || "S"
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
          <Button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
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