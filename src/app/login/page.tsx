"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/AuthProviderClient"
import { auth } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogIn, Github } from "lucide-react"

export default function LoginPage() {
  const { signInWithGoogle, signInWithGithub, loading, firebaseUser, refreshProfile, profile } = useAuth()
  const router = useRouter()

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
    try {
      await signInWithGoogle()
      // If this is the user's first sign-in, send them to onboarding immediately.
      const user = auth.currentUser
      const isNew = !!(user && user.metadata && user.metadata.creationTime === user.metadata.lastSignInTime)
      if (isNew) return router.replace("/onboarding")

      await gotoAfterAuth()
    } catch (err) {
      console.error(err)
    }
  }

  const handleGithub = async () => {
    try {
      await signInWithGithub()
      const user = auth.currentUser
      const isNew = !!(user && user.metadata && user.metadata.creationTime === user.metadata.lastSignInTime)
      if (isNew) return router.replace("/onboarding")

      await gotoAfterAuth()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Sign in to CourseLLM</CardTitle>
          <CardDescription>Use Google or GitHub to continue — we'll only store the info needed for your profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-3">
            <Button onClick={handleGoogle} disabled={loading} size="lg">
              <LogIn className="mr-2" /> Sign in with Google
            </Button>
            <Button variant="outline" onClick={handleGithub} disabled={loading} size="lg">
              <Github className="mr-2" /> Sign in with GitHub
            </Button>
            {firebaseUser && (
              <div className="text-sm text-muted-foreground">Signed in as {firebaseUser.email}</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
