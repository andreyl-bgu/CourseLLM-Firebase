"use client"

import React, { useState } from "react"
import { useAuth } from "@/components/AuthProviderClient"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"

function OnboardingContent() {
  const { firebaseUser, profile, refreshProfile } = useAuth()
  const [department, setDepartment] = useState(profile?.department || "")
  const [coursesInput, setCoursesInput] = useState("")
  const [courses, setCourses] = useState<string[]>(profile?.courses || [])
  const [role, setRole] = useState<"student" | "teacher">((profile?.role as any) || "student")
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  React.useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'onboarding/page.tsx:23',message:'Onboarding useEffect triggered',data:{hasFirebaseUser:!!firebaseUser,uid:firebaseUser?.uid||null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    if (!firebaseUser) {
      // #region agent log
      fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'onboarding/page.tsx:25',message:'Redirecting to login from onboarding (no user)',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      router.replace("/login")
    }
  }, [firebaseUser, router])

  if (!firebaseUser) return null

  const addCourseFromInput = () => {
    const v = coursesInput.trim()
    if (v && !courses.includes(v)) {
      setCourses((c) => [...c, v])
      setCoursesInput("")
    }
  }

  const removeCourse = (c: string) => setCourses((list) => list.filter((x) => x !== c))

  const handleSave = async () => {
    if (!firebaseUser) return
    if (!role || !department) {
      // lightweight client validation
      alert("Please choose a role and enter your department.")
      return
    }
    setSaving(true)
    try {
      const userDoc = doc(db, "users", firebaseUser.uid)
      await setDoc(
        userDoc,
        {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          role,
          department,
          courses,
          authProviders: firebaseUser.providerData?.map((p) => p.providerId.replace(/\.com$/, "")) || [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          profileComplete: true,
        },
        { merge: true }
      )

      // #region agent log
      fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'onboarding/page.tsx:67',message:'Profile saved, calling refreshProfile',data:{uid:firebaseUser.uid,role,department,coursesCount:courses.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      try {
        const refreshed = await refreshProfile()
        // #region agent log
        fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'onboarding/page.tsx:70',message:'refreshProfile completed',data:{uid:firebaseUser.uid,refreshed:!!refreshed,refreshedRole:refreshed?.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
      } catch (e) {
        console.warn("refreshProfile failed after onboarding save:", e)
        // #region agent log
        fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'onboarding/page.tsx:73',message:'refreshProfile failed',data:{error:e instanceof Error?e.message:'Unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
      }

      const targetPath = role === "student" ? "/student" : "/teacher"
      // #region agent log
      fetch('http://127.0.0.1:7247/ingest/62f437c0-49e0-40ce-94ef-e1908fd13650',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'onboarding/page.tsx:78',message:'Navigating to role dashboard',data:{to:targetPath,role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      router.replace(targetPath)
    } catch (err) {
      console.error("Failed saving profile:", err)
      alert("Failed to save profile. Try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Set up your profile</CardTitle>
          <CardDescription>Tell us a bit about yourself so we can personalize your experience.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <div className="flex gap-2">
                <Button variant={role === "student" ? "default" : "outline"} onClick={() => setRole("student")}>
                  Student
                </Button>
                <Button variant={role === "teacher" ? "default" : "outline"} onClick={() => setRole("teacher")}>
                  Teacher
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Department</label>
              <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Computer Science" />
              <p className="text-sm text-muted-foreground mt-1">Free-text department. You can refine this later.</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Courses</label>
              <div className="flex gap-2">
                <Input value={coursesInput} onChange={(e) => setCoursesInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCourseFromInput()} placeholder="Add a course and press Enter" />
                <Button onClick={addCourseFromInput}>Add</Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {courses.map((c) => (
                  <Badge key={c} className="inline-flex items-center gap-2">
                    <span>{c}</span>
                    <button onClick={() => removeCourse(c)} aria-label={`Remove ${c}`} className="text-xs opacity-80">×</button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} size="lg">
                {saving ? "Saving..." : "Save and Continue"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function OnboardingPage() {
  return <OnboardingContent />
}
