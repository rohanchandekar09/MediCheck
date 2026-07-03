'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { reminderService, medicineService } from '@/lib/firestore-service';
import { MedicineReminder } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Bell } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import AddReminderDialog from '@/components/add-reminder-dialog';

export default function RemindersPage() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<MedicineReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadReminders();
    }
  }, [user]);

  const loadReminders = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const data = await reminderService.getUserReminders(user.uid);
      setReminders(data);
    } catch (error) {
      console.error('Failed to load reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Medicine Reminders</h1>
          <p className="text-muted-foreground mt-1">Manage your medication schedule</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} size="lg" className="gap-2">
          <Plus className="w-5 h-5" />
          Add Reminder
        </Button>
      </div>

      {reminders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No reminders yet</h3>
            <p className="text-muted-foreground mb-6">
              Set up reminders to never miss your medications
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              Create First Reminder
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reminders.map((reminder) => (
            <Card key={reminder.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{reminder.medicineName}</h3>
                    <p className="text-sm text-muted-foreground">{reminder.dosage}</p>
                    <p className="text-sm font-medium mt-2">
                      {reminder.time} • {reminder.frequency}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    reminder.enabled
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-600'
                      : 'bg-gray-50 dark:bg-gray-900/20 text-gray-600'
                  }`}>
                    {reminder.enabled ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddReminderDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={loadReminders}
      />
    </div>
  );
}
