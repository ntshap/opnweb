"use client"

import { useEffect } from "react"
import { redirect } from "next/navigation"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("token")

    if (token) {
      // User is authenticated, redirect to dashboard
      router.push("/dashboard")
    } else {
      // User is not authenticated, redirect to login
      router.push("/login")
    }
  }, [])

  // Return a loading state or null while the redirect is happening
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  )
}
