import React, { useRef, useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Camera, X, Circle, Square, FlipHorizontal } from 'lucide-react';
import { useTheme } from '../ThemeContext';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

type MaskShape = 'circle' | 'square';

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [maskShape, setMaskShape] = useState<MaskShape>('circle');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false,
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('ไม่สามารถเข้าถึงกล้องได้ กรุณาตรวจสอบการอนุญาตการใช้งานกล้อง');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `capture-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });
        onCapture(file);
        stopCamera();
        onClose();
      }
    }, 'image/jpeg', 0.95);
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Video Preview */}
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        
        {/* Mask Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Dark overlay with center cutout */}
          <svg className="w-full h-full">
            <defs>
              <mask id="mask">
                <rect width="100%" height="100%" fill="white" />
                {maskShape === 'circle' ? (
                  <circle
                    cx="50%"
                    cy="50%"
                    r="35%"
                    fill="black"
                  />
                ) : (
                  <rect
                    x="12.5%"
                    y="25%"
                    width="75%"
                    height="50%"
                    fill="black"
                    rx="8"
                  />
                )}
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(0, 0, 0, 0.5)"
              mask="url(#mask)"
            />
          </svg>

          {/* Guide border */}
          <div className="absolute inset-0 flex items-center justify-center">
            {maskShape === 'circle' ? (
              <div
                className="border-4 border-white rounded-full"
                style={{
                  width: '70%',
                  paddingBottom: '70%',
                  maxWidth: '500px',
                  maxHeight: '500px',
                }}
              />
            ) : (
              <div
                className="border-4 border-white rounded-lg"
                style={{
                  width: '75%',
                  height: '50%',
                  maxWidth: '600px',
                  maxHeight: '400px',
                }}
              />
            )}
          </div>

          {/* Center crosshair */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-8 h-8">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white transform -translate-y-1/2"></div>
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white transform -translate-x-1/2"></div>
            </div>
          </div>
        </div>

        {/* Top Controls */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="bg-black/50 text-white hover:bg-black/70 rounded-full"
          >
            <X className="w-6 h-6" />
          </Button>

          <div className="flex gap-2">
            <Button
              onClick={() => setMaskShape('circle')}
              variant="ghost"
              size="icon"
              className={`rounded-full ${
                maskShape === 'circle'
                  ? 'bg-blue-600 text-white'
                  : 'bg-black/50 text-white hover:bg-black/70'
              }`}
            >
              <Circle className="w-6 h-6" />
            </Button>
            <Button
              onClick={() => setMaskShape('square')}
              variant="ghost"
              size="icon"
              className={`rounded-full ${
                maskShape === 'square'
                  ? 'bg-blue-600 text-white'
                  : 'bg-black/50 text-white hover:bg-black/70'
              }`}
            >
              <Square className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-4 z-10">
          <Button
            onClick={toggleCamera}
            variant="ghost"
            size="icon"
            className="bg-black/50 text-white hover:bg-black/70 rounded-full w-12 h-12"
          >
            <FlipHorizontal className="w-6 h-6" />
          </Button>
          
          <Button
            onClick={capturePhoto}
            size="icon"
            className="bg-white hover:bg-gray-200 rounded-full w-16 h-16 border-4 border-white shadow-lg"
          >
            <div className="w-14 h-14 rounded-full bg-transparent border-2 border-gray-400"></div>
          </Button>

          <div className="w-12 h-12"></div> {/* Spacer for symmetry */}
        </div>

        {/* Helper text */}
        <div className="absolute bottom-32 left-0 right-0 flex justify-center z-10">
          <div className="bg-black/70 text-white px-4 py-2 rounded-full text-sm">
            {maskShape === 'circle' ? 'วางจานเพาะเชื้อให้อยู่ในวงกลม' : 'วางจานเพาะเชื้อให้อยู่ในกรอบ'}
          </div>
        </div>
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
