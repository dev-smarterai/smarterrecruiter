"use client"
import { Button } from "@/components/Button"
import { Logo } from "@/components/ui/Logo"
import { useAuth } from "@/lib/auth"
import useScroll from "@/lib/useScroll"
import { cx } from "@/lib/utils"
import { usePathname, useRouter } from "next/navigation"
import React from "react"
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"

interface Step {
  name: string
  href: string
}

const steps: Step[] = [
  { name: "Product selection", href: "/onboarding/products" },
  { name: "Employees", href: "/onboarding/employees" },
]

interface StepProgressProps {
  steps: Step[]
}

const StepProgress = ({ steps }: StepProgressProps) => {
  const pathname = usePathname()
  const currentStepIndex = steps.findIndex((step) =>
    pathname.startsWith(step.href),
  )

  return (
    <div aria-label="Onboarding progress">
      <ol className="mx-auto flex w-24 flex-nowrap gap-1 md:w-fit">
        {steps.map((step, index) => (
          <li
            key={step.name}
            className={cx(
              "h-1 w-12 rounded-full",
              index <= currentStepIndex
                ? "bg-indigo-600"
                : "bg-gray-300 dark:bg-gray-700",
            )}
          >
            <span className="sr-only">
              {step.name}{" "}
              {index < currentStepIndex
                ? "completed"
                : index === currentStepIndex
                  ? "current"
                  : ""}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

const Layout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => {
  const scrolled = useScroll(15)
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"
  const completeOnboardingMutation = useMutation(api.users.completeOnboarding)
  const router = useRouter()

  const handleSkipToDashboard = () => {
    // Make sure user exists and has an ID before proceeding
    if (user && user._id) {
      // Call the Convex mutation to complete onboarding
      completeOnboardingMutation({ userId: user._id })
        .then(() => {
          console.log("Onboarding skipped and completed");
          // Use router.push instead of href link
          router.push('/home');
        })
        .catch(error => {
          console.error("Error completing onboarding:", error);
        });
    }
  }

  return (
    <div className="min-h-screen">
      <header
        className={cx(
          "fixed inset-x-0 top-0 isolate z-50 flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 transition-all md:grid md:grid-cols-[200px_auto_200px] md:px-6 dark:border-gray-900 dark:bg-gray-925",
          scrolled ? "h-12" : "h-20",
        )}
      >
        <div
          className="hidden flex-nowrap items-center gap-0.5 md:flex"
          aria-hidden="true"
        >
          <Logo
            className="w-7 p-px text-indigo-600 dark:text-indigo-400"
            aria-hidden="true"
          />
          <span className="mt-0.5 text-lg font-semibold text-gray-900 dark:text-gray-50">
            Dashboard
          </span>
        </div>
        <StepProgress steps={steps} />
        {isAdmin && (
          <Button 
            variant="ghost" 
            className="ml-auto w-fit" 
            onClick={handleSkipToDashboard}
          >
            Skip to dashboard
          </Button>
        )}
      </header>
      <main id="main-content" className="mx-auto mb-20 mt-28 max-w-lg">
        {children}
      </main>
    </div>
  )
}

export default Layout 