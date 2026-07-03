'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { X, Upload, Camera } from 'lucide-react';
import Tesseract from 'tesseract.js';

interface OCRScannerProps {
  onExtracted: (text: string) => void;
  onClose: () => void;
}

export default function OCRScanner({ onExtracted, onClose }: OCRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string>('');

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setIsScanning(true);
      }
    } catch (err) {
      setError('Failed to access camera');
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      setCameraActive(false);
      setIsScanning(false);
    }
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const imageData = canvasRef.current.toDataURL('image/jpeg');
        setCapturedImage(imageData);
        processImage(imageData);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        setCapturedImage(imageData);
        processImage(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (imageData: string) => {
    setIsProcessing(true);
    try {
      const result = await Tesseract.recognize(imageData, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      const text = result.data.text;
      if (text.trim()) {
        onExtracted(text);
      } else {
        setError('No text found in image. Try again.');
      }
    } catch (err) {
      console.error('OCR error:', err);
      setError('Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg w-full max-w-2xl overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Scan Medicine Package</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              disabled={isProcessing}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {!cameraActive && !capturedImage && (
            <div className="space-y-4">
              <p className="text-muted-foreground text-center">
                Capture or upload a photo of your medicine package to extract information
              </p>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={startCamera}
                  className="gap-2"
                  disabled={isProcessing}
                >
                  <Camera className="w-4 h-4" />
                  Take Photo
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                  disabled={isProcessing}
                >
                  <Upload className="w-4 h-4" />
                  Upload Photo
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {cameraActive && (
            <div className="space-y-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg bg-black"
                style={{ maxHeight: '400px' }}
              />
              <div className="flex gap-2">
                <Button
                  onClick={capturePhoto}
                  disabled={isProcessing}
                  className="flex-1 gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Spinner className="w-4 h-4" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      Capture
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={stopCamera}
                  disabled={isProcessing}
                >
                  Close Camera
                </Button>
              </div>
            </div>
          )}

          {capturedImage && !isProcessing && (
            <div className="space-y-4">
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full rounded-lg max-h-96 object-contain"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setCapturedImage('');
                    setError('');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Retake
                </Button>
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Spinner className="mx-auto mb-4" />
                <p className="text-muted-foreground">Processing image...</p>
              </div>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
