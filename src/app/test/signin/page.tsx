"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function TestSigninPage() {
  const router = useRouter()
  const [status, setStatus] = useState("Signing in test user…")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const uid = params.get("uid")
    const role = params.get("role") as "student" | "teacher" | null
    const redirectTo = params.get("redirect")
    
    if (!uid || !role) {
      setStatus("Missing uid or role parameter")
      setTimeout(() => router.replace("/login"), 2000)
      return
    }

    // Set test auth in localStorage - this will be picked up by AuthProviderClient
    const testAuth = { uid, role }
    localStorage.setItem('__test_auth__', JSON.stringify(testAuth))
    
    setStatus(`Test auth set for ${uid} (${role}), redirecting...`)
    
    // Redirect to the appropriate page
    const target = redirectTo || (role === "teacher" ? "/teacher" : "/student")
    
    // Small delay to ensure localStorage is set before redirect
    setTimeout(() => {
      router.replace(target)
    }, 100)
  }, [router])

  return <div className="p-6">{status}</div>
}
