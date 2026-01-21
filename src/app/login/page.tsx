"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/AuthProviderClient"
import { auth } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Mail } from "lucide-react"

export default function LoginPage() {
  const { signInWithEmail, loading, firebaseUser, refreshProfile, profile } = useAuth()
  const [navigating, setNavigating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  // #region agent log
  React.useEffect(() => {
    fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login/page.tsx:mount',message:'LoginPage mounted/rendered',data:{loading,hasFirebaseUser:!!firebaseUser,firebaseUserEmail:firebaseUser?.email||null,hasProfile:!!profile,profileRole:profile?.role||null,href:typeof window!=='undefined'?window.location.href:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  }, [loading, firebaseUser, profile]);
  // #endregion

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

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError("Please enter both email and password.")
      return
    }
    
    try {
      setNavigating(true)
      setError(null)
      const result = await signInWithEmail(email, password)
      
      if (result) {
        // Check if new user
        const user = auth.currentUser
        const isNew = !!(user && user.metadata && user.metadata.creationTime === user.metadata.lastSignInTime)
        if (isNew) return router.replace("/onboarding")
        
        await gotoAfterAuth()
      }
    } catch (err: any) {
      setNavigating(false)
      console.error("Email sign-in error:", err)
      handleError(err)
    }
  }

  const handleError = (err: any) => {
    const errorCode = err?.code || ""
    const errorMessage = err?.message || ""
    
    if (errorCode === "auth/popup-blocked" || errorMessage.includes("popup blocked")) {
      setError("Popup was blocked. Please allow popups for this site or try again.")
    } else if (errorCode === "auth/network-request-failed") {
      setError("Network error. Please check your internet connection and try again.")
    } else if (errorCode === "auth/popup-closed-by-user") {
      setError("Sign-in was cancelled. Please try again.")
    } else if (errorCode === "auth/unauthorized-domain") {
      setError("This domain is not authorized. Please contact support.")
    } else if (errorCode === "auth/web-storage-unsupported") {
      setError("Browser storage is blocked. Please use a normal window and allow site data for Google sign-in.")
    } else if (errorCode === "auth/invalid-credential" || errorCode === "auth/wrong-password" || errorCode === "auth/user-not-found") {
      setError("Invalid email or password. Please try again.")
    } else if (errorCode === "auth/invalid-email") {
      setError("Invalid email address.")
    } else if (errorCode === "auth/too-many-requests") {
      setError("Too many failed attempts. Please try again later.")
    } else {
      setError("Sign-in failed. Please try again.")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Sign in to CourseLLM</CardTitle>
            <CardDescription>
              Enter your email and password to sign in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading || navigating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading || navigating}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading || navigating} size="lg">
                  <Mail className="mr-2 h-4 w-4" /> Sign in with Email
                </Button>
              </form>
              
              {error && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              {firebaseUser && (
                <div className="text-sm text-muted-foreground text-center">
                  Signed in as {firebaseUser.email}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      {navigating && (
        <div className="fixed inset-0 z-50 bg-background/75 flex items-center justify-center">
          <div className="w-full max-w-sm px-6">
            <div className="rounded-lg bg-card p-6 shadow-lg text-center">
              <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin" />
              <div className="text-lg font-medium">Signing you in…</div>
              <div className="text-sm text-muted-foreground mt-1">We&apos;re taking you to your dashboard.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
