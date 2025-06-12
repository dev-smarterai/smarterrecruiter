"use client"
import { Button } from "@/components/Button"
import {
  RadioCardGroup,
  RadioCardIndicator,
  RadioCardItem,
} from "@/components/RadioCardGroup"
import { useAuth } from "@/lib/auth"
import Link from "next/link"
import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"

const employeeCounts = [
  { value: "1-10", label: "1-10" },
  { value: "11-50", label: "11-50" },
  { value: "51-200", label: "51-200" },
  { value: "200+", label: "200+" },
]

export default function Employees() {
  const [employees, setEmployees] = useState<"1-10" | "11-50" | "51-200" | "200+">('1-10')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  
  // Get the completeOnboarding mutation
  const completeOnboardingMutation = useMutation(api.users.completeOnboarding)

  const handleSubmit = () => {
    setLoading(true)
    
    // Make sure user exists and has an ID before proceeding
    if (!user || !user._id) {
      setLoading(false);
      return;
    }
    
    // Call the Convex mutation to complete onboarding
    completeOnboardingMutation({ userId: user._id })
      .then(result => {
        console.log("Onboarding succeeded");
        
        // If user is admin, redirect to dashboard
        if (user.role === 'admin') {
          router.push('/home')
        } else {
          // For regular users, redirect to application form
          router.push('/application-form')
        }
      })
      .catch(error => {
        setLoading(false);
      });
  }

  return (
    <main className="mx-auto p-4">
      <div
        className="motion-safe:animate-revealBottom"
        style={{ animationDuration: "500ms" }}
      >
        <h1 className="text-2xl font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
          How many employees does your company have?
        </h1>
        <p className="mt-6 text-gray-700 sm:text-sm dark:text-gray-300">
          This will help us customize the experience to you.
        </p>
      </div>
      <div className="mt-4">
        <fieldset>
          <legend className="sr-only">Select number of employees</legend>
          <RadioCardGroup
            value={employees}
            onValueChange={(value) => setEmployees(value as "1-10" | "11-50" | "51-200" | "200+")}
            required
            aria-label="Number of employees"
          >
            {employeeCounts.map((count, index) => (
              <div
                className="motion-safe:animate-revealBottom"
                key={count.value}
                style={{
                  animationDuration: "600ms",
                  animationDelay: `${100 + index * 50}ms`,
                  animationFillMode: "backwards",
                }}
              >
                <RadioCardItem
                  className="active:scale-[99%] dark:bg-gray-925"
                  key={count.value}
                  value={count.value}
                  style={{
                    animationDuration: "600ms",
                    animationDelay: `${100 + index * 50}ms`,
                    animationFillMode: "backwards",
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <RadioCardIndicator />
                    <span className="block sm:text-sm">{count.label}</span>
                  </div>
                </RadioCardItem>
              </div>
            ))}
          </RadioCardGroup>
        </fieldset>
        <div className="mt-6 flex justify-between">
          <Button type="button" variant="ghost" asChild>
            <Link href="/onboarding/products">Back</Link>
          </Button>
          <Button
            className="disabled:bg-gray-200 disabled:text-gray-500"
            type="button"
            onClick={handleSubmit}
            disabled={!employees || loading}
            aria-disabled={!employees || loading}
            isLoading={loading}
          >
            {loading ? "Submitting..." : "Finish Setup"}
          </Button>
        </div>
      </div>
    </main>
  )
} 