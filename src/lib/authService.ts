import { auth, googleProvider } from "./firebase";
import { signOut, signInWithRedirect, signInWithEmailAndPassword } from "firebase/auth";

export async function signInWithGoogle() {
  // Use redirect-only flow to avoid popup blocking issues
  // This is more reliable across different browsers and environments
  try {
    await signInWithRedirect(auth, googleProvider);
    // Note: signInWithRedirect will navigate away, so this return won't execute
    // The redirect result will be handled by getRedirectResult() in AuthProviderClient
    return null as any;
  } catch (redirectErr: any) {
    console.error("Redirect sign-in failed:", redirectErr);
    handleAuthError(redirectErr);
    throw redirectErr;
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
