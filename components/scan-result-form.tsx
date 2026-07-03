'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { medicineService } from '@/lib/firestore-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';

interface ScanResultFormProps {
  barcode?: string;
  extractedText?: string;
  onComplete: () => void;
  onReset: () => void;
}

const units = ['tablets', 'capsules', 'ml', 'mg', 'grams', 'drops', 'patches', 'inhalers'];

export default function ScanResultForm({
  barcode,
  extractedText,
  onComplete,
  onReset,
}: ScanResultFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    quantity: '1',
    unit: 'tablets',
    expiryDate: '',
    prescribedDate: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  // Parse extracted text to pre-fill form
  useMemo(() => {
    if (extractedText) {
      const lines = extractedText.split('\n');
      const firstLine = lines[0] || '';
      const text = extractedText.toLowerCase();

      // Try to extract medicine name and dosage
      const dosageMatch = text.match(/(\d+)\s*(mg|ml|mcg|units)/i);
      if (dosageMatch) {
        setFormData((prev) => ({
          ...prev,
          dosage: `${dosageMatch[1]}${dosageMatch[2]}`,
        }));
      }

      // Try to extract quantity
      const quantityMatch = text.match(/qty[:\s]*(\d+)/i);
      if (quantityMatch) {
        setFormData((prev) => ({
          ...prev,
          quantity: quantityMatch[1],
        }));
      }

      // Try to extract expiry date
      const expiryMatch = text.match(
        /exp[iry]*[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i
      );
      if (expiryMatch) {
        const [, dateStr] = expiryMatch;
        const parts = dateStr.split(/[\/\-]/);
        if (parts.length === 3) {
          const [month, day, year] = parts;
          const fullYear = year.length === 2 ? `20${year}` : year;
          setFormData((prev) => ({
            ...prev,
            expiryDate: `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`,
          }));
        }
      }

      // Use first line as medicine name if it looks like a name
      if (firstLine.length > 2 && firstLine.length < 50) {
        setFormData((prev) => ({
          ...prev,
          name: firstLine,
        }));
      }
    }
  }, [extractedText]);

  const handleInputChange = (
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    setIsLoading(true);
    try {
      await medicineService.addMedicine(user.uid, {
        name: formData.name,
        dosage: formData.dosage,
        quantity: parseInt(formData.quantity),
        unit: formData.unit,
        expiryDate: formData.expiryDate,
        prescribedDate: formData.prescribedDate,
        notes: formData.notes,
        isActive: true,
        barcode: barcode,
      });
      onComplete();
    } catch (error) {
      console.error('Failed to add medicine:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Review Scanned Information</CardTitle>
        </CardHeader>
        <CardContent>
          {barcode && (
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Barcode</p>
              <p className="font-mono text-sm">{barcode}</p>
            </div>
          )}
          {extractedText && (
            <div className="mb-4 p-3 bg-muted rounded-lg max-h-32 overflow-y-auto">
              <p className="text-xs text-muted-foreground mb-2">Extracted Text</p>
              <p className="text-xs whitespace-pre-wrap font-mono">{extractedText}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Medicine Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Medicine Name</Label>
              <Input
                id="name"
                placeholder="e.g., Aspirin"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dosage">Dosage</Label>
              <Input
                id="dosage"
                placeholder="e.g., 500mg"
                value={formData.dosage}
                onChange={(e) => handleInputChange('dosage', e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="1"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => handleInputChange('unit', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prescribedDate">Prescribed Date</Label>
                <Input
                  id="prescribedDate"
                  type="date"
                  value={formData.prescribedDate}
                  onChange={(e) => handleInputChange('prescribedDate', e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="e.g., Take with food"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onReset}
                disabled={isLoading}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Spinner className="mr-2" />
                    Adding...
                  </>
                ) : (
                  'Add Medicine'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
