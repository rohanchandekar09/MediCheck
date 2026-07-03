export interface Medicine {
  id: string;
  userId: string;
  name: string;
  dosage: string;
  quantity: number;
  unit: string; // 'tablets', 'ml', 'mg', 'capsules', etc.
  expiryDate: string; // ISO date format
  prescribedDate: string;
  photoUrl?: string;
  barcode?: string;
  sideEffects?: string[];
  interactions?: string[];
  notes?: string;
  location?: string; // e.g., 'bedroom', 'bathroom'
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  reminderTime?: string; // HH:mm format
}

export interface MedicineReminder {
  id: string;
  userId: string;
  medicineId: string;
  medicineName: string;
  dosage: string;
  time: string; // HH:mm format
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  daysOfWeek?: number[]; // 0-6, only for weekly
  enabled: boolean;
  notificationsEnabled: boolean;
  nextReminderTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  displayName: string;
  dateOfBirth?: string;
  bloodType?: string;
  allergies?: string[];
  chronicConditions?: string[];
  emergencyContact?: string;
  profilePhotoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicineLog {
  id: string;
  userId: string;
  medicineId: string;
  medicineName: string;
  dosage: string;
  takenAt: string;
  quantity: number;
  notes?: string;
  createdAt: string;
}

export interface ExpiryAlert {
  id: string;
  userId: string;
  medicineId: string;
  medicineName: string;
  expiryDate: string;
  daysUntilExpiry: number;
  alertSent: boolean;
  createdAt: string;
}

export interface DrugInteraction {
  id: string;
  drug1: string;
  drug2: string;
  severity: 'low' | 'moderate' | 'severe';
  description: string;
}

export interface BackupLog {
  id: string;
  userId: string;
  backupDate: string;
  itemsCount: number;
  backupSize: number;
  status: 'success' | 'failed';
  errorMessage?: string;
}

export interface AnalyticsData {
  id: string;
  userId: string;
  date: string;
  medicinesCountActive: number;
  medicinesCountExpired: number;
  medicinesCountExpiringSoon: number;
  remindersCompleted: number;
  remindersTotal: number;
  adherenceRate: number; // percentage
  createdAt: string;
}
