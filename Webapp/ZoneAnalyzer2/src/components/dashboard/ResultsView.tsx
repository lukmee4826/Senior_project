import React, { useState, useEffect } from "react";
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ResultsPDF } from './ResultsPDF';
import { fetchWithAuth } from '../../utils/api';
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Download, Save, Edit2, Check, X, ChevronsUpDown } from "lucide-react";
import { Input } from "../ui/input";
/*
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
*/
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
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
  hideSaveButton?: boolean;
}

// We will fetch this from the database
interface BacteriaOption {
  value: string;
  label: string;
}

export function ResultsView({
  mode,
  fileCount,
  bacteriaSelections,
  onSave,
  analysisResults,
  hideSaveButton = false,
}: ResultsViewProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [selectedImage, setSelectedImage] = useState(0);

  // Local state for results to allow immediate updates
  const [localResults, setLocalResults] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [antibiotics, setAntibiotics] = useState<any[]>([]);
  const [bacteriaList, setBacteriaList] = useState<BacteriaOption[]>([]);
  const [openPopovers, setOpenPopovers] = useState<Record<string, boolean>>({});
  const [breakpointMap, setBreakpointMap] = useState<Record<string, any>>({});

  useEffect(() => {
    setLocalResults(analysisResults);
  }, [analysisResults]);

  useEffect(() => {
    // Fetch antibiotics - filtered by current plate's microbe if editing
    const fetchAntibiotics = async (microbeName?: string) => {
      try {
        const url = microbeName
          ? `/antibiotics?microbe_name=${encodeURIComponent(microbeName)}`
          : '/antibiotics?limit=500';
        const response = await fetchWithAuth(url);
        if (response.ok) {
          const data = await response.json();
          setAntibiotics(data);
        }
      } catch (error) {
        console.error("Failed to fetch antibiotics", error);
      }
    };

    // Get microbe name from current plate
    const currentMicrobeName = localResults[selectedImage]?.plate?.strain_code;
    fetchAntibiotics(currentMicrobeName || undefined);

    const fetchMicrobes = async () => {
      try {
        const response = await fetchWithAuth('/microbes');
        if (response.ok) {
          const data = await response.json();
          const options = data.map((m: any) => ({
            value: m.strain_name,
            label: m.strain_name
          }));
          setBacteriaList([{ value: "other", label: "อื่นๆ" }, ...options]);
        }
      } catch (error) {
        console.error("Failed to fetch microbes:", error);
      }
    };
    fetchMicrobes();

    // Fetch breakpoint mm thresholds for the current plate
    const plateId = localResults[selectedImage]?.plate?.plate_id;
    if (plateId) {
      fetchWithAuth(`/plates/${plateId}/breakpoints`)
        .then(r => r.ok ? r.json() : {})
        .then(data => setBreakpointMap(data))
        .catch(() => { });
    } else {
      setBreakpointMap({});
    }
  }, [selectedImage, localResults]);

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

    // If bacteriaValue unavailable, try to get from plate data (for History view)
    if (!bacteriaValue) {
      const plate = localResults[imageIndex]?.plate;
      if (plate?.strain_code) {
        return plate.strain_code; // This might be "E. coli" string directly if logic changed
      }
      return "ไม่ได้ระบุชื่อเชื้อ";
    }
    const bacteria = bacteriaList.find((b) => b.value === bacteriaValue);
    return bacteria?.label || bacteriaValue; // Fallback to raw value
  };

  const handleDownload = () => {
    // Format data for export
    const exportData = localResults.map((result, index) => ({
      batchName: "Analysis Export",
      date: new Date().toLocaleDateString("th-TH"),
      time: new Date().toLocaleTimeString("th-TH"),
      plate: {
        ...result.plate,
        strain_code: getBacteriaName(index)
      }
    }));
    exportToXLSX(exportData, "analysis_report");
  };

  const handleUpdateResult = async (resultId: string, field: "antibiotic_id" | "diameter_mm", value: any) => {
    try {
      const response = await fetchWithAuth(`/results/${resultId}`, {
        method: 'PUT',
        body: JSON.stringify({
          [field]: value
        }),
      });

      if (response.ok) {
        const updatedResult = await response.json();

        // Update local state
        setLocalResults(prev => {
          const newResults = [...prev];
          const plateIndex = selectedImage; // Assumption: we are editing current image's results
          // Actually need to find which plate contains this result
          // Better: iterate all plates to finding the result 

          // Simpler: assume selectedImage is correct context, but let's be safe
          for (let i = 0; i < newResults.length; i++) {
            const plate = newResults[i].plate;
            const resultIdx = plate.results.findIndex((r: any) => r.result_id === resultId);
            if (resultIdx !== -1) {
              // Replace result
              // Need to merge full antibiotic object if changed? 
              // The API returns the updated result, usually with populated antibiotic (if query does eager load)
              // But our API returns PlateResult schema which has antibiotic optional.
              // Let's ensure we update correctly.

              // The `updated_result` JSON likely has antibiotic_id, diameter, interpretation.
              // It might NOT have the full `antibiotic` object unless we eager load it in backend `update_plate_result` return.
              // Current backend returns `crud.update_plate_result` -> `result`. 
              // `PlateResult` schema includes `antibiotic: Optional[Antibiotic]`.
              // If we `db.refresh(result)`, does it load relationship? default lazy.
              // Frontend needs `antibiotic.name`. 

              // Hack: if antibiotic changed, find it in `antibiotics` list to update name locally.
              let completeResult = { ...newResults[i].plate.results[resultIdx], ...updatedResult };

              if (field === "antibiotic_id") {
                const ab = antibiotics.find(a => a.antibiotic_id === value);
                if (ab) {
                  completeResult.antibiotic = ab;
                }
              }

              newResults[i].plate.results[resultIdx] = completeResult;
              break;
            }
          }
          return newResults;
        });
      }
    } catch (error) {
      console.error("Failed to update result:", error);
    }
  };

  const currentPlate = localResults[selectedImage]?.plate;

  return (
    <Card className={`p - 6 shadow - xl ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"} `}>
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text - 2xl ${isDark ? "text-gray-100" : "text-gray-900"} `}>
          ผลการวิเคราะห์
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setEditing(!editing)}
            className={isEditing => editing
              ? "bg-green-100 text-green-700 border-green-300 hover:bg-green-200"
              : ""}
          >
            {editing ? <Check className="w-4 h-4 mr-2" /> : <Edit2 className="w-4 h-4 mr-2" />}
            {editing ? "เสร็จสิ้น" : "แก้ไขผล"}
          </Button>
        </div>
      </div>

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
                  {localResults[idx]?.plate?.result_image_url ? (
                    <img
                      src={`http://127.0.0.1:8000/uploaded_images/${localResults[idx].plate.result_image_url.split('\\').pop().split('/').pop()}`}
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
              {currentPlate?.result_image_url ? (
                <img
                  src={`http://127.0.0.1:8000/uploaded_images/${currentPlate.result_image_url.split('\\').pop().split('/').pop()}`}
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
          {(!currentPlate?.results || currentPlate.results.length === 0) ? (
            <div className="p-8 text-center text-red-500 font-medium">
              No Antibiotic Disk Detected
            </div>
          ) : (
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
                  {currentPlate.results.map((result: any, idx: number) => (
                    <TableRow
                      key={idx}
                      className={isDark ? "border-gray-700 hover:bg-gray-750" : "border-gray-200 hover:bg-gray-50"}
                    >
                      <TableCell className={isDark ? "text-gray-200" : "text-gray-900"}>
                        {editing ? (
                          <Popover
                            open={openPopovers[result.result_id] || false}
                            onOpenChange={(open) => {
                              setOpenPopovers(prev => ({ ...prev, [result.result_id]: open }));
                            }}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openPopovers[result.result_id] || false}
                                className="w-[180px] justify-between h-8 px-2 text-sm font-normal"
                              >
                                <span className="truncate">
                                  {result.antibiotic?.name || "เลือกชื่อยา"}
                                </span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[250px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="ค้นหาชื่อยา..." />
                                <CommandList>
                                  <CommandEmpty>ไม่พบชื่อยา</CommandEmpty>
                                  <CommandGroup className="max-h-[300px] overflow-y-auto">
                                    {antibiotics.map((ab) => (
                                      <CommandItem
                                        key={ab.antibiotic_id}
                                        value={ab.name}
                                        onSelect={() => {
                                          handleUpdateResult(result.result_id, "antibiotic_id", ab.antibiotic_id);
                                          setOpenPopovers(prev => ({ ...prev, [result.result_id]: false }));
                                        }}
                                      >
                                        <Check
                                          className={`mr-2 h-4 w-4 ${result.antibiotic?.antibiotic_id === ab.antibiotic_id ? "opacity-100" : "opacity-0"}`}
                                        />
                                        {ab.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          result.antibiotic?.name || "Unknown"
                        )}
                      </TableCell>
                      <TableCell className={`text-center ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        {result.antibiotic?.abbreviation || (result.antibiotic?.name ? result.antibiotic.name.substring(0, 3).toUpperCase() : "-")}
                      </TableCell>
                      <TableCell className={`text-center ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        {result.antibiotic?.concentration_ug || "-"}
                      </TableCell>
                      <TableCell className={`text-center ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        {editing ? (
                          <Input
                            type="number"
                            className="w-20 h-8 mx-auto text-center"
                            defaultValue={result.diameter_mm.toFixed(1)}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val) && val !== result.diameter_mm) {
                                handleUpdateResult(result.result_id, "diameter_mm", val);
                              }
                            }}
                          />
                        ) : (
                          result.diameter_mm.toFixed(1)
                        )}
                      </TableCell>
                      <TableCell className={`text-center text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        {(() => {
                          const bp = breakpointMap[String(result.result_id)]?.clsi;
                          if (!bp) return <span className="opacity-40">—</span>;
                          return (
                            <span className="space-x-1">
                              {bp.susceptible_min_mm != null && <span className="text-green-500">S≥{bp.susceptible_min_mm}</span>}
                              {bp.intermediate_min_mm != null && bp.intermediate_max_mm != null && <span className="text-yellow-500">I:{bp.intermediate_min_mm}-{bp.intermediate_max_mm}</span>}
                              {bp.resistant_max_mm != null && <span className="text-red-500">R≤{bp.resistant_max_mm}</span>}
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell className={`text-center text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        {(() => {
                          const bp = breakpointMap[String(result.result_id)]?.eucast;
                          if (!bp) return <span className="opacity-40">—</span>;
                          return (
                            <span className="space-x-1">
                              {bp.susceptible_min_mm != null && <span className="text-green-500">S≥{bp.susceptible_min_mm}</span>}
                              {bp.intermediate_min_mm != null && bp.intermediate_max_mm != null && <span className="text-yellow-500">I:{bp.intermediate_min_mm}-{bp.intermediate_max_mm}</span>}
                              {bp.resistant_max_mm != null && <span className="text-red-500">R≤{bp.resistant_max_mm}</span>}
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={getInterpretationColor(
                            result.clsi_interpretation || "Unknown"
                          )}
                        >
                          {getInterpretationText(
                            result.clsi_interpretation || "Unknown"
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={getInterpretationColor(
                            result.eucast_interpretation || "Unknown"
                          )}
                        >
                          {getInterpretationText(
                            result.eucast_interpretation || "Unknown"
                          )}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
          <Button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
            <Download className="w-4 h-4 mr-2" />
            ดาวน์โหลดรายงาน (XLSX)
          </Button>
          {!hideSaveButton && (
            <Button
              onClick={onSave}
              variant="outline"
              className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750 rounded-lg"
            >
              <Save className="w-4 h-4 mr-2" />
              บันทึกลงในประวัติ
            </Button>
          )}
        </div>
      </div>
    </Card >
  );
}