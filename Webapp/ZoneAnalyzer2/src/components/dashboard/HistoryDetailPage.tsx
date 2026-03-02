import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { ResultsView } from './ResultsView';
import { fetchWithAuth } from '../../utils/api';

interface HistoryDetailPageProps {
  historyId: string;
  onBack: () => void;
}

export function HistoryDetailPage({ historyId, onBack }: HistoryDetailPageProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [historyData, setHistoryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBatchData();
  }, [historyId]);

  const fetchBatchData = async () => {
    try {
      const response = await fetchWithAuth(`/batches/${historyId}`);
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
          images: (data.plates || []).map((plate: any) => ({
            // Standardize data for ResultsView
            plate: {
              ...plate,
              strain_code: plate.strain_code || 'Other' // Ensure strain_code is present
            }
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

      <div className="mb-6">
        <h1 className={`text-3xl mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          {historyData.batchName}
        </h1>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          วิเคราะห์เมื่อ: {historyData.date} เวลา {historyData.time}
        </p>
      </div>

      <ResultsView
        mode="batch"
        fileCount={historyData.images.length}
        bacteriaSelections={{}}
        onSave={() => { }}
        hideSaveButton={true}
        analysisResults={historyData.images}
      />
    </div>
  );
}