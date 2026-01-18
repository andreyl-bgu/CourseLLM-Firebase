/**
 * Firebase Admin SDK initialization for server-side operations
 * Used in API routes and server components
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import http from 'http';

function initAdmin() {
  // Return existing app if already initialized
  if (admin.apps.length > 0) {
    return admin.app();
  }

  let serviceAccount: any = null;
  let loadMethod = 'none';

  // Try to get service account from environment variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      loadMethod = 'FIREBASE_SERVICE_ACCOUNT_JSON';
      console.log('[Firebase Admin] Loaded service account from FIREBASE_SERVICE_ACCOUNT_JSON');
    } catch (e) {
      console.error('[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON', e);
    }
  } 
  // Try to get service account from file path
  else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    try {
      const p = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf8');
        serviceAccount = JSON.parse(raw);
        loadMethod = 'FIREBASE_SERVICE_ACCOUNT_PATH';
        console.log('[Firebase Admin] Loaded service account from', process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      } else {
        console.error('[Firebase Admin] Service account file not found at:', p);
      }
    } catch (e) {
      console.error('[Firebase Admin] Failed to read service account file', e);
    }
  }
  // Try default path if no env var is set (for local development)
  else {
    try {
      const defaultPath = path.resolve(process.cwd(), './service-account.json');
      if (fs.existsSync(defaultPath)) {
        const raw = fs.readFileSync(defaultPath, 'utf8');
        serviceAccount = JSON.parse(raw);
        loadMethod = 'default path';
        console.log('[Firebase Admin] Loaded service account from default path: ./service-account.json');
      } else {
        console.warn('[Firebase Admin] Default service account file not found at:', defaultPath);
      }
    } catch (e) {
      console.error('[Firebase Admin] Error reading default service account file:', e);
    }
  }

  // If no service account, check if we're in a development environment with emulators
  if (!serviceAccount) {
    // Check if we're using Firebase emulators (local development)
    const useEmulator = process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_EMULATOR_HUB;
    
    // #region agent log
    const logData = JSON.stringify({location:'firebase-admin.ts:65',message:'Checking for emulator',data:{hasFIRESTORE_EMULATOR_HOST:!!process.env.FIRESTORE_EMULATOR_HOST,hasFIREBASE_EMULATOR_HUB:!!process.env.FIREBASE_EMULATOR_HUB,FIRESTORE_EMULATOR_HOST:process.env.FIRESTORE_EMULATOR_HOST||'not set',FIREBASE_EMULATOR_HUB:process.env.FIREBASE_EMULATOR_HUB||'not set',useEmulator:!!useEmulator,loadMethod},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'});
    const req = http.request({hostname:'127.0.0.1',port:7247,path:'/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',method:'POST',headers:{'Content-Type':'application/json'}},()=>{});req.on('error',()=>{});req.write(logData);req.end();
    // #endregion
    
    if (useEmulator) {
      // For emulators, we can initialize without credentials
      try {
        // #region agent log
        const logData2 = JSON.stringify({location:'firebase-admin.ts:70',message:'Initializing Admin SDK for emulator',data:{projectId:process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID||'demo-project',hasGOOGLE_APPLICATION_CREDENTIALS:!!process.env.GOOGLE_APPLICATION_CREDENTIALS},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'});
        const req2 = http.request({hostname:'127.0.0.1',port:7247,path:'/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',method:'POST',headers:{'Content-Type':'application/json'}},()=>{});req2.on('error',()=>{});req2.write(logData2);req2.end();
        // #endregion
        // Temporarily unset GOOGLE_APPLICATION_CREDENTIALS to prevent SDK from trying to read it
        const originalCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        if (originalCreds) {
          delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
        }
        try {
          const app = admin.initializeApp({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
          });
          
          // #region agent log
          const logData3 = JSON.stringify({location:'firebase-admin.ts:86',message:'Admin SDK initialized for emulator',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'});
          const req3 = http.request({hostname:'127.0.0.1',port:7247,path:'/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',method:'POST',headers:{'Content-Type':'application/json'}},()=>{});req3.on('error',()=>{});req3.write(logData3);req3.end();
          // #endregion
          console.log('[Firebase Admin] Initialized for emulator use');
          // Note: Firestore settings will be applied in getAdminDb() before first use
          return app;
        } finally {
          // Restore original value if it existed
          if (originalCreds) {
            process.env.GOOGLE_APPLICATION_CREDENTIALS = originalCreds;
          }
        }
      } catch (e) {
        // #region agent log
        const logData4 = JSON.stringify({location:'firebase-admin.ts:80',message:'Failed to initialize for emulator',data:{error:e instanceof Error?e.message:'Unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'});
        const req4 = http.request({hostname:'127.0.0.1',port:7247,path:'/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',method:'POST',headers:{'Content-Type':'application/json'}},()=>{});req4.on('error',()=>{});req4.write(logData4);req4.end();
        // #endregion
        console.error('[Firebase Admin] Failed to initialize for emulator:', e);
      }
    }
    
    // In production/Codespace, we need service account
    console.error('[Firebase Admin] Service account not found. Load method attempted:', loadMethod);
    console.error('[Firebase Admin] Tried:');
    console.error('  - FIREBASE_SERVICE_ACCOUNT_JSON env var:', !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    console.error('  - FIREBASE_SERVICE_ACCOUNT_PATH env var:', process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 'not set');
    const defaultPath = path.resolve(process.cwd(), './service-account.json');
    console.error('  - ./service-account.json file exists:', fs.existsSync(defaultPath));
    console.error('[Firebase Admin] Please set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH environment variable.');
    throw new Error('Firebase Admin SDK not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH environment variable, or place service-account.json in the project root.');
  }

  // Initialize with service account
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  return admin.app();
}

// Lazy initialization - only initialize when needed to avoid errors at module load time
let _app: admin.app.App | null = null;
let _adminDb: admin.firestore.Firestore | null = null;

function getAdminApp(): admin.app.App {
  if (!_app) {
    _app = initAdmin();
  }
  return _app;
}

function getAdminDb(): admin.firestore.Firestore {
  if (!_adminDb) {
    _adminDb = getAdminApp().firestore();
    // Firebase Admin SDK automatically detects FIRESTORE_EMULATOR_HOST
    // No need for manual .settings() call - it can cause conflicts
  }
  return _adminDb;
}

// Export getter function - call this when you need the Firestore instance
export function getAdminFirestore(): admin.firestore.Firestore {
  return getAdminDb();
}

// Export adminDb as a getter property (lazy)
export const adminDb = {
  get collection() {
    return getAdminDb().collection.bind(getAdminDb());
  },
  // Add other commonly used methods as needed
} as admin.firestore.Firestore;

export default getAdminApp;
