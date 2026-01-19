/**
 * Firebase Admin SDK initialization for server-side operations
 * Used in API routes and server components
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import http from 'http';

function initAdmin() {
  console.log('[Firebase Admin] initAdmin() called, admin.apps.length:', admin.apps.length);
  // Return existing app if already initialized
  if (admin.apps.length > 0) {
    try {
      // Try to get the default app (no name)
      const defaultApp = admin.app();
      console.log('[Firebase Admin] Using existing default app:', defaultApp.name);
      return defaultApp;
    } catch (error) {
      // Default app doesn't exist, but there are named apps
      const appNames = admin.apps.map(a => a.name);
      console.warn('[Firebase Admin] Default app not found, but apps exist. App names:', appNames);
      // Use the first available app (could be a named app)
      const firstApp = admin.apps[0];
      console.log('[Firebase Admin] Using first available app:', firstApp.name);
      return firstApp;
    }
  }
  
  console.log('[Firebase Admin] No existing apps, starting initialization...');
  console.log('[Firebase Admin] Environment variables:', {
    hasFIREBASE_SERVICE_ACCOUNT_JSON: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    hasFIREBASE_SERVICE_ACCOUNT_PATH: !!process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    hasFIRESTORE_EMULATOR_HOST: !!process.env.FIRESTORE_EMULATOR_HOST,
    hasFIREBASE_EMULATOR_HUB: !!process.env.FIREBASE_EMULATOR_HUB,
    hasFUNCTION_TARGET: !!process.env.FUNCTION_TARGET,
    hasK_SERVICE: !!process.env.K_SERVICE,
    hasGCLOUD_PROJECT: !!process.env.GCLOUD_PROJECT,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });

  // First, try Application Default Credentials (ADC) in production
  // In Cloud Functions/Firebase Hosting, ADC should be automatically available
  const isProduction = !process.env.FIRESTORE_EMULATOR_HOST && !process.env.FIREBASE_EMULATOR_HUB;
  const isCloudFunction = !!(process.env.FUNCTION_TARGET || process.env.K_SERVICE || process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT);
  
  // Try ADC first in production (Cloud Functions automatically provides ADC)
  // Also try if we detect we're in a Google Cloud environment
  if (isProduction || isCloudFunction || process.env.GOOGLE_CLOUD_PROJECT) {
    try {
      console.log('[Firebase Admin] Attempting to initialize with Application Default Credentials (ADC)');
      console.log('[Firebase Admin] Environment check:', {
        isProduction,
        isCloudFunction,
        hasGCLOUD_PROJECT: !!process.env.GCLOUD_PROJECT,
        hasGOOGLE_CLOUD_PROJECT: !!process.env.GOOGLE_CLOUD_PROJECT,
        hasFUNCTION_TARGET: !!process.env.FUNCTION_TARGET,
        hasK_SERVICE: !!process.env.K_SERVICE,
      });
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'coursellm-afe61';
      // Try initializing without explicit credential - ADC should be used automatically
      // Don't specify a name to ensure it's the default app
      const app = admin.initializeApp({
        projectId: projectId,
      }, '[DEFAULT]'); // Explicitly set as default
      console.log('[Firebase Admin] Successfully initialized with Application Default Credentials for project:', projectId);
      return app;
    } catch (adcError) {
      const errorMsg = adcError instanceof Error ? adcError.message : String(adcError);
      console.warn('[Firebase Admin] ADC initialization failed, will try service account:', errorMsg);
      console.warn('[Firebase Admin] ADC error details:', {
        code: (adcError as any)?.code,
        stack: (adcError as Error)?.stack?.substring(0, 200),
      });
      // Fall through to try service account
    }
  }

  let serviceAccount: any = null;
  let loadMethod = 'none';

  // Try to get service account from environment variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const jsonString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      console.log('[Firebase Admin] Found FIREBASE_SERVICE_ACCOUNT_JSON, length:', jsonString.length);
      serviceAccount = JSON.parse(jsonString);
      loadMethod = 'FIREBASE_SERVICE_ACCOUNT_JSON';
      console.log('[Firebase Admin] Successfully loaded service account from FIREBASE_SERVICE_ACCOUNT_JSON');
      console.log('[Firebase Admin] Service account client_email:', serviceAccount.client_email);
    } catch (e) {
      console.error('[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON', e);
      console.error('[Firebase Admin] JSON string preview:', process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.substring(0, 100));
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
          // Initialize as default app (no name parameter)
          const app = admin.initializeApp({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
          }, '[DEFAULT]'); // Explicitly set as default
          
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
    
    // If we get here, we couldn't initialize with ADC or emulators
    console.error('[Firebase Admin] Service account not found. Load method attempted:', loadMethod);
    console.error('[Firebase Admin] Tried:');
    console.error('  - FIREBASE_SERVICE_ACCOUNT_JSON env var:', !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    console.error('  - FIREBASE_SERVICE_ACCOUNT_PATH env var:', process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 'not set');
    console.error('  - Application Default Credentials (ADC):', isCloudFunction);
    const defaultPath = path.resolve(process.cwd(), './service-account.json');
    console.error('  - ./service-account.json file exists:', fs.existsSync(defaultPath));
    console.error('[Firebase Admin] Please set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH environment variable.');
    throw new Error('Firebase Admin SDK not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH environment variable, or place service-account.json in the project root.');
  }

  // Initialize with service account
  try {
    console.log('[Firebase Admin] Initializing with service account, method:', loadMethod);
    // Initialize as default app (no name parameter) to ensure it's the default
    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'coursellm-afe61',
    }, '[DEFAULT]'); // Explicitly set as default
    console.log('[Firebase Admin] Successfully initialized with service account');
    return app;
  } catch (initError) {
    console.error('[Firebase Admin] Failed to initialize with service account:', initError);
    throw new Error(`Failed to initialize Firebase Admin SDK: ${initError instanceof Error ? initError.message : String(initError)}`);
  }
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
    try {
      console.log('[Firebase Admin] Getting Admin app...');
      const app = getAdminApp();
      console.log('[Firebase Admin] Admin app obtained:', app.name, 'apps count:', admin.apps.length);
      console.log('[Firebase Admin] Getting Firestore instance...');
      _adminDb = app.firestore();
      console.log('[Firebase Admin] Firestore instance obtained successfully');
      // Firebase Admin SDK automatically detects FIRESTORE_EMULATOR_HOST
      // No need for manual .settings() call - it can cause conflicts
    } catch (error) {
      console.error('[Firebase Admin] Failed to get Firestore instance:', error);
      console.error('[Firebase Admin] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        code: (error as any)?.code,
        stack: (error as Error)?.stack?.substring(0, 300),
      });
      throw new Error(`Firebase Admin SDK initialization failed: ${error instanceof Error ? error.message : String(error)}. Please ensure service account credentials are configured.`);
    }
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
