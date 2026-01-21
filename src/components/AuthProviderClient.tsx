"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, getRedirectResult, type User as FirebaseUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import * as authService from "@/lib/authService";

type Profile = {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role?: "student" | "teacher";
  department?: string;
  courses?: string[];
  authProviders?: string[];
  createdAt?: any;
  updatedAt?: any;
};

type AuthContextValue = {
  firebaseUser: FirebaseUser | null;
  profile: Profile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<any>;
  signInWithEmail: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<Profile | null>;
  onboardingRequired: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProviderClient");
  return ctx;
};

// Check for test auth bypass via localStorage (set by test/signin page)
function getTestAuth(): { uid: string; role: "student" | "teacher" } | null {
  if (typeof window === 'undefined') return null;
  try {
    const testAuth = localStorage.getItem('__test_auth__');
    if (testAuth) {
      return JSON.parse(testAuth);
    }
  } catch {
    // Ignore parsing errors
  }
  return null;
}

export const AuthProviderClient: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingRequired, setOnboardingRequired] = useState(false);

  useEffect(() => {
    // Check for test auth bypass first
    const testAuth = getTestAuth();
    if (testAuth) {
      // Create a fake user and profile for testing
      const fakeUser = {
        uid: testAuth.uid,
        email: `${testAuth.uid}@example.test`,
        displayName: testAuth.uid,
      } as unknown as FirebaseUser;
      
      const fakeProfile: Profile = {
        uid: testAuth.uid,
        email: `${testAuth.uid}@example.test`,
        displayName: testAuth.uid,
        role: testAuth.role,
        department: "Test Department",
        courses: ["TEST101"],
      };
      
      setFirebaseUser(fakeUser);
      setProfile(fakeProfile);
      setOnboardingRequired(false);
      setLoading(false);
      return;
    }
    
    // Initialize auth state
    let authStateListener: (() => void) | null = null;
    
    (async () => {
      // Check if we might be returning from a redirect (URL might have auth params)
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const mightBeRedirect = urlParams && (urlParams.has('apiKey') || urlParams.has('mode') || window.location.hash.includes('auth'));
      // #region agent log
      if (typeof window !== 'undefined') {
        let redirectAttempt = null;
        try {
          redirectAttempt = sessionStorage.getItem('__redirect_attempt__');
        } catch {}
        fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthProviderClient.tsx:94',message:'Auth init snapshot',data:{href:window.location.href,hash:window.location.hash,search:window.location.search,mightBeRedirect,redirectAttempt},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
        if (redirectAttempt) {
          try { sessionStorage.removeItem('__redirect_attempt__'); } catch {}
        }
      }
      // #endregion
      // #region agent log
      if (typeof window !== 'undefined') {
        fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthProviderClient.tsx:95',message:'Checking /__/auth/handler reachability',data:{path:'/__/auth/handler'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
        fetch('/__/auth/handler',{method:'GET',redirect:'manual'}).then((res)=>{fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthProviderClient.tsx:95',message:'__/auth/handler response',data:{status:res.status,type:res.type,redirected:res.redirected},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});}).catch((err)=>{fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthProviderClient.tsx:95',message:'__/auth/handler fetch failed',data:{message:typeof err?.message==='string'?err.message.slice(0,160):null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});});
      }
      // #endregion
      
      // #region agent log
      fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthProviderClient.tsx:96',message:'About to call getRedirectResult',data:{href:typeof window!=='undefined'?window.location.href:null,hash:typeof window!=='undefined'?window.location.hash:null,search:typeof window!=='undefined'?window.location.search:null,mightBeRedirect},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      try {
        // Check for redirect result first - this processes OAuth redirects
        const redirectResult = await getRedirectResult(auth);
        // #region agent log
        fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthProviderClient.tsx:102',message:'getRedirectResult completed',data:{hasResult:!!redirectResult,userId:redirectResult?.user?.uid||null,mightBeRedirect},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        if (redirectResult) {
          // User successfully signed in via redirect
          console.log("Redirect sign-in successful:", redirectResult.user.uid);
        } else if (mightBeRedirect) {
          // getRedirectResult returned null but we might be returning from redirect
          // Check auth.currentUser directly as fallback
          const checkUser = () => {
            const currentUser = auth.currentUser;
            if (currentUser) {
              setFirebaseUser(currentUser);
              loadProfile(currentUser.uid);
              return true;
            }
            return false;
          };
          
          // Check immediately
          if (!checkUser()) {
            // Check again after a delay
            setTimeout(checkUser, 1500);
          }
        }
      } catch (error: any) {
        // #region agent log
        fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthProviderClient.tsx:catch',message:'getRedirectResult threw error',data:{code:error?.code||null,message:typeof error?.message==='string'?error.message.slice(0,200):null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        // Only log if it's not a "no redirect pending" error (which is normal)
        if (error.code !== "auth/no-auth-event" && error.code !== "auth/operation-not-allowed") {
          console.error("Redirect sign-in error:", error.code, error.message);
        }
      }
      
      // Now set up the auth state listener
      authStateListener = onAuthStateChanged(auth, async (user) => {
        // #region agent log
        fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthProviderClient.tsx:129',message:'onAuthStateChanged fired',data:{hasUser:!!user,userId:user?.uid||null,userEmail:user?.email||null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        setLoading(true);
        setFirebaseUser(user);
        if (user) {
          await loadProfile(user.uid);
        } else {
          setProfile(null);
          setOnboardingRequired(false);
        }
        setLoading(false);
        // #region agent log
        fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthProviderClient.tsx:140',message:'onAuthStateChanged done loading',data:{hasUser:!!user,loadingNow:false},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
      });
    })();
    
    return () => {
      if (authStateListener) {
        authStateListener();
      }
    };
  }, []);

  async function loadProfile(uid: string): Promise<Profile | null> {
    const docRef = doc(db, "users", uid);
    try {
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        setProfile(null);
        setOnboardingRequired(true);
        return null;
      }

      const data = snap.data() as Profile;
      const isComplete = isProfileComplete(data);
      setProfile({ ...data } as Profile);
      setOnboardingRequired(!isComplete);
      return data;
    } catch (err: any) {
      // Firestore offline error or other transient network errors
      const msg = err?.message || err?.code || "";
      if (msg.toString().toLowerCase().includes("client is offline") || err?.code === 'unavailable' || err?.code === 'failed-precondition') {
        console.warn("Firestore unavailable (offline?) - will not force onboarding:", err);
        setProfile(null);
        setOnboardingRequired(false);
        return null;
      }
      throw err;
    }
  }

  function isProfileComplete(p: Profile | null | undefined) {
    if (!p) return false;
    const hasRole = p.role === "student" || p.role === "teacher";
    const hasDepartment = !!(p.department && p.department.toString().trim().length > 0);
    const hasCourses = Array.isArray(p.courses) && p.courses.length > 0;
    return hasRole && hasDepartment && hasCourses;
  }

  async function refreshProfile(): Promise<Profile | null> {
    const current = firebaseUser || (auth && (auth.currentUser as FirebaseUser | null));
    if (!current) return null;
    return await loadProfile(current.uid);
  }

  async function handleSignInWithGoogle() {
    return await authService.signInWithGoogle();
  }

  async function handleSignInWithEmail(email: string, password: string) {
    return await authService.signInWithEmail(email, password);
  }

  async function handleSignOut() {
    await authService.signOutUser();
    setProfile(null);
    setOnboardingRequired(false);
  }

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        loading,
        signInWithGoogle: handleSignInWithGoogle,
        signInWithEmail: handleSignInWithEmail,
        signOut: handleSignOut,
        refreshProfile,
        onboardingRequired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProviderClient;
