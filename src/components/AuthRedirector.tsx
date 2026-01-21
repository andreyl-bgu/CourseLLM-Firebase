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
        redirectingRef.current = true;
        router.replace(target);
      }
    }

    // Reset redirect flag
    redirectingRef.current = false;
  }, [loading, firebaseUser, profile, onboardingRequired, pathname, router]);

  return null;
}
