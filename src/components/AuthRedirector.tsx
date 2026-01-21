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
    fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthRedirector.tsx:13',message:'AuthRedirector useEffect triggered',data:{loading,hasFirebaseUser:!!firebaseUser,hasProfile:!!profile,profileRole:profile?.role,onboardingRequired,pathname,redirectingRef:redirectingRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (loading) {
      redirectingRef.current = false;
      return;
    }

    // Prevent rapid successive redirects
    if (redirectingRef.current) {
      // #region agent log
      fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthRedirector.tsx:20',message:'Redirect already in progress, skipping',data:{pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
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
          // #region agent log
          fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthRedirector.tsx:32',message:'Redirecting to onboarding',data:{from:pathname,to:'/onboarding',onboardingRequired},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          redirectingRef.current = true;
          router.replace('/onboarding');
        }
      }
      return;
    }

    // Only redirect when we have definitive profile data (not during network errors)
    // If profile is null but onboardingRequired is false, this might be a network error
    // In that case, don't redirect - let RoleGuardClient handle it
    if (profile && profile.role) {
      const target = profile.role === 'teacher' ? '/teacher' : '/student';
      // Only redirect from neutral pages and only if not already on target
      if ((pathname === '/' || pathname === '/login' || pathname === '') && pathname !== target) {
        // #region agent log
        fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthRedirector.tsx:46',message:'Redirecting to role dashboard',data:{from:pathname,to:target,role:profile.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
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
