"use client";

import React, { useRef } from "react";
import { useAuth } from "./AuthProviderClient";
import { useRouter, usePathname } from "next/navigation";

export const RoleGuardClient: React.FC<{
  requiredRole?: "student" | "teacher";
  children: React.ReactNode;
}> = ({ requiredRole, children }) => {
  const { firebaseUser, profile, loading, onboardingRequired } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const redirectingRef = useRef(false);

  React.useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RoleGuardClient.tsx:16',message:'RoleGuardClient useEffect triggered',data:{loading,hasFirebaseUser:!!firebaseUser,hasProfile:!!profile,profileRole:profile?.role,onboardingRequired,requiredRole,pathname,redirectingRef:redirectingRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (loading) {
      redirectingRef.current = false;
      return;
    }

    // Prevent rapid successive redirects
    if (redirectingRef.current) {
      // #region agent log
      fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RoleGuardClient.tsx:23',message:'Redirect already in progress, skipping',data:{pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return;
    }

    if (!firebaseUser) {
      // Only redirect to login if not already there
      if (pathname !== "/login") {
        // #region agent log
        fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RoleGuardClient.tsx:28',message:'Redirecting to login (no user)',data:{from:pathname,to:'/login'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        redirectingRef.current = true;
        router.replace("/login");
      }
      return;
    }

    if (onboardingRequired) {
      // Only redirect to onboarding if not already there
      if (pathname !== "/onboarding") {
        // #region agent log
        fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RoleGuardClient.tsx:36',message:'Redirecting to onboarding',data:{from:pathname,to:'/onboarding',onboardingRequired},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        redirectingRef.current = true;
        router.replace("/onboarding");
      }
      return;
    }

    // If a role is required but the profile is missing or incomplete
    if (requiredRole && (!profile || !profile.role)) {
      // Edge case: profile is null but onboardingRequired is false (network error)
      // In this case, don't redirect immediately - wait for profile to load
      // or show loading state instead of redirecting to onboarding
      if (profile === null && !onboardingRequired) {
        // This is likely a network error - wait a bit before redirecting
        // The AuthProviderClient sets onboardingRequired=false on network errors
        // to avoid forcing redirects. We should show loading here.
        return;
      }
      // Only redirect to onboarding if not already there
      if (pathname !== "/onboarding") {
        redirectingRef.current = true;
        router.replace("/onboarding");
      }
      return;
    }

    // If profile exists but role doesn't match requiredRole, redirect to their dashboard
    if (requiredRole && profile?.role && profile.role !== requiredRole) {
      const to = profile.role === "teacher" ? "/teacher" : "/student";
      // Only redirect if not already on the target page
      if (pathname !== to) {
        redirectingRef.current = true;
        router.replace(to);
      }
      return;
    }

    // Reset redirect flag when conditions are met
    redirectingRef.current = false;
  }, [loading, firebaseUser, onboardingRequired, profile, requiredRole, router, pathname]);

  // Show loading if:
  // - Still loading auth state
  // - Not authenticated
  // - Onboarding required
  // - Profile is null but we're waiting (network error case)
  if (loading || !firebaseUser || onboardingRequired || (requiredRole && !profile && !onboardingRequired)) {
    return <div>Loading...</div>;
  }
  // role matched or not required
  return <>{children}</>;
};

export default RoleGuardClient;
