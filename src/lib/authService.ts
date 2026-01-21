import { auth, googleProvider } from "./firebase";
import { signOut, signInWithRedirect } from "firebase/auth";

export async function signInWithGoogle() {
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authService.ts:6',message:'signInWithGoogle called - using redirect only',data:{authAppName:auth.app.name,origin:window.location.origin,hostname:window.location.hostname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  }
  // #endregion
  
  // Use redirect-only flow to avoid popup blocking issues
  // This is more reliable across different browsers and environments
  try {
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authService.ts:12',message:'Calling signInWithRedirect (no popup attempt)',data:{url:window.location.href,authDomain:auth.app.options.authDomain},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    }
    // #endregion
    await signInWithRedirect(auth, googleProvider);
    // Note: signInWithRedirect will navigate away, so this return won't execute
    // The redirect result will be handled by getRedirectResult() in AuthProviderClient
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authService.ts:17',message:'signInWithRedirect completed (should navigate)',data:{url:window.location.href},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    }
    // #endregion
    return null as any;
  } catch (redirectErr: any) {
    console.error("Redirect sign-in failed:", redirectErr);
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authService.ts:23',message:'signInWithRedirect failed',data:{errorCode:redirectErr?.code||'N/A',errorMessage:redirectErr?.message||'Unknown',url:window.location.href},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    }
    // #endregion
    handleAuthError(redirectErr);
    throw redirectErr;
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
