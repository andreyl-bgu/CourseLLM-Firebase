"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/AuthProviderClient"
import { auth } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogIn, Loader2 } from "lucide-react"

export default function LoginPage() {
  const { signInWithGoogle, loading, firebaseUser, refreshProfile, profile } = useAuth()
  const [navigating, setNavigating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  
  // Check if we're returning from a failed redirect (on localhost, redirect often fails due to third-party cookies)
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // If we're on localhost and just returned to the page, check if auth failed
    if (isLocalhost && !auth.currentUser && !loading) {
      // Check if we might have just returned from a redirect
      const mightBeFailedRedirect = urlParams.has('apiKey') || 
                                     window.location.hash.includes('auth') ||
                                     document.referrer.includes('accounts.google.com');
      
      if (mightBeFailedRedirect) {
        setError("Authentication failed. On localhost, please allow popups for this site, or try using a different browser. The redirect flow doesn't work reliably on localhost due to browser security restrictions.");
      }
    }
  }, [loading]);

  const gotoAfterAuth = async () => {
    // Fast path: if profile already in memory use it
    if (profile && profile.role) return router.replace(profile.role === "teacher" ? "/teacher" : "/student")

    // Otherwise try to refresh but don't wait long — race against a short timeout
    const refreshPromise = refreshProfile()
    const res = await Promise.race([
      refreshPromise,
      new Promise<null>((r) => setTimeout(() => r(null), 700)),
    ])

    if (res && (res as any).role) return router.replace((res as any).role === "teacher" ? "/teacher" : "/student")

    // Fallback: optimistic default. RoleGuard will correct if needed.
    return router.replace("/student")
  }

  const handleGoogle = async () => {
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login/page.tsx:34',message:'handleGoogle called',data:{url:window.location.href,hasCurrentUser:!!auth.currentUser,currentUserId:auth.currentUser?.uid||null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    }
    // #endregion
    try {
      setNavigating(true)
      setError(null)
      // #region agent log
      if (typeof window !== 'undefined') {
        fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login/page.tsx:40',message:'Calling signInWithGoogle',data:{url:window.location.href},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      }
      // #endregion
      const result = await signInWithGoogle()
      // #region agent log
      if (typeof window !== 'undefined') {
        fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login/page.tsx:44',message:'signInWithGoogle returned',data:{resultIsNull:result===null,hasResult:!!result,userId:result?.uid||null,currentUserAfter:auth.currentUser?.uid||null,url:window.location.href},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      }
      // #endregion
      
      // If signInWithGoogle returns null, it means redirect was used (page will navigate away)
      if (result === null) {
        // #region agent log
        if (typeof window !== 'undefined') {
          fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login/page.tsx:50',message:'Redirect flow initiated, page will navigate',data:{url:window.location.href},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        }
        // #endregion
        // User is being redirected - don't clear navigating state
        // The redirect will navigate away from this page
        return
      }
      
      // If this is the user's first sign-in, send them to onboarding immediately.
      const user = auth.currentUser
      const isNew = !!(user && user.metadata && user.metadata.creationTime === user.metadata.lastSignInTime)
      // #region agent log
      if (typeof window !== 'undefined') {
        fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login/page.tsx:60',message:'Checking if new user',data:{isNew,userId:user?.uid||null,creationTime:user?.metadata?.creationTime,lastSignIn:user?.metadata?.lastSignInTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      }
      // #endregion
      if (isNew) return router.replace("/onboarding")

      await gotoAfterAuth()
    } catch (err: any) {
      setNavigating(false)
      console.error("Sign-in error:", err)
      // #region agent log
      if (typeof window !== 'undefined') {
        fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login/page.tsx:68',message:'Sign-in error caught',data:{errorCode:err?.code||'N/A',errorMessage:err?.message||'Unknown',url:window.location.href},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      }
      // #endregion
      
      // Provide user-friendly error messages
      const errorCode = err?.code || "";
      const errorMessage = err?.message || "";
      
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (errorCode === "auth/popup-blocked" || errorMessage.includes("popup blocked")) {
        if (isLocalhost) {
          setError("Popup was blocked. On localhost, please allow popups for this site in your browser settings. The redirect flow doesn't work reliably on localhost due to browser security restrictions.");
        } else {
          setError("Popup was blocked. Please allow popups for this site or try again - we'll use a redirect instead.");
        }
      } else if (errorCode === "auth/network-request-failed") {
        setError("Network error. Please check your internet connection and try again.");
      } else if (errorCode === "auth/popup-closed-by-user") {
        setError("Sign-in was cancelled. Please try again.");
      } else if (errorCode === "auth/unauthorized-domain") {
        setError("This domain is not authorized. Please contact support.");
      } else {
        setError("Sign-in failed. Please try again. If the problem persists, check your browser settings.");
      }
    }
  }

  // Note: GitHub sign-in removed — only Google sign-in is supported.

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-xl">
        <Card>
        <CardHeader>
          <CardTitle>Sign in to CourseLLM</CardTitle>
          <CardDescription>Sign in with Google to continue — we'll only store the info needed for your profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-3">
            <Button onClick={handleGoogle} disabled={loading || navigating} size="lg">
              <LogIn className="mr-2" /> Sign in with Google
            </Button>
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            {firebaseUser && (
              <div className="text-sm text-muted-foreground">Signed in as {firebaseUser.email}</div>
            )}
          </div>
        </CardContent>
        </Card>
      </div>
      {navigating && (
          <div className="fixed inset-0 z-50 bg-background/75 flex items-center justify-center">
            <div className="w-full max-w-sm px-6">
              <div className="rounded-lg bg-card p-6 shadow-lg text-center">
                <Loader2 className="mx-auto mb-4 animate-spin" />
                <div className="text-lg font-medium">Signing you in…</div>
                <div className="text-sm text-muted-foreground mt-1">We&apos;re taking you to your dashboard.</div>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}
