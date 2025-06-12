"use client"

import { useAuth } from "@/lib/auth"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RootPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // Not logged in - redirect to login page
        router.push("/login")
      } else if (user?.role === "admin") {
        // Admin user - redirect to home/dashboard
        if (!user.completedOnboarding) {
          router.push("/onboarding/products")
        } else {
          router.push("/home")
        }
      } else {
        // Regular user - redirect to application form
        router.push("/application-form")
      }
    }
  }, [isLoading, isAuthenticated, user, router])

  // Show loading while auth state is being determined
  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-gray-500">Loading...</p>
    </div>
  )
} 