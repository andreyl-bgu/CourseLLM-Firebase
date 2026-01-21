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
    fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RoleGuardClient.tsx:16',message:'RoleGuardClient useEffect',data:{loading,hasFirebaseUser:!!firebaseUser,hasProfile:!!profile,profileRole:profile?.role||null,onboardingRequired,requiredRole,pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    if (loading) {
      redirectingRef.current = false;
      return;
    }

    // Prevent rapid successive redirects
    if (redirectingRef.current) {
      return;
    }

    if (!firebaseUser) {
      // Only redirect to login if not already there
      if (pathname !== "/login") {
        // #region agent log
        fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RoleGuardClient.tsx:31',message:'RoleGuardClient redirecting to /login (no user)',data:{pathname,requiredRole},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        redirectingRef.current = true;
        router.replace("/login");
      }
      return;
    }

    if (onboardingRequired) {
      // Only redirect to onboarding if not already there
      if (pathname !== "/onboarding") {
        redirectingRef.current = true;
        router.replace("/onboarding");
      }
      return;
    }

    // If a role is required but the profile is missing or incomplete
    if (requiredRole && (!profile || !profile.role)) {
      // Edge case: profile is null but onboardingRequired is false (network error)
      if (profile === null && !onboardingRequired) {
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
