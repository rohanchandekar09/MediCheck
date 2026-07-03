'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { reminderService, medicineService } from '@/lib/firestore-service';
import { Medicine } from '@/lib/types';
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

const reminderSchema = z.object({
  medicineId: z.string().min(1, 'Please select a medicine'),
  time: z.string().min(1, 'Time is required'),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'custom']),
});

type ReminderFormData = z.infer<typeof reminderSchema>;

interface AddReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function AddReminderDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddReminderDialogProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [medicinesLoading, setMedicinesLoading] = useState(true);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ReminderFormData>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      frequency: 'daily',
      time: '09:00',
    },
  });

  const selectedMedicineId = watch('medicineId');

  useEffect(() => {
    if (open && user?.uid) {
      loadMedicines();
    }
  }, [open, user?.uid]);

  const loadMedicines = async () => {
    if (!user?.uid) return;
    setMedicinesLoading(true);
    try {
      const data = await medicineService.getUserMedicines(user.uid);
      setMedicines(data);
    } catch (error) {
      console.error('Failed to load medicines:', error);
    } finally {
      setMedicinesLoading(false);
    }
  };

  const selectedMedicine = medicines.find((m) => m.id === selectedMedicineId);

  const onSubmit = async (data: ReminderFormData) => {
    if (!user?.uid || !selectedMedicine) return;

    setIsLoading(true);
    try {
      await reminderService.addReminder(user.uid, {
        medicineId: data.medicineId,
        medicineName: selectedMedicine.name,
        dosage: selectedMedicine.dosage,
        time: data.time,
        frequency: data.frequency,
        enabled: true,
        notificationsEnabled: true,
      });
      onSuccess();
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error('Failed to add reminder:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Medicine Reminder</DialogTitle>
          <DialogDescription>
            Set up a reminder for one of your medicines
          </DialogDescription>
        </DialogHeader>

        {medicinesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="medicineId">Medicine</Label>
              <Select
                value={selectedMedicineId}
                onValueChange={(value) => setValue('medicineId', value)}
              >
                <SelectTrigger id="medicineId" disabled={isLoading}>
                  <SelectValue placeholder="Select a medicine" />
                </SelectTrigger>
                <SelectContent>
                  {medicines.map((medicine) => (
                    <SelectItem key={medicine.id} value={medicine.id}>
                      {medicine.name} - {medicine.dosage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.medicineId && (
                <p className="text-xs text-destructive">{errors.medicineId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Reminder Time</Label>
              <Input
                id="time"
                type="time"
                {...register('time')}
                disabled={isLoading}
              />
              {errors.time && (
                <p className="text-xs text-destructive">{errors.time.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select
                defaultValue="daily"
                onValueChange={(value) =>
                  setValue('frequency', value as any)
                }
              >
                <SelectTrigger id="frequency" disabled={isLoading}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              {errors.frequency && (
                <p className="text-xs text-destructive">{errors.frequency.message}</p>
              )}
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
              <Button type="submit" disabled={isLoading || medicines.length === 0}>
                {isLoading ? (
                  <>
                    <Spinner className="mr-2" />
                    Adding...
                  </>
                ) : (
                  'Add Reminder'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
