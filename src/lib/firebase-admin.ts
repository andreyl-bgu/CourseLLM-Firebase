/**
 * Firebase Admin SDK initialization for server-side operations
 * Used in API routes and server components
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

function initAdmin() {
  // Return existing app if already initialized
  if (admin.apps.length > 0) {
    return admin.app();
  }

  let serviceAccount: any = null;

  // Try to get service account from environment variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } catch (e) {
      console.error('[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON', e);
    }
  } 
  // Try to get service account from file path
  else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    try {
      const p = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      const raw = fs.readFileSync(p, 'utf8');
      serviceAccount = JSON.parse(raw);
    } catch (e) {
      console.error('[Firebase Admin] Failed to read service account file', e);
    }
  }

  // If no service account, try to use default credentials (for production/emulator)
  if (!serviceAccount) {
    try {
      // Try to initialize with default credentials (works in production or with emulator)
      admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
      console.log('[Firebase Admin] Initialized with default credentials');
      return admin.app();
    } catch (e) {
      console.error('[Firebase Admin] Failed to initialize:', e);
      throw new Error('Firebase Admin SDK not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH');
    }
  }

  // Initialize with service account
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  return admin.app();
}

// Initialize and export
const app = initAdmin();
export const adminDb = admin.firestore();
export default app;
