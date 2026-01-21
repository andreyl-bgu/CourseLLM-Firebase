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
  signInWithGoogle: () => Promise<void>;
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
    
    // Handle OAuth redirect result (when popup fails and redirect is used)
    // This must be called before onAuthStateChanged to process the redirect
    let redirectHandled = false;
    getRedirectResult(auth)
      .then((result) => {
        redirectHandled = true;
        if (result) {
          // User successfully signed in via redirect
          // onAuthStateChanged will be triggered automatically
          console.log("Redirect sign-in successful:", result.user.uid);
        }
      })
      .catch((error) => {
        redirectHandled = true;
        // Only log if it's not a "no redirect pending" error
        if (error.code !== "auth/no-auth-event") {
          console.error("Redirect sign-in error:", error);
        }
      });
    
    const unsub = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setFirebaseUser(user);
      if (user) {
        await loadProfile(user.uid);
      } else {
        setProfile(null);
        setOnboardingRequired(false);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function loadProfile(uid: string): Promise<Profile | null> {
    // #region agent log
    fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthProviderClient.tsx:121',message:'loadProfile called',data:{uid},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const docRef = doc(db, "users", uid);
    try {
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        // #region agent log
        fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthProviderClient.tsx:126',message:'Profile doc does not exist',data:{uid},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        setProfile(null);
        setOnboardingRequired(true);
        return null;
      }

      const data = snap.data() as Profile;
      // Determine completeness
      const isComplete = isProfileComplete(data);
      // #region agent log
      fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthProviderClient.tsx:133',message:'Profile loaded, checking completeness',data:{uid,hasRole:!!data.role,role:data.role,hasDepartment:!!data.department,department:data.department,hasCourses:Array.isArray(data.courses)&&data.courses.length>0,coursesCount:Array.isArray(data.courses)?data.courses.length:0,isComplete,onboardingRequired:!isComplete},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      setProfile({ ...data } as Profile);
      setOnboardingRequired(!isComplete);
      // #region agent log
      fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthProviderClient.tsx:136',message:'Profile state updated',data:{uid,onboardingRequired:!isComplete,profileSet:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return data;
    } catch (err: any) {
      // Firestore offline error (client is offline) or other transient network errors.
      // In this case, avoid forcing onboarding redirect. Leave profile null and
      // onboardingRequired false so UI can show an offline retry state instead of
      // redirecting the user to onboarding.
      const msg = err?.message || err?.code || "";
      if (msg.toString().toLowerCase().includes("client is offline") || err?.code === 'unavailable' || err?.code === 'failed-precondition') {
        console.warn("Firestore unavailable (offline?) - will not force onboarding:", err);
        setProfile(null);
        setOnboardingRequired(false);
          return null;
      }
      // Re-throw unexpected errors so they can be observed
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
    // #region agent log
    fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthProviderClient.tsx:162',message:'refreshProfile called',data:{hasFirebaseUser:!!firebaseUser,uid:firebaseUser?.uid||null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    // Try to use the current firebaseUser state, fallback to auth.currentUser if needed
    const current = firebaseUser || (auth && (auth.currentUser as FirebaseUser | null));
    if (!current) return null;
    const p = await loadProfile(current.uid);
    // #region agent log
    fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthProviderClient.tsx:167',message:'refreshProfile completed',data:{uid:current.uid,profileReturned:!!p,hasRole:!!p?.role,onboardingRequired},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    return p || null;
  }

  async function handleSignInWithGoogle() {
    await authService.signInWithGoogle();
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
