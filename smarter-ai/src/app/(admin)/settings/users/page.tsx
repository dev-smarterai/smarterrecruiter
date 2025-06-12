"use client"

import { Button } from "@/components/Button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/Dropdown"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Select"
import { Tooltip } from "@/components/Tooltip"
import { Input } from "@/components/Input"
import { ModalAddUser } from "@/components/ui/settings/ModalAddUser"
import { roles } from "@/data/data"
import { RiAddLine, RiMore2Fill, RiSearchLine } from "@remixicon/react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import { Id } from "../../../../../convex/_generated/dataModel"
import { useState } from "react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth"
import { cx } from "@/lib/utils"

const ITEMS_PER_PAGE = 10;

export default function Users() {
  const { user: currentUser } = useAuth();
  const usersData = useQuery(api.users.getAllUsers) || [];
  const updateUserRole = useMutation(api.users.updateUserRole);
  
  // Search and pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Filter users based on search query
  const filteredUsers = usersData.filter(user => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  // Handle role change
  const handleRoleChange = async (userId: Id<"users">, newRole: string) => {
    console.log(`Attempting to update user ${userId} to role: ${newRole}`);
    try {
      const result = await updateUserRole({ userId, newRole });
      console.log("Role update result:", result);
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Failed to update user role");
    }
  };

  // Reset to first page when search query changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };
  
  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 bg-gray-50/50 p-6 dark:border-gray-800 dark:bg-gray-900/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
                Users
              </h2>
              <p className="mt-1 text-sm leading-6 text-gray-500">
                Workspace administrators can add, manage, and remove users.
              </p>
            </div>
            <div className="relative">
              <Input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-64 pl-9 rounded-lg"
              />
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="min-w-full">
            <div className="grid grid-cols-12 gap-4 border-b border-gray-200 pb-4 text-sm font-medium text-gray-500 dark:border-gray-800">
              <div className="col-span-5">Name</div>
              <div className="col-span-4">Email</div>
              <div className="col-span-3">Access Level</div>
            </div>
            
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {paginatedUsers.map((user) => {
                const isCurrentUser = currentUser && currentUser._id === user._id;
                const isAdmin = currentUser?.role === "admin";
                const canEditRole = isAdmin && !isCurrentUser && user.role !== "admin";
                
                let tooltipText = "";
                if (isCurrentUser) {
                  tooltipText = "You cannot change your own role";
                } else if (user.role === "admin") {
                  tooltipText = "A workspace must have at least one admin";
                } else if (!isAdmin) {
                  tooltipText = "Only admins can change user roles";
                }
                
                return (
                  <div
                    key={user._id}
                    className="group grid grid-cols-12 items-center gap-4 py-4 transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-900/50"
                  >
                    <div className="col-span-5 flex items-center gap-3">
                      <span
                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                        aria-hidden="true"
                      >
                        {user.name ? user.name.substring(0, 2).toUpperCase() : user.email.substring(0, 2).toUpperCase()}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {user.name || "Unnamed User"}
                        {isCurrentUser && " (You)"}
                      </span>
                    </div>
                    
                    <div className="col-span-4 text-gray-500">
                      {user.email}
                    </div>
                    
                    <div className="col-span-3 flex items-center justify-between gap-2">
                      {canEditRole ? (
                        <Select
                          defaultValue={user.role}
                          onValueChange={(value) => handleRoleChange(user._id, value)}
                        >
                          <SelectTrigger className={cx(
                            "h-8 w-32 rounded-lg transition-all hover:border-gray-400 focus:ring-2 dark:hover:border-gray-600",
                            user.role === "admin" 
                              ? "bg-green-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300" 
                              : "bg-indigo-100 dark:bg-gray-900"
                          )}>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent align="end">
                            {roles.map((role) => (
                              <SelectItem
                                key={role.value}
                                value={role.value}
                              >
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Tooltip
                          content={tooltipText}
                          className="max-w-44 text-xs"
                          sideOffset={5}
                          triggerAsChild={true}
                        >
                          <div>
                            <Select
                              defaultValue={user.role}
                              onValueChange={(value) => handleRoleChange(user._id, value)}
                              disabled={true}
                            >
                              <SelectTrigger className={cx(
                                "h-8 w-32 rounded-lg transition-all hover:border-gray-400 focus:ring-2 dark:hover:border-gray-600",
                                user.role === "admin" 
                                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300" 
                                  : "bg-gray-50 dark:bg-gray-900"
                              )}>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent align="end">
                                {roles.map((role) => (
                                  <SelectItem
                                    key={role.value}
                                    value={role.value}
                                  >
                                    {role.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </Tooltip>
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="group size-8 rounded-lg hover:border hover:border-gray-300 hover:bg-gray-50 data-[state=open]:border-gray-300 data-[state=open]:bg-gray-50 hover:dark:border-gray-700 hover:dark:bg-gray-900 data-[state=open]:dark:border-gray-700 data-[state=open]:dark:bg-gray-900"
                          >
                            <RiMore2Fill
                              className="size-4 shrink-0 text-gray-500 group-hover:text-gray-700 group-hover:dark:text-gray-400"
                              aria-hidden="true"
                            />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem disabled={user.role === "admin"}>
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 dark:text-red-500"
                            disabled={user.role === "admin" || isCurrentUser}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-800">
                <div className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} users
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
