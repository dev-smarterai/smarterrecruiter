"use client"

import { Button } from "@/components/Button"
import { Candidate } from "@/data/schema"
import { RiArrowRightUpLine, RiDeleteBinLine, RiEditLine, RiMoreFill } from "@remixicon/react"
import { Row } from "@tanstack/react-table"
import Link from "next/link"
import { useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/Dropdown"

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function DataTableRowActions<
  TData,
>({ row }: DataTableRowActionsProps<TData>) {
  // Check if this is a candidate row
  const isCandidate = (row.original as any).id !== undefined
  const deleteCandidate = useMutation(api.candidates.deleteCandidate)

  // Stop click event from bubbling up to the row
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (confirm("Are you sure you want to delete this item?")) {
      if (isCandidate) {
        const candidateId = (row.original as Candidate).id
        try {
          await deleteCandidate({ id: candidateId as unknown as Id<"candidates"> })
        } catch (error) {
          alert("Failed to delete: " + error)
          console.error("Error deleting:", error)
        }
      }
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="group aspect-square p-1.5 hover:border hover:border-gray-300 data-[state=open]:border-gray-300 data-[state=open]:bg-gray-50 hover:dark:border-gray-700 data-[state=open]:dark:border-gray-700 data-[state=open]:dark:bg-gray-900"
          onClick={handleClick}
        >
          <RiMoreFill
            className="size-4 shrink-0 text-gray-500 group-hover:text-gray-700 group-data-[state=open]:text-gray-700 group-hover:dark:text-gray-300 group-data-[state=open]:dark:text-gray-300"
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {isCandidate && (
          <Link
            href={`/candidates/${(row.original as Candidate).id}`}
            passHref
            onClick={handleClick}
            className="w-full"
          >
            <DropdownMenuItem className="flex items-center">
              <RiArrowRightUpLine className="mr-2 h-4 w-4" />
              View Profile
            </DropdownMenuItem>
          </Link>
        )}
        <DropdownMenuItem className="flex items-center">
          <RiEditLine className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDelete} className="flex items-center text-red-600 dark:text-red-500">
          <RiDeleteBinLine className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
