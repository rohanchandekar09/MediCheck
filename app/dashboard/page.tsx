'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { medicineService } from '@/lib/firestore-service';
import { Medicine } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';
import MedicineList from '@/components/medicine-list';
import AddMedicineDialog from '@/components/add-medicine-dialog';
import { Spinner } from '@/components/ui/spinner';

export default function DashboardPage() {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadMedicines();
    }
  }, [user]);

  const loadMedicines = async (showLoader = true) => {
    if (!user?.uid) return;
    if (showLoader) setLoading(true);
    try {
      console.log('[v0] Loading medicines...');
      const startTime = performance.now();
      const data = await medicineService.getUserMedicines(user.uid);
      const endTime = performance.now();
      console.log(`[v0] Medicines loaded in ${(endTime - startTime).toFixed(2)}ms`);
      setMedicines(data);
    } catch (error) {
      console.error('Failed to load medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMedicineAdded = (newMedicine: Medicine) => {
    console.log('[v0] Medicine added, updating UI instantly');
    // Optimistic update - add to local state immediately
    setMedicines((prev) => [newMedicine, ...prev]);
    // Reload in background after 2 seconds to sync with Firestore
    // This prevents hammering the database while keeping UI responsive
    setTimeout(() => {
      loadMedicines(false);
    }, 2000);
  };

  const expiredCount = medicines.filter((m) => new Date(m.expiryDate) < new Date()).length;
  const expiringSoonCount = medicines.filter((m) => {
    const daysUntilExpiry = Math.floor(
      (new Date(m.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  }).length;

  const stats = [
    {
      title: 'Active Medicines',
      value: medicines.length,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Expiring Soon',
      value: expiringSoonCount,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      title: 'Expired',
      value: expiredCount,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <div className="p-6 md:p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Welcome, {user?.displayName || 'User'}
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your medicines and stay healthy
              </p>
            </div>
            <Button
              onClick={() => setIsDialogOpen(true)}
              size="lg"
              className="gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Medicine
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                        <p className="text-3xl font-bold mt-2">{stat.value}</p>
                      </div>
                      <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                        <Icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Medicines Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Your Medicines</h2>
              <Link href="/dashboard/scanner" className="text-primary hover:underline text-sm font-medium">
                Quick Scan
              </Link>
            </div>

            {medicines.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Pill className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No medicines yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Add your first medicine to get started
                  </p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    Add Medicine
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <MedicineList medicines={medicines} onRefresh={loadMedicines} />
            )}
          </div>
        </div>
      </div>

      {/* Add Medicine Dialog */}
      <AddMedicineDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={handleMedicineAdded}
      />
    </div>
  );
}

import { Pill } from 'lucide-react';
