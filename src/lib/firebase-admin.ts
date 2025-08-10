// src/lib/firebase-admin.ts
/**
 * @fileOverview Initializes and exports the Firebase Admin SDK instance.
 */

import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// SEGURANÇA: Usando variáveis de ambiente separadas em vez de JSON completo
const getServiceAccountFromEnv = () => {
  // Primeiro tenta usar as variáveis separadas (mais seguro)
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    return {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL?.replace('@', '%40')}`,
      universe_domain: "googleapis.com"
    };
  }
  
  // Fallback para o JSON completo (menos seguro)
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    throw new Error('Firebase credentials not found. Set either individual env vars or GOOGLE_APPLICATION_CREDENTIALS_JSON');
  }
  
  try {
    return JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
  } catch (error) {
    throw new Error('Invalid JSON in GOOGLE_APPLICATION_CREDENTIALS_JSON');
  }
};

let adminApp: App | null = null;

/**
 * Initializes the Firebase Admin SDK if not already initialized.
 * This function handles creating a single instance of the Firebase Admin App.
 *
 * @returns {App | null} The initialized Firebase Admin App instance or null if initialization fails.
 */
function initializeFirebaseAdmin(): App | null {
  // If an app is already initialized, return it to prevent errors.
  if (getApps().length) {
    console.log('[Admin SDK] Re-using existing Firebase Admin instance.');
    return getApps()[0];
  }

  try {
    const serviceAccount = getServiceAccountFromEnv();
    const app = initializeApp({
      credential: cert(serviceAccount as any),
      databaseURL: "https://authkit-y9vjx-default-rtdb.firebaseio.com",
      storageBucket: "authkit-y9vjx.firebasestorage.app"
    });
    console.log('[Admin SDK] Firebase Admin SDK initialized successfully with service account.');
    return app;

  } catch (error: any) {
    console.error('[Admin SDK] Error during Firebase Admin initialization:', error);
    console.log('[Admin SDK] Firebase Admin SDK initialization failed.');
    return null;
  }
}

// Initialize the app and store the instance.
adminApp = initializeFirebaseAdmin();

// Initialize Firestore and Storage
let adminDb: any = null;
let adminStorage: any = null;

if (adminApp) {
  adminDb = getFirestore(adminApp);
  adminStorage = getStorage(adminApp);
} else {
  console.error('[Firebase Admin] Failed to initialize services - adminApp is null');
}

export { adminApp, adminDb, adminStorage };
