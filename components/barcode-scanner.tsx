'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { X, Pause, Play } from 'lucide-react';

interface BarcodeScammerProps {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

declare global {
  interface Window {
    Quagga: any;
  }
}

export default function BarcodeScanner({ onDetected, onClose }: BarcodeScammerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadQuagga = async () => {
      try {
        // Dynamically load Quagga
        if (!window.Quagga) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/quagga@0.12.1/dist/quagga.min.js';
          script.onload = () => initializeScanner();
          document.body.appendChild(script);
        } else {
          initializeScanner();
        }
      } catch (err) {
        console.error('Failed to load Quagga:', err);
        setError('Failed to load scanner');
        setIsLoading(false);
      }
    };

    const initializeScanner = () => {
      if (!window.Quagga || !videoRef.current) return;

      window.Quagga.init(
        {
          inputStream: {
            name: 'Live',
            type: 'LiveStream',
            target: videoRef.current,
            constraints: {
              width: 640,
              height: 480,
              facingMode: 'environment',
            },
          },
          decoder: {
            readers: [
              'code_128_reader',
              'ean_reader',
              'ean_8_reader',
              'upc_reader',
              'upc_e_reader',
              'codabar_reader',
            ],
          },
        },
        (err: any) => {
          if (err) {
            console.error('Scanner initialization error:', err);
            setError('Failed to initialize camera');
            setIsLoading(false);
            return;
          }
          window.Quagga.start();
          setIsLoading(false);
        }
      );

      window.Quagga.onDetected((result: any) => {
        if (result.codeResult.code) {
          onDetected(result.codeResult.code);
        }
      });
    };

    loadQuagga();

    return () => {
      if (window.Quagga) {
        try {
          window.Quagga.stop();
        } catch (err) {
          console.error('Error stopping scanner:', err);
        }
      }
    };
  }, [onDetected]);

  const handleTogglePause = () => {
    if (window.Quagga) {
      if (isPaused) {
        window.Quagga.start();
      } else {
        window.Quagga.stop();
      }
      setIsPaused(!isPaused);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg w-full max-w-2xl overflow-hidden">
        {error ? (
          <div className="p-6 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={onClose}>Close</Button>
          </div>
        ) : isLoading ? (
          <div className="p-8 flex items-center justify-center min-h-96">
            <Spinner />
          </div>
        ) : (
          <>
            <div
              ref={videoRef}
              className="relative w-full bg-black"
              style={{ paddingBottom: '75%' }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-4 border-primary w-48 h-32 rounded-lg opacity-75" />
              </div>
            </div>

            <div className="p-4 flex gap-2 justify-between items-center bg-muted">
              <div className="text-sm text-muted-foreground">
                Position barcode in frame
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTogglePause}
                  className="gap-2"
                >
                  {isPaused ? (
                    <>
                      <Play className="w-4 h-4" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4" />
                      Pause
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onClose}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Close
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
