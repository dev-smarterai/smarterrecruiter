"use client"
import { siteConfig } from "@/app/siteConfig"
import { useAuth } from "@/lib/auth"
import { cx, focusRing } from "@/lib/utils"
import {
  RiAddLine,
  RiBriefcaseLine,
  RiDashboardLine,
  RiMagicLine,
  RiSettings5Line,
  RiUser3Line,
  RiCalendarEventLine,
  RiHome2Line,
  RiBarChartLine
} from "@remixicon/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import MobileSidebar from "./MobileSidebar"
import {
  WorkspacesDropdownDesktop,
  WorkspacesDropdownMobile,
} from "./SidebarWorkspacesDropdown"
import { UserProfileDesktop, UserProfileMobile } from "./UserProfile"
import { useCallback, useMemo } from "react"

const navigation = [
  { name: "Home", href: "/home", icon: RiHome2Line },
  { name: "Dashboard", href: siteConfig.baseLinks.dashboard, icon: RiDashboardLine },
  { name: "New Job", href: "/jobs/new", icon: RiAddLine },
  { name: "Active Jobs", href: "/jobs", icon: RiBriefcaseLine },
  { name: "AI Interviewer", href: "/jobs/ai-interviewer", icon: RiMagicLine },
  { name: "Candidates", href: "/candidates", icon: RiUser3Line },
  { name: "Interview Schedule", href: "/interview-schedule", icon: RiCalendarEventLine },
  { name: "Analytics", href: "/analytics", icon: RiBarChartLine },
  {
    name: "Settings",
    href: siteConfig.baseLinks.settings.general,
    icon: RiSettings5Line,
  },
  
] as const

// Shortcuts array now empty, original items commented out
const shortcuts: { name: string; href: string; icon: React.ComponentType<any> }[] = [
  /* Commented out shortcuts items
  {
    name: "Overview",
    href: siteConfig.baseLinks.overview,
    icon: RiHome2Line,
  },
  {
    name: "Details",
    href: "/details",
    icon: RiCompassLine,
  },
  {
    name: "Agencies",
    href: "/agencies",
    icon: RiBuilding3Line,
  },
  {
    name: "Add new user",
    href: "/settings/users",
    icon: RiLinkM,
  },
  {
    name: "Workspace usage",
    href: "/settings/billing#billing-overview",
    icon: RiLinkM,
  },
  {
    name: "Cost spend control",
    href: "/settings/billing#cost-spend-control",
    icon: RiLinkM,
  },
  {
    name: "Overview – Rows written",
    href: "/overview#usage-overview",
    icon: RiLinkM,
  },
  */
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  // Memoize the isActive function to prevent recalculations on every render
  const isActive = useCallback((itemHref: string) => {
    // Special case for settings
    if (itemHref === siteConfig.baseLinks.settings.general) {
      return pathname.startsWith("/settings")
    }
    // Special case for jobs - exact match for new job page
    if (itemHref === "/jobs/new") {
      return pathname === "/jobs/new"
    }
    // Special case for AI Interviewer
    if (itemHref === "/jobs/ai-interviewer") {
      return pathname.startsWith("/jobs/ai-interviewer")
    }
    if (itemHref === "/jobs") {
      return pathname === "/jobs" || (pathname.startsWith("/jobs") &&
        pathname !== "/jobs/new" && !pathname.startsWith("/jobs/ai-interviewer"))
    }
    // Default case
    return pathname === itemHref || pathname.startsWith(itemHref)
  }, [pathname])
  
  // Memoize the navigation items to prevent re-renders when navigation stays the same
  const navigationItems = useMemo(() => {
    return navigation.map((item) => (
      <li key={item.name}>
        <Link
          href={item.href}
          className={cx(
            isActive(item.href)
              ? "text-indigo-600 dark:text-indigo-400"
              : "text-gray-700 hover:text-gray-900 dark:text-gray-400 hover:dark:text-gray-50",
            "flex items-center gap-x-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition hover:bg-gray-100 hover:dark:bg-gray-900",
            focusRing,
          )}
        >
          <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
          {item.name}
        </Link>
      </li>
    ));
  }, [isActive]);

  return (
    <>
      {/* sidebar (lg+) */}
      <nav className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 xl:w-64 2xl:w-56 lg:flex-col">
        <aside className="flex grow flex-col gap-y-4 overflow-y-auto border-r border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
          <div className="flex items-center pb-2 border-b border-gray-100 dark:border-gray-800">
            <div className="flex gap-2">
              {/* <WorkspacesDropdownDesktop iconOnly={true} /> */}
              <UserProfileDesktop iconOnly={true} />
            </div>
            <div className="ml-2 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{user?.name || 'Guest User'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || 'No email'}</p>
            </div>
          </div>
          <nav
            aria-label="core navigation links"
            className="flex flex-1 flex-col space-y-10"
          >
            <ul role="list" className="space-y-0.5">
              {navigationItems}
            </ul>
            {/* Commented out onboarding section
            <div>
              <span className="text-xs font-medium leading-6 text-gray-500">
                Setup
              </span>
              <ul role="list" className="mt-1 space-y-0.5">
                <li>
                  <Link
                    href={siteConfig.baseLinks.onboarding}
                    className={cx(
                      isActive("/onboarding")
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-gray-700 hover:text-gray-900 dark:text-gray-400 hover:dark:text-gray-50",
                      "flex items-center gap-x-2.5 rounded-md px-2 py-1.5 text-sm font-medium transition hover:bg-gray-100 hover:dark:bg-gray-900",
                      focusRing,
                    )}
                  >
                    <RiCompassLine className="size-4 shrink-0" aria-hidden="true" />
                    Onboarding
                  </Link>
                </li>
              </ul>
            </div>
            */}
            {shortcuts.length > 0 && (
              <div>
                <span className="text-xs font-medium leading-6 text-gray-500">
                  Shortcuts
                </span>
                <ul aria-label="shortcuts" role="list" className="space-y-0.5">
                  {shortcuts.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cx(
                          pathname === item.href || pathname.startsWith(item.href)
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-gray-700 hover:text-gray-900 dark:text-gray-400 hover:dark:text-gray-50",
                          "flex items-center gap-x-2.5 rounded-md px-2 py-1.5 text-sm font-medium transition hover:bg-gray-100 hover:dark:bg-gray-900",
                          focusRing,
                        )}
                      >
                        <item.icon
                          className="h-[18px] w-[18px] shrink-0"
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </nav>
        </aside>
      </nav>
      {/* top navbar (xs-lg) */}
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-2 shadow-sm sm:gap-x-6 sm:px-4 lg:hidden dark:border-gray-800 dark:bg-gray-950">
        {/* <WorkspacesDropdownMobile /> */}
        <div className="flex items-center gap-1 sm:gap-2">
          <UserProfileMobile />
          <MobileSidebar />
        </div>
      </div>
    </>
  )
}
