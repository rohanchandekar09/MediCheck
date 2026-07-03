'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Zap } from 'lucide-react';
import BarcodeScanner from '@/components/barcode-scanner';
import OCRScanner from '@/components/ocr-scanner';
import ScanResultForm from '@/components/scan-result-form';

export default function ScannerPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showOCRScanner, setShowOCRScanner] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [extractedText, setExtractedText] = useState('');

  const handleBarcodeDetected = (barcode: string) => {
    setScannedBarcode(barcode);
    setShowBarcodeScanner(false);
  };

  const handleTextExtracted = (text: string) => {
    setExtractedText(text);
    setShowOCRScanner(false);
  };

  const handleFormComplete = () => {
    setScannedBarcode('');
    setExtractedText('');
    router.push('/dashboard');
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Smart Scanner</h1>
        <p className="text-muted-foreground mt-1">
          Use AI to quickly add medicines by scanning or photographing packages
        </p>
      </div>

      {!scannedBarcode && !extractedText ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowBarcodeScanner(true)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Barcode Scanner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Scan the barcode on your medicine package to quickly look up details
              </p>
              <Button variant="outline" className="w-full">
                Start Barcode Scan
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowOCRScanner(true)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                OCR Scanner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Take a photo of your medicine package to extract text information automatically
              </p>
              <Button variant="outline" className="w-full">
                Start OCR Scan
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <ScanResultForm
          barcode={scannedBarcode}
          extractedText={extractedText}
          onComplete={handleFormComplete}
          onReset={() => {
            setScannedBarcode('');
            setExtractedText('');
          }}
        />
      )}

      {showBarcodeScanner && (
        <BarcodeScanner
          onDetected={handleBarcodeDetected}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}

      {showOCRScanner && (
        <OCRScanner
          onExtracted={handleTextExtracted}
          onClose={() => setShowOCRScanner(false)}
        />
      )}
    </div>
  );
}
