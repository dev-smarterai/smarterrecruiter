"use client"

import { Button } from "@/components/Button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/DropdownMenu"
import { useAuth } from "@/lib/auth"
import { RiLogoutBoxRLine, RiSettings4Line, RiUser3Line } from "@remixicon/react"

export function DropdownUserProfile() {
  const { user, signOut } = useAuth();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full bg-gray-50 p-0.5 ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800"
        >
          <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-indigo-500 text-sm font-bold text-white">
            {user?.name ? user.name.substring(0, 2).toUpperCase() : "GU"}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        <DropdownMenuLabel>
          <div className="font-medium">{user?.name || "Guest User"}</div>
          <div className="text-xs text-gray-500">{user?.email || "guest@example.com"}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {/* <DropdownMenuItem>
            <RiUser3Line className="mr-2 size-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <RiSettings4Line className="mr-2 size-4" />
            <span>Settings</span>
          </DropdownMenuItem> */}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <RiLogoutBoxRLine className="mr-2 size-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

