"use client"

import { Button } from "@/components/Button"
import { useAuth } from "@/lib/auth"
import { cx, focusInput, focusRing } from "@/lib/utils"
import { RiMore2Fill, RiUser3Fill } from "@remixicon/react"

import { DropdownUserProfile } from "./DropdownUserProfile"

type UserProfileProps = {
  iconOnly?: boolean;
}

export const UserProfileDesktop = ({ iconOnly = false }: UserProfileProps) => {
  const { user } = useAuth()

  return (
    <DropdownUserProfile>
      {iconOnly ? (
        <button
          aria-label="User settings"
          className={cx(
            "flex items-center rounded-md border border-gray-300 bg-white shadow-sm transition-all hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 hover:dark:bg-gray-900 w-auto p-1.5 gap-0",
            focusInput,
          )}
        >
          <span
            className="flex size-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300"
            aria-hidden="true"
          >
            <RiUser3Fill className="size-4" />
          </span>
        </button>
      ) : (
        <Button
          aria-label="User settings"
          variant="ghost"
          className={cx(
            focusRing,
            "group flex w-full items-center justify-between rounded-md p-2 text-sm font-medium text-gray-900 hover:bg-gray-100 data-[state=open]:bg-gray-100 data-[state=open]:bg-gray-400/10 hover:dark:bg-gray-400/10",
          )}
        >
          <span className="flex items-center gap-3">
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300"
              aria-hidden="true"
            >
              <RiUser3Fill className="size-5" />
            </span>
            <span>{user?.name || 'Guest User'}</span>
          </span>
          <RiMore2Fill
            className="size-4 shrink-0 text-gray-500 group-hover:text-gray-700 group-hover:dark:text-gray-400"
            aria-hidden="true"
          />
        </Button>
      )}
    </DropdownUserProfile>
  )
}

export const UserProfileMobile = () => {
  return (
    <DropdownUserProfile align="end">
      <Button
        aria-label="User settings"
        variant="ghost"
        className={cx(
          "group flex items-center rounded-md p-1 text-sm font-medium text-gray-900 hover:bg-gray-100 data-[state=open]:bg-gray-100 data-[state=open]:bg-gray-400/10 hover:dark:bg-gray-400/10",
        )}
      >
        <span
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300"
          aria-hidden="true"
        >
          <RiUser3Fill className="size-4" />
        </span>
      </Button>
    </DropdownUserProfile>
  )
}
