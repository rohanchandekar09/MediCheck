'use client';

import { useState, memo } from 'react';
import { Medicine } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreVertical, Trash2, Edit2, AlertTriangle } from 'lucide-react';
import { medicineService } from '@/lib/firestore-service';
import { useAuth } from '@/lib/auth-context';
import EditMedicineDialog from './edit-medicine-dialog';

interface MedicineListProps {
  medicines: Medicine[];
  onRefresh: () => void;
}

export default function MedicineList({ medicines, onRefresh }: MedicineListProps) {
  const { user } = useAuth();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (medicineId: string) => {
    // Remove from UI immediately
    setDeleteId(null);
    
    // Delete from Firestore in background
    try {
      setIsDeleting(true);
      console.log('[v0] Deleting medicine:', medicineId);
      await medicineService.deleteMedicine(medicineId);
      // Refresh list after deletion is complete
      onRefresh();
    } catch (error) {
      console.error('[v0] Failed to delete medicine:', error);
      // Optionally show error toast
    } finally {
      setIsDeleting(false);
    }
  };

  const getExpiryStatus = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { status: 'expired', label: 'Expired', color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-900/20' };
    } else if (daysUntilExpiry <= 7) {
      return { status: 'expiring', label: `${daysUntilExpiry} days left`, color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-900/20' };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'soon', label: `${daysUntilExpiry} days left`, color: 'text-yellow-600', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20' };
    }
    return { status: 'ok', label: `${daysUntilExpiry} days left`, color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20' };
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {medicines.map((medicine) => {
          const expiryStatus = getExpiryStatus(medicine.expiryDate);
          return (
            <Card key={medicine.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                {medicine.photoUrl && (
                  <div className="mb-4 rounded-lg overflow-hidden bg-muted h-32 flex items-center justify-center">
                    <img
                      src={medicine.photoUrl}
                      alt={medicine.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{medicine.name}</h3>
                      <p className="text-sm text-muted-foreground">{medicine.dosage}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingId(medicine.id)}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteId(medicine.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="text-sm">
                      <p className="text-muted-foreground">Quantity</p>
                      <p className="font-semibold">{medicine.quantity} {medicine.unit}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${expiryStatus.color} ${expiryStatus.bgColor}`}>
                      {expiryStatus.status === 'expired' && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                      {expiryStatus.label}
                    </div>
                  </div>

                  {medicine.notes && (
                    <p className="text-xs text-muted-foreground">{medicine.notes}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Medicine</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this medicine? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Medicine Dialog */}
      {editingId && (
        <EditMedicineDialog
          medicineId={editingId}
          open={!!editingId}
          onOpenChange={() => setEditingId(null)}
          onSuccess={onRefresh}
        />
      )}
    </>
  );
}
