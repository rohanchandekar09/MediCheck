'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
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

const medicineSchema = z.object({
  name: z.string().min(1, 'Medicine name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  prescribedDate: z.string().min(1, 'Prescribed date is required'),
  notes: z.string().optional(),
});

type MedicineFormData = z.infer<typeof medicineSchema>;

interface AddMedicineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (medicine?: any) => void;
}

const units = ['tablets', 'capsules', 'ml', 'mg', 'grams', 'drops', 'patches', 'inhalers'];

export default function AddMedicineDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddMedicineDialogProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<MedicineFormData>({
    resolver: zodResolver(medicineSchema),
    defaultValues: {
      prescribedDate: new Date().toISOString().split('T')[0],
      quantity: 1,
      unit: 'tablets',
    },
  });

  const selectedUnit = watch('unit');

  const onSubmit = async (data: MedicineFormData) => {
    if (!user?.uid) return;

    // Create the new medicine object immediately for optimistic update
    const medicineId = `temp_${Date.now()}`;
    const newMedicine = {
      id: medicineId,
      name: data.name,
      dosage: data.dosage,
      quantity: data.quantity,
      unit: data.unit,
      expiryDate: data.expiryDate,
      prescribedDate: data.prescribedDate,
      notes: data.notes,
      isActive: true,
      userId: user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Close dialog and show success immediately
    onSuccess(newMedicine);
    onOpenChange(false);
    reset();

    // Save to Firestore in background without blocking UI
    setIsLoading(true);
    try {
      console.log('[v0] Saving medicine to Firestore in background...');
      const realId = await medicineService.addMedicine(user.uid, {
        name: data.name,
        dosage: data.dosage,
        quantity: data.quantity,
        unit: data.unit,
        expiryDate: data.expiryDate,
        prescribedDate: data.prescribedDate,
        notes: data.notes,
        isActive: true,
      });
      console.log('[v0] Medicine persisted with ID:', realId);
    } catch (error) {
      console.error('[v0] Failed to save medicine to Firestore:', error);
      // Optionally show an error toast here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Medicine</DialogTitle>
          <DialogDescription>
            Enter the details of your medicine
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Medicine Name</Label>
            <Input
              id="name"
              placeholder="e.g., Aspirin"
              {...register('name')}
              disabled={isLoading}
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
              disabled={isLoading}
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
                disabled={isLoading}
              />
              {errors.quantity && (
                <p className="text-xs text-destructive">{errors.quantity.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select value={selectedUnit} onValueChange={(value) => setValue('unit', value)}>
                <SelectTrigger id="unit" disabled={isLoading}>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prescribedDate">Prescribed Date</Label>
              <Input
                id="prescribedDate"
                type="date"
                {...register('prescribedDate')}
                disabled={isLoading}
              />
              {errors.prescribedDate && (
                <p className="text-xs text-destructive">{errors.prescribedDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                {...register('expiryDate')}
                disabled={isLoading}
              />
              {errors.expiryDate && (
                <p className="text-xs text-destructive">{errors.expiryDate.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              placeholder="e.g., Take with food"
              {...register('notes')}
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
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
      </DialogContent>
    </Dialog>
  );
}
