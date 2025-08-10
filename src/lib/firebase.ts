// FIRST: Disable App Check before any Firebase imports
import './disable-app-check';

// Import the functions you need from the SDKs
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase, query, orderByChild, ref, off } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getStorage }from "firebase/storage";

// CRITICAL: Disable App Check completely before any Firebase initialization
if (typeof window !== 'undefined') {
  // Set the debug token BEFORE any Firebase initialization
  (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  
  // Also disable in different potential locations
  if (typeof self !== 'undefined') {
    (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  
  // Set in localStorage as well (some versions check here)
  try {
    localStorage.setItem('FIREBASE_APPCHECK_DEBUG_TOKEN', 'true');
  } catch (e) {
    // Ignore localStorage errors in case it's not available
  }
  
  console.log('[Firebase] App Check disabled with debug token');
}

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);


export { app, firebaseConfig, db, auth, database, storage, query, orderByChild, ref, off };

