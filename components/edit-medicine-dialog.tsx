'use client';

import { useEffect, useState } from 'react';
import { medicineService } from '@/lib/firestore-service';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Medicine } from '@/lib/types';

const medicineSchema = z.object({
  name: z.string().min(1, 'Medicine name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  notes: z.string().optional(),
});

type MedicineFormData = z.infer<typeof medicineSchema>;

interface EditMedicineDialogProps {
  medicineId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const units = ['tablets', 'capsules', 'ml', 'mg', 'grams', 'drops', 'patches', 'inhalers'];

export default function EditMedicineDialog({
  medicineId,
  open,
  onOpenChange,
  onSuccess,
}: EditMedicineDialogProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<MedicineFormData>({
    resolver: zodResolver(medicineSchema),
  });

  const selectedUnit = watch('unit');

  useEffect(() => {
    if (open) {
      loadMedicine();
    }
  }, [open]);

  const loadMedicine = async () => {
    setIsLoading(true);
    try {
      const data = await medicineService.getMedicine(medicineId);
      if (data) {
        setMedicine(data);
        setValue('name', data.name);
        setValue('dosage', data.dosage);
        setValue('quantity', data.quantity);
        setValue('unit', data.unit);
        setValue('expiryDate', data.expiryDate);
        setValue('notes', data.notes || '');
      }
    } catch (error) {
      console.error('Failed to load medicine:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: MedicineFormData) => {
    setIsSubmitting(true);
    try {
      await medicineService.updateMedicine(medicineId, {
        name: data.name,
        dosage: data.dosage,
        quantity: data.quantity,
        unit: data.unit,
        expiryDate: data.expiryDate,
        notes: data.notes,
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update medicine:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Medicine</DialogTitle>
          <DialogDescription>
            Update the details of your medicine
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Medicine Name</Label>
              <Input
                id="name"
                placeholder="e.g., Aspirin"
                {...register('name')}
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dosage">Dosage</Label>
              <Input
                id="dosage"
                placeholder="e.g., 500mg"
                {...register('dosage')}
                disabled={isSubmitting}
              />
              {errors.dosage && (
                <p className="text-xs text-destructive">{errors.dosage.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="1"
                  {...register('quantity')}
                  disabled={isSubmitting}
                />
                {errors.quantity && (
                  <p className="text-xs text-destructive">{errors.quantity.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select value={selectedUnit} onValueChange={(value) => setValue('unit', value)}>
                  <SelectTrigger id="unit" disabled={isSubmitting}>
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
                {errors.unit && (
                  <p className="text-xs text-destructive">{errors.unit.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                {...register('expiryDate')}
                disabled={isSubmitting}
              />
              {errors.expiryDate && (
                <p className="text-xs text-destructive">{errors.expiryDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="e.g., Take with food"
                {...register('notes')}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
