"use client";

import React, { useEffect, useRef } from 'react';
import { useAuth } from './AuthProviderClient';
import { usePathname, useRouter } from 'next/navigation';

export default function AuthRedirector() {
  const { firebaseUser, profile, loading, onboardingRequired } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const redirectingRef = useRef(false);

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthRedirector.tsx:13',message:'AuthRedirector useEffect',data:{loading,hasFirebaseUser:!!firebaseUser,hasProfile:!!profile,profileRole:profile?.role||null,onboardingRequired,pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    if (loading) {
      redirectingRef.current = false;
      return;
    }

    // Prevent rapid successive redirects
    if (redirectingRef.current) {
      return;
    }

    // If not logged in, do nothing here
    if (!firebaseUser) {
      redirectingRef.current = false;
      return;
    }

    // If onboarding required, navigate to onboarding when on neutral pages (root/login)
    if (onboardingRequired) {
      if (pathname === '/' || pathname === '/login' || pathname === '') {
        // Only redirect if not already on onboarding
        if (pathname !== '/onboarding') {
          redirectingRef.current = true;
          router.replace('/onboarding');
        }
      }
      return;
    }

    // Only redirect when we have definitive profile data (not during network errors)
    if (profile && profile.role) {
      const target = profile.role === 'teacher' ? '/teacher' : '/student';
      // Only redirect from neutral pages and only if not already on target
      if ((pathname === '/' || pathname === '/login' || pathname === '') && pathname !== target) {
        // #region agent log
        fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthRedirector.tsx:46',message:'AuthRedirector redirecting to dashboard',data:{from:pathname,to:target,role:profile.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        redirectingRef.current = true;
        router.replace(target);
      }
    }

    // Reset redirect flag
    redirectingRef.current = false;
  }, [loading, firebaseUser, profile, onboardingRequired, pathname, router]);

  return null;
}
