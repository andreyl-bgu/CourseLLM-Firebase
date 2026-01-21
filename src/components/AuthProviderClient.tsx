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
      
      try {
        // Check for redirect result first - this processes OAuth redirects
        const redirectResult = await getRedirectResult(auth);
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
        // Only log if it's not a "no redirect pending" error (which is normal)
        if (error.code !== "auth/no-auth-event" && error.code !== "auth/operation-not-allowed") {
          console.error("Redirect sign-in error:", error.code, error.message);
        }
      }
      
      // Now set up the auth state listener
      authStateListener = onAuthStateChanged(auth, async (user) => {
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
