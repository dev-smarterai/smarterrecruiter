"use client"

import { TabNavigation, TabNavigationLink } from "@/components/TabNavigation"
import { useAuth } from "@/lib/auth"
import Link from "next/link"
import { Notifications } from "./Notifications"

import { usePathname } from "next/navigation"
import { Logo } from "../../../public/Logo"
import { DropdownUserProfile } from "./UserProfile"

interface NavigationProps {
  showLogo?: boolean;
}

function Navigation({ showLogo = true }: NavigationProps) {
  const pathname = usePathname()
  const { user } = useAuth();

  // Only show appropriate navigation links based on user role
  const isAdmin = user?.role === "admin";

  return (
    <div className="z-20 dark:bg-gray-950 mt-2">
      <div className="bg-white rounded-full shadow-lg p-6 mx-auto max-w-5xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex flex-nowrap items-center gap-0.5 bg-white">

            <video src="/orb-fixed.mp4" autoPlay loop muted className="w-24 rounded-full" />
          </div>
      
        <TabNavigation className="mt-5">
          <div className="mx-auto flex w-full max-w-7xl items-center px-6">
            {isAdmin && (
              <>
                <TabNavigationLink
                  className="inline-flex gap-2"
                  asChild
                  active={pathname.includes("/overview")}
                >
                  <Link href="/overview">Overview</Link>
                </TabNavigationLink>
                <TabNavigationLink
                  className="inline-flex gap-2"
                  asChild
                  active={pathname.includes("/jobs")}
                >
                  <Link href="/jobs">Jobs</Link>
                </TabNavigationLink>
                <TabNavigationLink
                  className="inline-flex gap-2"
                  asChild
                  active={pathname.includes("/candidates")}
                >
                  <Link href="/candidates">Candidates</Link>
                </TabNavigationLink>
              </>
            )}

            <TabNavigationLink
              className="inline-flex gap-2"
              asChild
              active={pathname.includes("/mydashboard")}
            >
              <Link href="/mydashboard">Dashboard</Link>
            </TabNavigationLink>
            
            <TabNavigationLink
              className="inline-flex gap-2"
              asChild
              active={pathname.includes("/application-form")}
            >
              <Link href="/application-form">Application Form</Link>
            </TabNavigationLink>
            {/* <TabNavigationLink
              className="inline-flex gap-2"
              asChild
              active={pathname.includes("/job-interview")}
            >
              <Link href="/job-interview">Job Interview</Link>
            </TabNavigationLink> */}
            <TabNavigationLink
              className="inline-flex gap-2"
              asChild
              active={pathname.includes("/ai-chatbot")}
            >
              <Link href="/ai-chatbot">AI Chatbot</Link>
            </TabNavigationLink>
            
            <TabNavigationLink
              className="inline-flex gap-2"
              asChild
              active={pathname.includes("/schedule-interview")}
            >
              <Link href="/schedule-interview">Schedule Interview</Link>
            </TabNavigationLink>
            
            <TabNavigationLink
              className="inline-flex gap-2"
              asChild
              active={pathname.includes("/access-interview")}
            >
              <Link href="/access-interview">Access Interview</Link>
            </TabNavigationLink>
            
            {/* Voice AI link removed as requested */}
          </div>
        </TabNavigation>
        <div className="flex h-[42px] flex-nowrap gap-1">
          <Notifications />
          <DropdownUserProfile />
        </div>
      </div>
      </div>
    </div>
  )
}

export { Navigation }
