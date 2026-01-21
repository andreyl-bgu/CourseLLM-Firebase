// Firebase configuration - combined auth and quiz features
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// #region agent log
if (typeof window !== 'undefined') {
  fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'firebase.ts:config',message:'Firebase config loaded',data:{authDomain:firebaseConfig.authDomain||'NOT_SET',projectId:firebaseConfig.projectId||'NOT_SET',hasApiKey:!!firebaseConfig.apiKey,currentHost:window.location.host},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
}
// #endregion

// Initialize Firebase (avoid reinitializing if already initialized)
let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
} catch (initError: any) {
  throw initError;
}

// Initialize Auth with local persistence for redirect flow
export const auth = getAuth(app);

// Set persistence to LOCAL to ensure user stays logged in after redirect
if (typeof window !== 'undefined') {
  // #region agent log
  fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'firebase.ts:persistence',message:'Attempting setPersistence(browserLocalPersistence)',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
  // #endregion
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    // #region agent log
    fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'firebase.ts:persistence',message:'setPersistence failed',data:{code:err?.code||null,message:typeof err?.message==='string'?err.message.slice(0,160):null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
    // #endregion
    console.warn("Could not set auth persistence:", err);
  });
}

// Connect to Auth emulator only if explicitly enabled via environment variable
if (typeof window !== 'undefined') {
  const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' || 
                      process.env.FIREBASE_AUTH_EMULATOR_HOST;
  
  if (useEmulator) {
    const { connectAuthEmulator } = require('firebase/auth');
    const authEmulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
    try {
      connectAuthEmulator(auth, `http://${authEmulatorHost}`, { disableWarnings: true });
      console.log(`[Firebase] Connected to Auth emulator at http://${authEmulatorHost}`);
    } catch (err: any) {
      // Emulator might already be connected or connection failed
      if (!err.message?.includes('already been called') && !err.message?.includes('already connected')) {
        console.warn('[Firebase] Could not connect to Auth emulator:', err.message);
      }
    }
  }
}

export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore
export const db = getFirestore(app);

// Enable offline persistence so reads can be served from cache when offline.
// This is a best-effort call: it will fail in some environments (e.g. Safari private mode)
// and when multiple tabs conflict. We catch and ignore expected errors.
try {
  enableIndexedDbPersistence(db).catch((err) => {
    // failed-precondition: multiple tabs open, unimplemented: browser not supported
    console.warn("Could not enable IndexedDB persistence:", err.code || err.message || err);
  });
} catch (e) {
  // Ignore synchronous errors
  console.warn("Persistence enable failed:", e);
}

// Initialize Analytics (only in browser)
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export { app, analytics };
export default app;
