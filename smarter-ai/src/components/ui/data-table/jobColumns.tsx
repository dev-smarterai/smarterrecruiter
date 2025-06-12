"use client"

import { Badge, BadgeProps } from "@/components/Badge"
import { Button } from "@/components/Button"
import { Checkbox } from "@/components/Checkbox"
import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import Link from "next/link"
import { DataTableColumnHeader } from "./DataTableColumnHeader"
import { RiDeleteBinLine, RiLineChartLine, RiMoreFill } from "@remixicon/react"
import { useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/Dropdown"

// JobListing interface based on the jobs page
interface JobListing {
    id: string
    title: string
    company: string
    location: string
    type: string
    featured?: boolean
    meetingCode?: string
    expiry: string
    salary: {
        min: number
        max: number
        currency: string
        period: string
    }
}

// Function to check if a job is expired
export const isJobExpired = (expiryDate: string): boolean => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    return expiry < today
}

// Function to generate consistent colors based on company name
const getCompanyColors = (company: string) => {
    // Predefined sets of bg and text colors (same as used for candidates)
    const colorPairs = [
        { bg: "bg-red-100", text: "text-red-800" },
        { bg: "bg-green-100", text: "text-green-800" },
        { bg: "bg-blue-100", text: "text-blue-800" },
        { bg: "bg-yellow-100", text: "text-yellow-800" },
        { bg: "bg-purple-100", text: "text-purple-800" },
        { bg: "bg-pink-100", text: "text-pink-800" },
        { bg: "bg-indigo-100", text: "text-indigo-800" },
        { bg: "bg-teal-100", text: "text-teal-800" },
    ];
    
    // Use a simple hash of the company name to pick a consistent color
    const hash = company.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = hash % colorPairs.length;
    
    return colorPairs[index];
}

const columnHelper = createColumnHelper<JobListing>()

// Function to handle job deletion - needs to be used outside the columns definition
const DeleteJobButton = ({ jobId }: { jobId: string }) => {
    const deleteJob = useMutation(api.jobs.deleteJob);

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        
        if (confirm("Are you sure you want to delete this job?")) {
            try {
                await deleteJob({ id: jobId as unknown as Id<"jobs"> });
                
            } catch (error) {
                alert("Failed to delete job: " + error);
                console.error("Error deleting job:", error);
            }
        }
    };

    return (
        <DropdownMenuItem 
            onClick={handleDelete}
            className="flex items-center text-red-600 dark:text-red-500"
        >
            <RiDeleteBinLine className="mr-2 h-4 w-4" />
            Delete
        </DropdownMenuItem>
    );
};

export const jobColumns = [
    columnHelper.display({
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected()
                        ? true
                        : table.getIsSomeRowsSelected()
                            ? "indeterminate"
                            : false
                }
                onCheckedChange={() => table.toggleAllPageRowsSelected()}
                className="translate-y-0.5"
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(checked) => {
                    row.toggleSelected(!!checked)
                }}
                onClick={(e) => e.stopPropagation()}
                className="translate-y-0.5"
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
        meta: {
            displayName: "Select",
        },
    }),
    columnHelper.accessor("title", {
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Job Title" />
        ),
        cell: ({ row }) => {
            const { bg, text } = getCompanyColors(row.original.company);
            
            return (
                <div className="flex items-center space-x-3">
                    <div className={`h-8 w-8 rounded-full ${bg} flex items-center justify-center`}>
                        <span className={`text-xs font-medium ${text}`}>{row.original.company.charAt(0)}</span>
                    </div>
                    <Link
                        href={`/jobs/${row.original.id}`}
                        className="font-medium hover:text-indigo-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {row.getValue("title")}
                    </Link>
                </div>
            )
        },
        enableSorting: true,
        enableHiding: false,
        filterFn: (row, columnId, filterValue) => {
            const value = String(row.getValue(columnId)).toLowerCase()
            return value.includes(String(filterValue).toLowerCase())
        },
        meta: {
            className: "text-left",
            displayName: "Job Title",
        },
    }),
    columnHelper.accessor("company", {
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Company" />
        ),
        enableSorting: true,
        filterFn: (row, columnId, filterValue) => {
            const value = String(row.getValue(columnId)).toLowerCase()
            return value.includes(String(filterValue).toLowerCase())
        },
        meta: {
            className: "text-left",
            displayName: "Company",
        },
    }),
    columnHelper.accessor("location", {
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Location" />
        ),
        enableSorting: true,
        meta: {
            className: "text-left",
            displayName: "Location",
        },
    }),
    columnHelper.accessor("meetingCode", {
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Meeting Code" />
        ),
        cell: ({ row }) => {
            const meetingCode = row.getValue("meetingCode") as string | undefined;
            return (
                <div className="font-medium bg-blue-50 text-blue-800 px-2 py-1 rounded-md inline-block">
                    {meetingCode || "N/A"}
                </div>
            );
        },
        enableSorting: true,
        meta: {
            className: "text-left",
            displayName: "Meeting Code",
        },
    }),
    columnHelper.accessor("type", {
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Type" />
        ),
        cell: ({ getValue }) => {
            const value = getValue() || ""
            let variant: BadgeProps["variant"] = "neutral"
            
            if (value === "REMOTE") {
                variant = "default"
            } else if (value === "HYBRID") {
                variant = "warning"
            } else if (value === "ONSITE") {
                variant = "success"
            }

            return (
                <Badge variant={variant}>
                    {value}
                </Badge>
            )
        },
        enableSorting: true,
        meta: {
            className: "text-left",
            displayName: "Type",
        },
    }),
    columnHelper.accessor("salary.min", {
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Salary Range" />
        ),
        cell: ({ row }) => {
            const salary = row.original.salary
            return (
                <span className="text-gray-600">
                    {salary.currency} {salary.min.toLocaleString()} - {salary.max.toLocaleString()}
                </span>
            )
        },
        enableSorting: true,
        meta: {
            className: "text-left tabular-nums",
            displayName: "Salary Range",
        },
    }),
    columnHelper.display({
        id: "actions",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Actions" />
        ),
        cell: ({ row }) => {
            // Stop click event from bubbling up to the row
            const handleClick = (e: React.MouseEvent) => {
                e.stopPropagation();
            };
            
            return (
                <div className="flex flex-nowrap justify-start gap-2 items-center">
                    <Button
                        variant="secondary"
                        className="text-sm py-1.5"
                        onClick={(e) => {
                            e.stopPropagation()
                            window.location.href = `/jobs/${row.original.id}`
                        }}
                    >
                        Preview
                    </Button>
                    <Button
                        variant="secondary"
                        className="text-sm py-1.5"
                        onClick={(e) => {
                            e.stopPropagation()
                            window.location.href = `/jobs/edit/${row.original.id}`
                        }}
                    >
                        Edit
                    </Button>
                    <Button
                        variant="secondary"
                        className="text-sm py-1.5"
                        onClick={(e) => {
                            e.stopPropagation()
                            window.location.href = `/jobs/${row.original.id}/screenings`
                        }}
                    >
                        <RiLineChartLine className="size-4 mr-1" />
                        Progress
                    </Button>
                    
                    {/* Dropdown menu for additional actions */}
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
                            <DeleteJobButton jobId={row.original.id} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        },
        enableSorting: false,
        enableHiding: false,
        meta: {
            className: "text-left",
            displayName: "Actions",
        },
    }),
] as ColumnDef<JobListing>[] 