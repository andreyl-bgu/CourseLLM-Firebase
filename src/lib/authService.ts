import { auth, googleProvider } from "./firebase";
import { signInWithPopup, signOut, signInWithRedirect } from "firebase/auth";

export async function signInWithGoogle() {
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authService.ts:6',message:'signInWithGoogle called',data:{authAppName:auth.app.name,origin:window.location.origin,hostname:window.location.hostname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  }
  // #endregion
  try {
    const res = await signInWithPopup(auth, googleProvider);
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authService.ts:9',message:'signInWithPopup succeeded',data:{userId:res.user.uid},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    }
    // #endregion
    return res.user;
  } catch (err: any) {
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authService.ts:12',message:'signInWithPopup error',data:{errorCode:err?.code||'N/A',errorMessage:err?.message||'Unknown',errorName:err?.name||'N/A'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    }
    // #endregion
    // Check for popup-blocked error code explicitly
    const errorCode = err?.code || "";
    const msg = err?.message || "";
    
    // Handle popup-blocked errors: fall back to redirect-based sign-in
    if (errorCode === "auth/popup-blocked" || 
        errorCode === "auth/popup-closed-by-user" ||
        /cross-?origin|opener|blocked a frame|window\.closed|popup.*blocked/i.test(msg)) {
      console.warn("Popup blocked or closed, falling back to redirect sign-in.");
      // #region agent log
      if (typeof window !== 'undefined') {
        fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authService.ts:29',message:'Falling back to redirect sign-in',data:{errorCode,originalError:msg},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      }
      // #endregion
      try {
        await signInWithRedirect(auth, googleProvider);
        return null as any; // control will not reach here in redirect flow
      } catch (redirectErr) {
        handleAuthError(redirectErr);
        throw redirectErr;
      }
    }
    handleAuthError(err);
    throw err;
  }
}

export async function signOutUser() {
  await signOut(auth);
}

export function handleAuthError(err: any) {
  if (!err) return;
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authService.ts:47',message:'handleAuthError called',data:{errorCode:err?.code||'N/A',errorMessage:err?.message||'Unknown',origin:window.location.origin},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  }
  // #endregion
  const errorCode = err?.code || "";
  const msg = err?.message || "";
  
  // Basic cases - the UI can show friendlier messages
  if (errorCode === "auth/popup-closed-by-user") {
    console.warn("Auth popup closed by user");
    return;
  }
  if (errorCode === "auth/popup-blocked") {
    console.warn("Auth popup blocked by browser. Falling back to redirect sign-in.");
    return;
  }
  if (errorCode === "auth/network-request-failed") {
    console.warn("Network error");
    return;
  }
  // Cross-origin opener / popup blocking issues
  if (/cross-?origin|opener|blocked a frame|window\.closed|popup.*blocked/i.test(msg)) {
    console.warn("Popup-based sign-in blocked by browser COOP/COEP or embedding policy. Try enabling third-party cookies or use redirect-based sign-in.");
    return;
  }
  console.error("Auth error", err);
}
