import React, { useState, useEffect } from 'react';
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
import { exportToXLSX } from "../../utils/exportUtils";

interface HistoryDetailPageProps {
  historyId: string;
  onBack: () => void;
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



export function HistoryDetailPage({ historyId, onBack }: HistoryDetailPageProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedImage, setSelectedImage] = useState(0);
  const [historyData, setHistoryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBatchDetail();
  }, [historyId]);

  const fetchBatchDetail = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/batches/${historyId}`);
      if (response.ok) {
        const data = await response.json();
        const mappedData = {
          id: data.batch_id,
          batchName: data.batch_name || "Untitled Batch",
          date: new Date(data.created_at).toLocaleDateString("th-TH", {
            day: "numeric", month: "short", year: "numeric"
          }),
          time: new Date(data.created_at).toLocaleTimeString("th-TH", {
            hour: '2-digit', minute: '2-digit'
          }),
          resultCount: data.plates ? data.plates.length : 0,
          images: (data.plates || []).map((plate: any, idx: number) => ({
            id: plate.plate_id,
            // Assuming we have microbe_id in the plate, we might fetch name or assume unknown for now if not populated
            // TODO: Backend should return microbe name populated or we fetch separately
            bacteria: plate.strain_code || 'unknown', // Using strain_code from DB
            result_image_url: plate.result_image_url,
            results: plate.results
          }))
        };
        setHistoryData(mappedData);
      }
    } catch (error) {
      console.error("Error fetching batch:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center">Loading...</div>;
  }

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

  const getInterpretationTooltip = (interp: string) => {
    switch (interp) {
      case "S":
        return "Sensitive - เชื้อไวต่อยา (สามารถใช้ยานี้รักษาได้)";
      case "I":
        return "Intermediate - เชื้อไวปานกลาง (อาจใช้ยานี้ได้ในบางกรณี)";
      case "R":
        return "Resistant - เชื้อดื้อยา (ไม่ควรใช้ยานี้รักษา)";
      default:
        return "";
    }
  };

  const getBacteriaName = (bacteriaValue: string) => {
    if (!bacteriaValue) return "ไม่ได้ระบุชื่อเชื้อ";
    const bacteria = bacteriaList.find((b) => b.value === bacteriaValue);
    return bacteria?.label || "ไม่ได้ระบุชื่อเชื้อ";
  };

  const currentImage = historyData.images[selectedImage];

  const handleDownload = () => {
    if (historyData) {
      exportToXLSX([historyData], `history_report_${historyData.batchName}`);
    }
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
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedImage === idx
                    ? "border-blue-500 shadow-lg shadow-blue-500/20"
                    : isDark ? "border-gray-700 hover:border-gray-600" : "border-gray-300 hover:border-gray-400"
                    }`}
                >
                  <div className={`w-full h-full flex flex-col items-center justify-center p-2 ${isDark ? "bg-gray-800" : "bg-gray-50"}`}>
                    <div className={`w-16 h-16 mb-2 rounded-md overflow-hidden bg-gray-200`}>
                      {img.result_image_url ? (
                        <img
                          src={`http://127.0.0.1:8000/uploaded_images/${img.result_image_url.split('\\').pop().split('/').pop()}`}
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
                {/* Display Image from Backend */}
                {currentImage?.result_image_url ? (
                  <img
                    src={`http://127.0.0.1:8000/uploaded_images/${currentImage.result_image_url.split('\\').pop().split('/').pop()}`}
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
          <h3 className={`text-lg mb-3 ${isDark ? "text-gray-200" : "text-gray-800"}`}>สรุปผลการวิเคราะห์</h3>

          {/* Bacteria name header */}
          <div className={`rounded-t-lg border-t border-x px-4 py-3 ${isDark ? "bg-gray-800/70 border-gray-700" : "bg-blue-50 border-gray-200"}`}>
            <h4 className={`${isDark ? "text-blue-400" : "text-blue-700"}`}>
              ชื่อเชื้อ: {currentImage.bacteria}
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
                  {currentImage?.results?.map((result: any, idx: number) => (
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
                        -
                      </TableCell>
                      <TableCell className={`text-center text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        -
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={getInterpretationColor(
                            result.clsi_interpretation || "S",
                          )}
                          title={getInterpretationTooltip(result.clsi_interpretation || "S")}
                        >
                          {getInterpretationText(
                            result.clsi_interpretation || "S",
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={getInterpretationColor(
                            result.eucast_interpretation || "S",
                          )}
                          title={getInterpretationTooltip(result.eucast_interpretation || "S")}
                        >
                          {getInterpretationText(
                            result.eucast_interpretation || "S",
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
            <Button onClick={handleDownload} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
              <Download className="w-4 h-4 mr-2" />
              ดาวน์โหลดรายงาน (XLSX)
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}