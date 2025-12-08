import React, { useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import {
  Upload,
  FileImage,
  Check,
  ChevronsUpDown,
  X,
  Camera,
} from "lucide-react";
import { ResultsView } from "./ResultsView";
import { Progress } from "../ui/progress";
import { useTheme } from "../ThemeContext";
import { CameraCapture } from "./CameraCapture";
import { Checkbox } from "../ui/checkbox";
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

export function AnalysisDashboard() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const mode = "batch"; // ใช้โหมด batch เท่านั้น
  const [uploadedFiles, setUploadedFiles] = useState<File[]>(
    [],
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] =
    useState(false);
  const [progress, setProgress] = useState(0);
  const [model, setModel] = useState("yolov7");
  const [bacteriaSelections, setBacteriaSelections] = useState<
    Record<number, string>
  >({});
  const [openPopovers, setOpenPopovers] = useState<
    Record<number, boolean>
  >({});
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Multi-select states
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [groupBacteria, setGroupBacteria] = useState<string>("");
  const [groupPopoverOpen, setGroupPopoverOpen] = useState(false);

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadedFiles(files);
      setAnalysisComplete(false);
      // Reset bacteria selections
      setBacteriaSelections({});
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files);
      setUploadedFiles(files);
      setAnalysisComplete(false);
      // Reset bacteria selections
      setBacteriaSelections({});
    }
  };

  const handleRemoveFile = (idx: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== idx);
    setUploadedFiles(newFiles);
    // Remove bacteria selection for this file
    const newSelections = { ...bacteriaSelections };
    delete newSelections[idx];
    // Reindex selections
    const reindexed: Record<number, string> = {};
    Object.keys(newSelections).forEach((key) => {
      const oldIdx = parseInt(key);
      const newIdx = oldIdx > idx ? oldIdx - 1 : oldIdx;
      reindexed[newIdx] = newSelections[oldIdx];
    });
    setBacteriaSelections(reindexed);
  };

  const handleAnalyze = () => {
    // ตรวจสอบว่าได้เลือกเชื้อสำหรับทุกไฟล์แล้วหรือยัง
    const unselectedFiles = uploadedFiles
      .map((file, idx) => (!bacteriaSelections[idx] ? idx + 1 : null))
      .filter((idx) => idx !== null);

    if (unselectedFiles.length > 0) {
      alert(
        `กรุณาเลือกชื่อเชื้อสำหรับไฟล์ที่ ${unselectedFiles.join(", ")} ก่อนเริ่มการวิเคราะห์`
      );
      return;
    }

    setAnalyzing(true);
    setProgress(0);

    // Simulate analysis progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setAnalyzing(false);
          setAnalysisComplete(true);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleSave = () => {
    alert("บันทึกลงในประวัติเรียบร้อยแล้ว");
  };

  const handleCameraCapture = (file: File) => {
    setUploadedFiles(prev => [...prev, file]);
    setAnalysisComplete(false);
  };

  const handleCheckboxChange = (idx: number) => {
    if (selectedFiles.includes(idx)) {
      setSelectedFiles(selectedFiles.filter(id => id !== idx));
    } else {
      setSelectedFiles([...selectedFiles, idx]);
    }
  };

  const handleGroupBacteriaChange = (value: string) => {
    setGroupBacteria(value);
  };

  const handleGroupAnalyze = () => {
    if (selectedFiles.length === 0) {
      alert("กรุณาเลือกไฟล์ที่ต้องการวิเคราะห์");
      return;
    }

    // ตรวจสอบว่าได้เลือกเชื้อสำหรับทุกไฟล์ที่เลือกแล้วหรือยัง
    const unselectedFiles = selectedFiles
      .map(idx => (!bacteriaSelections[idx] ? idx + 1 : null))
      .filter((idx) => idx !== null);

    if (unselectedFiles.length > 0) {
      alert(
        `กรุณาเลือกชื่อเชื้อสำหรับไฟล์ที่ ${unselectedFiles.join(", ")} ก่อนเริ่มการวิเคราะห์`
      );
      return;
    }

    setAnalyzing(true);
    setProgress(0);

    // Simulate analysis progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setAnalyzing(false);
          setAnalysisComplete(true);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  return (
    <>
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <h1
        className={`text-3xl mb-8 ${isDark ? "text-gray-100" : "text-gray-900"}`}
      >
        วิเคราะห์ภาพถ่ายจานเพาะเชื้อ
      </h1>

      <Card
        className={`p-6 mb-6 shadow-xl ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}
      >
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={`border-2 border-dashed rounded-lg p-12 text-center hover:border-blue-500 transition-colors ${isDark ? "border-gray-700 bg-gray-800/50" : "border-gray-300 bg-gray-50"}`}
        >
          <Upload
            className={`w-16 h-16 mx-auto mb-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}
          />
          <p
            className={`mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}
          >
            ลากไฟล์มาวางที่นี่ หรือ
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className={
                isDark
                  ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750 rounded-lg"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
              }
            >
              เลือกไฟล์จากอุปกรณ์
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCamera(true)}
              className={
                isDark
                  ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750 rounded-lg"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
              }
            >
              <Camera className="w-4 h-4 mr-2" />
              ถ่ายภาพ
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
          />
        </div>

        {uploadedFiles.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3
                className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                ไฟล์ที่อัปโหลด ({uploadedFiles.length})
              </h3>
              {selectedFiles.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    เลือก {selectedFiles.length} ไฟล์
                  </span>
                  <Popover
                    open={groupPopoverOpen}
                    onOpenChange={setGroupPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        role="combobox"
                        className={
                          isDark
                            ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750"
                            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                        }
                      >
                        {groupBacteria
                          ? bacteriaList.find((b) => b.value === groupBacteria)?.label
                          : "เลือกเชื้อ"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className={`w-[320px] p-0 ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
                    >
                      <Command className={isDark ? "bg-gray-800" : "bg-white"}>
                        <CommandInput
                          placeholder="Search Microbes"
                          className={
                            isDark
                              ? "text-gray-100 placeholder:text-gray-500"
                              : "text-gray-900"
                          }
                        />
                        <CommandList>
                          <CommandEmpty
                            className={isDark ? "text-gray-400" : "text-gray-600"}
                          >
                            ไม่พบชื่อเชื้อ
                          </CommandEmpty>
                          <CommandGroup>
                            {bacteriaList.map((bacteria) => (
                              <CommandItem
                                key={bacteria.value}
                                value={bacteria.label}
                                onSelect={() => {
                                  setGroupBacteria(bacteria.value);
                                  setGroupPopoverOpen(false);
                                }}
                                className={
                                  isDark
                                    ? "text-gray-300 aria-selected:bg-gray-700 aria-selected:text-gray-100"
                                    : "text-gray-700 aria-selected:bg-gray-100 aria-selected:text-gray-900"
                                }
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    groupBacteria === bacteria.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                />
                                {bacteria.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!groupBacteria) {
                        alert("กรุณาเลือกชื่อเชื้อก่อน");
                        return;
                      }
                      const newSelections = { ...bacteriaSelections };
                      selectedFiles.forEach((idx) => {
                        newSelections[idx] = groupBacteria;
                      });
                      setBacteriaSelections(newSelections);
                      setSelectedFiles([]);
                      setGroupBacteria("");
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Apply
                  </Button>
                </div>
              )}
            </div>
            {uploadedFiles.map((file, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  selectedFiles.includes(idx)
                    ? isDark
                      ? "bg-blue-900/30 border-blue-700"
                      : "bg-blue-50 border-blue-300"
                    : isDark
                    ? "bg-gray-800/50 border-gray-700"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <Checkbox
                  checked={selectedFiles.includes(idx)}
                  onCheckedChange={() => handleCheckboxChange(idx)}
                  className="flex-shrink-0"
                />
                <FileImage
                  className={`w-5 h-5 flex-shrink-0 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm truncate ${isDark ? "text-gray-300" : "text-gray-700"}`}
                  >
                    {file.name}
                  </p>
                  <Popover
                    open={openPopovers[idx]}
                    onOpenChange={(open) =>
                      setOpenPopovers({
                        ...openPopovers,
                        [idx]: open,
                      })
                    }
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openPopovers[idx]}
                        className={`w-full mt-2 justify-between text-left ${
                          isDark
                            ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750"
                            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {bacteriaSelections[idx]
                          ? bacteriaList.find(
                              (b) =>
                                b.value ===
                                bacteriaSelections[idx],
                            )?.label
                          : "Select Microbes"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className={`w-[320px] p-0 ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
                    >
                      <Command
                        className={
                          isDark ? "bg-gray-800" : "bg-white"
                        }
                      >
                        <CommandInput
                          placeholder="Search Microbes"
                          className={
                            isDark
                              ? "text-gray-100 placeholder:text-gray-500"
                              : "text-gray-900"
                          }
                        />
                        <CommandList>
                          <CommandEmpty
                            className={
                              isDark
                                ? "text-gray-400"
                                : "text-gray-600"
                            }
                          >
                            ไม่พบชื่อเชื้อ
                          </CommandEmpty>
                          <CommandGroup>
                            {bacteriaList.map((bacteria) => (
                              <CommandItem
                                key={bacteria.value}
                                value={bacteria.label}
                                onSelect={() => {
                                  setBacteriaSelections({
                                    ...bacteriaSelections,
                                    [idx]: bacteria.value,
                                  });
                                  setOpenPopovers({
                                    ...openPopovers,
                                    [idx]: false,
                                  });
                                }}
                                className={`${
                                  isDark
                                    ? "text-gray-300 aria-selected:bg-gray-700 aria-selected:text-gray-100"
                                    : "text-gray-700 aria-selected:bg-gray-100 aria-selected:text-gray-900"
                                }`}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    bacteriaSelections[idx] ===
                                    bacteria.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                />
                                {bacteria.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFile(idx)}
                  className={`flex-shrink-0 ${isDark ? "text-gray-400 hover:text-red-400 hover:bg-gray-700" : "text-gray-500 hover:text-red-600 hover:bg-gray-100"}`}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={handleAnalyze}
          disabled={uploadedFiles.length === 0 || analyzing}
          className={`w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg ${isDark ? "disabled:bg-gray-700 disabled:text-gray-500" : "disabled:bg-gray-300 disabled:text-gray-500"}`}
        >
          {analyzing
            ? "กำลังวิเคราะห์..."
            : "เริ่มการวิเคราะห์"}
        </Button>
      </Card>

      {analyzing && (
        <Card
          className={`p-6 mb-6 shadow-xl ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}
        >
          <h2
            className={`text-xl mb-4 ${isDark ? "text-gray-100" : "text-gray-900"}`}
          >
            กำลังประมวลผล
          </h2>
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p
              className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              กำลังประมวลผล{" "}
              {Math.floor(
                (progress / 100) * uploadedFiles.length,
              )}{" "}
              จาก {uploadedFiles.length} ภาพ...
            </p>
          </div>
        </Card>
      )}

      {analysisComplete && (
        <ResultsView
          mode={mode}
          fileCount={uploadedFiles.length}
          bacteriaSelections={bacteriaSelections}
          onSave={handleSave}
        />
      )}
    </div>
    </>
  );
}