'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { analyticsService, medicineService, medicineLogService } from '@/lib/firestore-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [medicines, setMedicines] = useState({ active: 0, expired: 0, expiringSoon: 0 });

  useEffect(() => {
    if (user?.uid) {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const [analyticsData, allMedicines] = await Promise.all([
        analyticsService.getUserAnalytics(user.uid, 30),
        medicineService.getAllUserMedicines(user.uid),
      ]);

      // Format analytics data for charts
      const chartData = analyticsData
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((item) => ({
          date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          adherence: Math.round(item.adherenceRate * 100),
          completed: item.remindersCompleted,
          total: item.remindersTotal,
        }));

      setStats(chartData);

      // Calculate medicine statistics
      const expired = allMedicines.filter((m) => new Date(m.expiryDate) < new Date()).length;
      const expiringSoon = allMedicines.filter((m) => {
        const daysUntilExpiry = Math.floor(
          (new Date(m.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
      }).length;

      setMedicines({
        active: allMedicines.length - expired,
        expired,
        expiringSoon,
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your medication adherence and inventory</p>
      </div>

      {/* Medicine Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Active Medicines</p>
              <p className="text-4xl font-bold mt-2">{medicines.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Expiring Soon (30 days)</p>
              <p className="text-4xl font-bold mt-2 text-yellow-600">{medicines.expiringSoon}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Expired</p>
              <p className="text-4xl font-bold mt-2 text-red-600">{medicines.expired}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Adherence Chart */}
      {stats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Medication Adherence</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="adherence"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Adherence %"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Reminders Completed Chart */}
      {stats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Reminders Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="hsl(var(--primary))" name="Completed" />
                <Bar dataKey="total" fill="hsl(var(--muted-foreground))" name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {stats.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No analytics data yet. Start logging your reminders!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
