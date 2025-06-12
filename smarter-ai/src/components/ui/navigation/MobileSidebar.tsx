import { siteConfig } from "@/app/siteConfig"
import { Button } from "@/components/Button"
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/Drawer"
import { cx, focusRing } from "@/lib/utils"
import {
  RiAddLine,
  RiBriefcaseLine,
  RiBuilding3Line,
  RiCompassLine,
  RiDashboardLine,
  RiHome2Line,
  RiLinkM,
  RiMagicLine,
  RiMenuLine,
  RiSettings5Line,
  RiUser3Line,
  RiCalendarEventLine
} from "@remixicon/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCallback, useMemo } from "react"

const navigation = [  {
    name: "Home",
    href: siteConfig.baseLinks.home,
    icon: RiHome2Line,
  },
  { name: "Dashboard", href: siteConfig.baseLinks.dashboard, icon: RiDashboardLine },
  { name: "New Job", href: "/jobs/new", icon: RiAddLine },
  { name: "Active Jobs", href: "/jobs", icon: RiBriefcaseLine },
  { name: "AI Interviewer", href: "/jobs/ai-interviewer", icon: RiMagicLine },
  { name: "Candidates", href: "/candidates", icon: RiUser3Line },
  { name: "Interview Schedule", href: "/interview-schedule", icon: RiCalendarEventLine },
  {
    name: "Settings",
    href: siteConfig.baseLinks.settings.general,
    icon: RiSettings5Line,
  },
] as const

const shortcuts = [
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
] as const

export default function MobileSidebar() {
  const pathname = usePathname()
  
  // Memoize the isActive function to reduce calculations on navigation
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
  
  // Memoize navigation items
  const navigationItems = useMemo(() => {
    return navigation.map((item) => (
      <li key={item.name}>
        <DrawerClose asChild>
          <Link
            href={item.href}
            className={cx(
              isActive(item.href)
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 hover:dark:text-gray-50",
              "flex items-center gap-x-2.5 rounded-md px-2 py-1.5 text-base font-medium transition hover:bg-gray-100 sm:text-sm hover:dark:bg-gray-900",
              focusRing,
            )}
          >
            <item.icon
              className="size-5 shrink-0"
              aria-hidden="true"
            />
            {item.name}
          </Link>
        </DrawerClose>
      </li>
    ));
  }, [isActive]);
  
  return (
    <>
      <Drawer>
        <DrawerTrigger asChild>
          <Button
            variant="ghost"
            aria-label="open sidebar"
            className="group flex items-center rounded-md p-2 text-sm font-medium hover:bg-gray-100 data-[state=open]:bg-gray-100 data-[state=open]:bg-gray-400/10 hover:dark:bg-gray-400/10"
          >
            <RiMenuLine
              className="size-6 shrink-0 sm:size-5"
              aria-hidden="true"
            />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="sm:max-w-lg">
          <DrawerHeader>
            <DrawerTitle>Smarter AI</DrawerTitle>
          </DrawerHeader>
          <DrawerBody>
            <nav
              aria-label="core mobile navigation links"
              className="flex flex-1 flex-col space-y-10"
            >
              <ul role="list" className="space-y-1.5">
                {navigationItems}
              </ul>
              {/* <div>
                <span className="text-sm font-medium leading-6 text-gray-500 sm:text-xs">
                  Setup
                </span>
                <ul role="list" className="mt-1 space-y-0.5">
                  <li>
                    <DrawerClose asChild>
                      <Link
                        href={siteConfig.baseLinks.onboarding}
                        className={cx(
                          isActive("/onboarding")
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-gray-600 hover:text-gray-900 dark:text-gray-400 hover:dark:text-gray-50",
                          "flex items-center gap-x-2.5 rounded-md px-2 py-1.5 text-base font-medium transition hover:bg-gray-100 sm:text-sm hover:dark:bg-gray-900",
                          focusRing,
                        )}
                      >
                        <RiCompassLine
                          className="size-5 shrink-0"
                          aria-hidden="true"
                        />
                        Onboarding
                      </Link>
                    </DrawerClose>
                  </li>
                </ul>
              </div> */}
              {/* <div>
                <span className="text-sm font-medium leading-6 text-gray-500 sm:text-xs">
                  Shortcuts
                </span>
                <ul aria-label="shortcuts" role="list" className="space-y-0.5">
                  {shortcuts.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cx(
                          pathname === item.href || pathname.includes(item.href)
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-gray-700 hover:text-gray-900 dark:text-gray-400 hover:dark:text-gray-50",
                          "flex items-center gap-x-2.5 rounded-md px-2 py-1.5 font-medium transition hover:bg-gray-100 sm:text-sm hover:dark:bg-gray-900",
                          focusRing,
                        )}
                      >
                        <item.icon
                          className="size-4 shrink-0"
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div> */}
            </nav>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  )
}
