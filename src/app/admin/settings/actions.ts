
'use server';
/**
 * @fileOverview Server-side actions for managing profile settings.
 * These functions read from and write to the Firebase Realtime Database.
 */

import { adminApp } from '@/lib/firebase-admin';
import { getDatabase } from 'firebase-admin/database';
import { db as clientDb } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export interface ProfileSettings {
    name: string;
    phone: string;
    email: string;
    address: string;
    profilePictureUrl: string;
    coverPhotoUrl: string;
    galleryPhotos: { url: string }[];
}

// Use admin SDK if available, otherwise use client SDK with Firestore
const db = adminApp ? getDatabase(adminApp) : null;
const settingsRef = db ? db.ref('admin/profileSettings') : null;

/**
 * Saves the profile settings to the Firebase Realtime Database.
 * @param settings The profile settings object to save.
 * @returns A promise that resolves when the settings are saved.
 */
export async function saveProfileSettings(settings: ProfileSettings): Promise<void> {
  try {
    if (settingsRef) {
      // Use Admin SDK with Realtime Database
      await settingsRef.set(settings);
      console.log("Profile settings saved successfully to Realtime Database.");
    } else {
      // Fallback to Firestore with client SDK
      console.log("Using Firestore fallback for profile settings");
      const settingsDoc = doc(clientDb, 'admin', 'profileSettings');
      await setDoc(settingsDoc, settings);
      console.log("Profile settings saved successfully to Firestore.");
    }
    
    // Revalidar as páginas que usam essas configurações
    revalidatePath('/');
    revalidatePath('/admin/settings');
    revalidatePath('/api/admin/profile-settings');
    
  } catch (error: any) {
    console.error("Error saving profile settings:", error);
    throw new Error("Failed to save settings to the database.");
  }
}

/**
 * Retrieves the profile settings from the Firebase Realtime Database.
 * @returns A promise that resolves with the profile settings object, or null if not found.
 */
export async function getProfileSettings(): Promise<ProfileSettings | null> {
  try {
    if (settingsRef) {
      // Use Admin SDK with Realtime Database
      const snapshot = await settingsRef.once('value');
      if (snapshot.exists()) {
        console.log("Profile settings loaded successfully from Realtime Database.");
        return snapshot.val() as ProfileSettings;
      }
      console.log("No profile settings found in the Realtime Database.");
      return null;
    } else {
      // Fallback to Firestore with client SDK
      console.log("Using Firestore fallback for profile settings");
      const settingsDoc = doc(clientDb, 'admin', 'profileSettings');
      const docSnap = await getDoc(settingsDoc);
      
      if (docSnap.exists()) {
        console.log("Profile settings loaded successfully from Firestore.");
        return docSnap.data() as ProfileSettings;
      }
      console.log("No profile settings found in Firestore.");
      return null;
    }
  } catch (error: any) {
    console.error("Error getting profile settings:", error);
    throw new Error("Failed to retrieve settings from the database.");
  }
}
