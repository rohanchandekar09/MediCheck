'use client';

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  getDoc,
  setDoc,
  QueryConstraint,
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase';

// Helper to get db reference
const getDb = () => getFirebaseDb();
import type {
  Medicine,
  MedicineReminder,
  UserProfile,
  MedicineLog,
  ExpiryAlert,
  BackupLog,
  AnalyticsData,
} from './types';

// Medicine operations
export const medicineService = {
  async addMedicine(userId: string, medicine: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'>) {
    const timestamp = new Date().toISOString();
    console.log('[v0] Adding medicine to Firestore...');
    const start = performance.now();
    
    try {
      const docRef = await addDoc(collection(getDb(), 'medicines'), {
        ...medicine,
        userId,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      
      const end = performance.now();
      console.log(`[v0] Firestore addDoc took ${(end - start).toFixed(2)}ms`);
      return docRef.id;
    } catch (error) {
      console.error('[v0] Error adding medicine:', error);
      throw error;
    }
  },

  async updateMedicine(medicineId: string, updates: Partial<Medicine>) {
    const medicineRef = doc(getDb(), 'medicines', medicineId);
    await updateDoc(medicineRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },

  async deleteMedicine(medicineId: string) {
    await deleteDoc(doc(getDb(), 'medicines', medicineId));
  },

  async getMedicine(medicineId: string) {
    const docSnap = await getDoc(doc(getDb(), 'medicines', medicineId));
    return docSnap.exists() ? (docSnap.data() as Medicine) : null;
  },

  async getUserMedicines(userId: string) {
    console.log('[v0] Fetching user medicines...');
    const start = performance.now();
    
    try {
      // Composite index on (userId, isActive) is needed for optimal performance
      // Create it in Firebase Console: Collection "medicines" -> Composite Indexes
      const q = query(
        collection(getDb(), 'medicines'),
        where('userId', '==', userId),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const end = performance.now();
      console.log(`[v0] Query took ${(end - start).toFixed(2)}ms, fetched ${querySnapshot.docs.length} medicines`);
      
      return querySnapshot.docs.map((doc) => ({ ...doc.data() as Medicine, id: doc.id }));
    } catch (error) {
      console.error('[v0] Error fetching medicines:', error);
      throw error;
    }
  },

  async getAllUserMedicines(userId: string) {
    const q = query(collection(getDb(), 'medicines'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ ...doc.data() as Medicine, id: doc.id }));
  },

  async getMedicinesExpiringSoon(userId: string, days: number = 30) {
    const today = new Date();
    const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    const q = query(
      collection(getDb(), 'medicines'),
      where('userId', '==', userId),
      where('expiryDate', '<=', futureDate.toISOString().split('T')[0]),
      where('isActive', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ ...doc.data() as Medicine, id: doc.id }));
  },
};

// Reminder operations
export const reminderService = {
  async addReminder(userId: string, reminder: Omit<MedicineReminder, 'id' | 'createdAt' | 'updatedAt'>) {
    const timestamp = new Date().toISOString();
    const docRef = await addDoc(collection(getDb(), 'reminders'), {
      ...reminder,
      userId,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    return docRef.id;
  },

  async updateReminder(reminderId: string, updates: Partial<MedicineReminder>) {
    const reminderRef = doc(getDb(), 'reminders', reminderId);
    await updateDoc(reminderRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },

  async deleteReminder(reminderId: string) {
    await deleteDoc(doc(getDb(), 'reminders', reminderId));
  },

  async getUserReminders(userId: string) {
    const q = query(collection(getDb(), 'reminders'), where('userId', '==', userId), where('enabled', '==', true));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ ...doc.data() as MedicineReminder, id: doc.id }));
  },

  async getMedicineReminders(medicineId: string) {
    const q = query(collection(getDb(), 'reminders'), where('medicineId', '==', medicineId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ ...doc.data() as MedicineReminder, id: doc.id }));
  },
};

// User profile operations
export const profileService = {
  async setUserProfile(userId: string, profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>) {
    const timestamp = new Date().toISOString();
    const profileRef = doc(getDb(), 'profiles', userId);
    await setDoc(
      profileRef,
      {
        ...profile,
        id: userId,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      { merge: true }
    );
  },

  async getUserProfile(userId: string) {
    const docSnap = await getDoc(doc(getDb(), 'profiles', userId));
    return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
  },

  async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    const profileRef = doc(getDb(), 'profiles', userId);
    await updateDoc(profileRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },
};

// Medicine log operations
export const medicineLogService = {
  async addLog(userId: string, log: Omit<MedicineLog, 'id' | 'createdAt'>) {
    const docRef = await addDoc(collection(getDb(), 'medicineLogs'), {
      ...log,
      userId,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  },

  async getUserLogs(userId: string, limit: number = 100) {
    const q = query(collection(getDb(), 'medicineLogs'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .map((doc) => ({ ...doc.data() as MedicineLog, id: doc.id }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  },
};

// Backup operations
export const backupService = {
  async createBackupLog(userId: string, log: Omit<BackupLog, 'id' | 'createdAt'>) {
    const docRef = await addDoc(collection(getDb(), 'backups'), {
      ...log,
      userId,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  },

  async getUserBackupLogs(userId: string) {
    const q = query(collection(getDb(), 'backups'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .map((doc) => ({ ...doc.data() as BackupLog, id: doc.id }))
      .sort((a, b) => new Date(b.backupDate).getTime() - new Date(a.backupDate).getTime());
  },
};

// Analytics operations
export const analyticsService = {
  async saveAnalytics(userId: string, data: Omit<AnalyticsData, 'id' | 'createdAt'>) {
    const docRef = await addDoc(collection(getDb(), 'analytics'), {
      ...data,
      userId,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  },

  async getUserAnalytics(userId: string, days: number = 30) {
    const q = query(collection(getDb(), 'analytics'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const allData = querySnapshot.docs.map((doc) => ({ ...doc.data() as AnalyticsData, id: doc.id }));
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return allData.filter((item) => new Date(item.date) >= cutoffDate);
  },
};
