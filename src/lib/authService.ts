import { auth, googleProvider } from "./firebase";
import { signOut, signInWithRedirect, signInWithEmailAndPassword } from "firebase/auth";

export async function signInWithGoogle() {
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authService.ts:signInWithGoogle',message:'Starting Google sign-in',data:{origin:window.location.origin,host:window.location.host},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
  }
  // #endregion
  
  // Check if web storage is available (required for redirect flow)
  let storageAvailable = false;
  try {
    const testKey = '__firebase_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authService.ts:signInWithGoogle',message:'Storage availability check',data:{storageAvailable},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
  }
  // #endregion
  
  // Require storage for redirect flow
  if (!storageAvailable) {
    const err: any = new Error("Web storage is unavailable for redirect sign-in.");
    err.code = "auth/web-storage-unsupported";
    throw err;
  }
  
  // Try redirect flow (preferred for normal browsing)
  try {
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authService.ts:signInWithGoogle',message:'Calling signInWithRedirect',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
    }
    // #endregion
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('__redirect_attempt__', String(Date.now()));
      } catch {}
    }
    await signInWithRedirect(auth, googleProvider);
    // #region agent log
    fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authService.ts:signInWithRedirect',message:'signInWithRedirect returned without navigation',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
    // #endregion
    // signInWithRedirect navigates away, this line should not execute if redirect happens
    return null;
  } catch (err: any) {
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authService.ts:signInWithRedirect:error',message:'signInWithRedirect failed',data:{code:err?.code||null,message:err?.message?.slice(0,150)||null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
    }
    // #endregion
    console.error("Redirect sign-in failed:", err);
    handleAuthError(err);
    throw err;
  }
}

export async function signInWithEmail(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (err: any) {
    console.error("Email sign-in failed:", err);
    handleAuthError(err);
    throw err;
  }
}

export async function signOutUser() {
  await signOut(auth);
}

export function handleAuthError(err: any) {
  if (!err) return;
  const errorCode = err?.code || "";
  const msg = err?.message || "";
  
  if (errorCode === "auth/popup-closed-by-user") {
    console.warn("Auth popup closed by user");
    return;
  }
  if (errorCode === "auth/popup-blocked") {
    console.warn("Auth popup blocked by browser");
    return;
  }
  if (errorCode === "auth/network-request-failed") {
    console.warn("Network error");
    return;
  }
  if (/cross-?origin|opener|blocked a frame|window\.closed|popup.*blocked/i.test(msg)) {
    console.warn("Cross-origin issue:", msg);
    return;
  }
  console.error("Auth error", err);
}
