'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getMessaging, isSupported, Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Lazy initialization - only happens when first accessed
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let messaging: Messaging | null = null;
let initialized = false;

const initializeFirebase = () => {
  if (initialized) return;
  
  try {
    // Initialize Firebase app
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

    // Initialize Auth with persistence
    auth = getAuth(app);
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.error('[v0] Failed to set auth persistence:', error);
    });

    // Initialize Firestore
    db = getFirestore(app);

    // Initialize Storage
    storage = getStorage(app);

    // Initialize Cloud Messaging (if supported)
    isSupported().then((supported) => {
      if (supported && app) {
        messaging = getMessaging(app);
      }
    });

    initialized = true;
  } catch (error) {
    console.error('[v0] Firebase initialization error:', error);
  }
};

export const getFirebaseAuth = (): Auth => {
  if (!auth) {
    initializeFirebase();
  }
  if (!auth) {
    throw new Error('Firebase auth failed to initialize');
  }
  return auth;
};

export const getFirebaseDb = (): Firestore => {
  if (!db) {
    initializeFirebase();
  }
  if (!db) {
    throw new Error('Firebase db failed to initialize');
  }
  return db;
};

export const getFirebaseStorage = (): FirebaseStorage => {
  if (!storage) {
    initializeFirebase();
  }
  if (!storage) {
    throw new Error('Firebase storage failed to initialize');
  }
  return storage;
};

export const getFirebaseMessaging = (): Messaging | null => {
  if (!messaging) {
    initializeFirebase();
  }
  return messaging;
};

export const getFirebaseApp = (): FirebaseApp => {
  if (!app) {
    initializeFirebase();
  }
  if (!app) {
    throw new Error('Firebase app failed to initialize');
  }
  return app;
};
