'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { profileService, backupService, medicineService } from '@/lib/firestore-service';
import { UserProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Download, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    bloodType: '',
    dateOfBirth: '',
  });

  useEffect(() => {
    if (user?.uid) {
      // Don't attempt to load profile on initial mount if offline
      if (navigator.onLine) {
        loadProfile();
      } else {
        // Just set default form data when offline
        setFormData({
          displayName: user?.displayName || user?.email?.split('@')[0] || '',
          bloodType: '',
          dateOfBirth: '',
        });
      }
    }

    // Listen for online/offline events to reload when connection restored
    const handleOnline = () => {
      console.log('[v0] Back online, attempting to reload profile');
      if (user?.uid) {
        loadProfile();
      }
    };

    const handleOffline = () => {
      console.log('[v0] Went offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  const loadProfile = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      const data = await profileService.getUserProfile(user.uid);
      if (data) {
        setProfile(data);
        setFormData({
          displayName: data.displayName,
          bloodType: data.bloodType || '',
          dateOfBirth: data.dateOfBirth || '',
        });
      } else {
        // No profile exists yet, use user's email as default display name
        setFormData({
          displayName: user?.displayName || user?.email?.split('@')[0] || '',
          bloodType: '',
          dateOfBirth: '',
        });
      }
    } catch (error: any) {
      // Log error but don't throw - use default values instead
      if (!error?.message?.includes('offline')) {
        console.error('[v0] Error loading profile:', error);
      }
      // Use default values on any error
      setFormData({
        displayName: user?.displayName || user?.email?.split('@')[0] || '',
        bloodType: '',
        dateOfBirth: '',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    // Check online status
    if (!navigator.onLine) {
      alert('You are offline. Changes will be saved locally and synced when you\'re back online.');
      return;
    }

    setSaving(true);
    try {
      console.log('[v0] Saving profile...');
      await profileService.setUserProfile(user.uid, {
        id: user.uid,
        userId: user.uid,
        displayName: formData.displayName,
        bloodType: formData.bloodType,
        dateOfBirth: formData.dateOfBirth,
        createdAt: profile?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log('[v0] Profile saved successfully');
      loadProfile();
    } catch (error: any) {
      console.error('[v0] Failed to save profile:', error);
      if (error?.message?.includes('offline')) {
        alert('Connection lost. Please try again when you\'re back online.');
      } else {
        alert('Failed to save profile. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    if (!user?.uid) return;

    // Check online status
    if (!navigator.onLine) {
      alert('You are offline. Please connect to the internet to export your data.');
      return;
    }

    setSaving(true);
    try {
      console.log('[v0] Exporting data...');
      const medicines = await medicineService.getAllUserMedicines(user.uid);
      
      const exportData = {
        exported: new Date().toISOString(),
        medicines: medicines.map((m) => ({
          name: m.name,
          dosage: m.dosage,
          quantity: m.quantity,
          unit: m.unit,
          expiryDate: m.expiryDate,
          prescribedDate: m.prescribedDate,
          notes: m.notes,
        })),
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

      const exportFileDefaultName = `medicheck-backup-${new Date().toISOString().split('T')[0]}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

      console.log('[v0] Data exported successfully');

      // Save backup log
      try {
        await backupService.createBackupLog(user.uid, {
          backupDate: new Date().toISOString(),
          itemsCount: medicines.length,
          backupSize: dataStr.length,
          status: 'success',
        });
      } catch (logError) {
        console.error('[v0] Failed to save backup log:', logError);
        // Don't fail the export if log save fails
      }
    } catch (error) {
      console.error('[v0] Failed to export data:', error);
      alert('Could not export data. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Full Name</Label>
              <Input
                id="displayName"
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bloodType">Blood Type</Label>
              <Input
                id="bloodType"
                type="text"
                placeholder="e.g., O+"
                value={formData.bloodType}
                onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                disabled={saving}
              />
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? <>
                <Spinner className="mr-2" />
                Saving...
              </> : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Export or manage your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleExportData}
            disabled={saving}
            variant="outline"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            {saving ? 'Exporting...' : 'Export My Data'}
          </Button>
          <p className="text-xs text-muted-foreground">
            Download all your medicines as a JSON file for backup
          </p>
        </CardContent>
      </Card>

      {/* Account */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full"
          >
            Sign Out
          </Button>
          <p className="text-xs text-muted-foreground flex gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            Your data will be preserved for your next login
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
