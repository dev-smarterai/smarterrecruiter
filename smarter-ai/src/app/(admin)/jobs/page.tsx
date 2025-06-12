"use client"
import { Button } from "@/components/Button"
import { Input } from "@/components/Input"
import { cx } from "@/lib/utils"
import { RiFilterLine, RiSearchLine } from "@remixicon/react"
import Link from "next/link"
import { useState, useMemo, useCallback } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeaderCell,
    TableRow,
} from "@/components/Table"
import { jobColumns, isJobExpired } from "@/components/ui/data-table/jobColumns"
import { DataTablePagination } from "@/components/ui/data-table/DataTablePagination"
import { DataTableBulkEditor } from "@/components/ui/data-table/DataTableBulkEditor"
import { useRouter } from "next/navigation"
import * as React from "react"
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable
} from "@tanstack/react-table"
import { Id } from "../../../../convex/_generated/dataModel"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/Dropdown"
// AI Navigation imports
import { AIPageWrapper } from "@/lib/ai-navigation"
import { AIContentBlock } from "@/components/ui/ai-navigation/AIContentBuilder"

// Define the JobListing interface based on our jobsData structure
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

export default function JobsDashboard() {
    const pageSize = 10
    const [rowSelection, setRowSelection] = React.useState({})
    const [searchTerm, setSearchTerm] = useState("");
    const [pageIndex, setPageIndex] = useState(0);
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired">("all");
    const router = useRouter()
    const bulkDeleteJobs = useMutation(api.jobs.bulkDeleteJobs);

    // Get jobs data from Convex
    const convexJobs = useQuery(api.jobs.getJobs) || []
    
    // Format jobs data for display - using useMemo to avoid unnecessary re-renders
    const allJobs = useMemo(() => 
        convexJobs.map(job => ({
            id: job._id,
            title: job.title,
            company: job.company,
            location: job.location,
            type: job.type,
            featured: job.featured,
            meetingCode: job.meetingCode,
            expiry: job.expiry,
            salary: job.salary
        })),
    [convexJobs]);

    // Filter jobs based on search term and status - using useMemo to avoid unnecessary re-renders
    const filteredJobs = useMemo(() => {
        let filtered = allJobs;
        
        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(job =>
                job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.location.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        // Apply status filter
        if (statusFilter === "active") {
            filtered = filtered.filter(job => !isJobExpired(job.expiry));
        } else if (statusFilter === "expired") {
            filtered = filtered.filter(job => isJobExpired(job.expiry));
        }
        
        return filtered;
    }, [allJobs, searchTerm, statusFilter]);
    
    // Handle row click
    const handleRowClick = useCallback((jobId: string) => {
        router.push(`/jobs/${jobId}`)
    }, [router]);
    
    // Function to handle bulk deletion of selected jobs
    const handleBulkDelete = async () => {
        if (Object.keys(rowSelection).length === 0) return;
        
        const selectedJobs = Object.keys(rowSelection).map(
            index => table.getRowModel().rows[parseInt(index)].original
        );
        
        if (confirm(`Are you sure you want to delete ${selectedJobs.length} job${selectedJobs.length > 1 ? 's' : ''}?`)) {
            try {
                // Convert string IDs to Convex IDs
                const jobIds = selectedJobs.map(job => job.id as unknown as Id<"jobs">);
                
                // Call the bulkDeleteJobs mutation instead of deleting individually
                const result = await bulkDeleteJobs({ ids: jobIds });
                
                if (result.success) {
                    console.log(result.message);
                } else {
                    console.warn(result.message);
                    if (result.failedIds.length > 0) {
                        console.warn("Failed to delete some jobs:", result.failedIds);
                    }
                }
                
                // Reset row selection after deletion
                table.resetRowSelection();
            } catch (error) {
                console.error("Error in bulk delete operation:", error);
            }
        }
    };

    // Initialize table
    const table = useReactTable({
        data: filteredJobs,
        columns: jobColumns,
        state: {
            rowSelection,
            pagination: {
                pageIndex,
                pageSize,
            },
        },
        onPaginationChange: (updater) => {
            if (typeof updater === 'function') {
                const newState = updater({
                    pageIndex,
                    pageSize,
                });
                setPageIndex(newState.pageIndex);
            } else {
                setPageIndex(updater.pageIndex);
            }
        },
        enableRowSelection: true,
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        manualPagination: false,
    })

    return (
        <AIPageWrapper className="min-h-screen py-8 px-2 sm:px-6">
            <div className="max-w-6xl mx-auto">
                {/* Header and Search Row */}
                <AIContentBlock delay={0} blockType="header">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                        <h1 className="text-2xl md:text-2xl font-bold text-gray-900 flex-shrink-0">Active Jobs</h1>
                        <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="relative">
                                    {/* <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                        <RiSearchLine className="text-gray-400 size-5" />
                                    </div> */}
                                    <Input
                                        className="pl-12 rounded-full  border-none shadow-sm focus:ring-2 focus:ring-indigo-200 h-10 text-sm"
                                        placeholder="Search by job title, company, location..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 mt-2 md:mt-0">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="secondary"
                                            className="flex items-center gap-1 rounded-full px-4 py-1.5 text-sm border-gray-200 bg-[#f5f6fa] hover:bg-gray-100"
                                        >
                                            <RiFilterLine className="size-5" />
                                            <span>
                                                {statusFilter === "all" ? "All Jobs" : 
                                                 statusFilter === "active" ? "Active Jobs" : "Expired Jobs"}
                                            </span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="min-w-40">
                                        <DropdownMenuItem 
                                            onClick={() => setStatusFilter("all")}
                                            className={statusFilter === "all" ? "bg-indigo-50 text-indigo-600" : ""}
                                        >
                                            All Jobs
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                            onClick={() => setStatusFilter("active")}
                                            className={statusFilter === "active" ? "bg-indigo-50 text-indigo-600" : ""}
                                        >
                                            Active Jobs
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                            onClick={() => setStatusFilter("expired")}
                                            className={statusFilter === "expired" ? "bg-indigo-50 text-indigo-600" : ""}
                                        >
                                            Expired Jobs
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <Button className="rounded-full px-4 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
                                    Find Job
                                </Button>
                            </div>
                        </div>
                    </div>
                </AIContentBlock>

                <AIContentBlock delay={1} blockType="table">
                    <div className="mt-4 space-y-3">
                        <div className="relative overflow-hidden overflow-x-auto rounded-2xl shadow border border-gray-200 bg-white">
                            <Table>
                                <TableHead>
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow
                                            key={headerGroup.id}
                                            className="bg-[#f5f6fa] border-b border-gray-200"
                                        >
                                            {headerGroup.headers.map((header) => (
                                                <TableHeaderCell
                                                    key={header.id}
                                                    className={cx(
                                                        "whitespace-nowrap py-2 px-2 text-xs font-semibold text-gray-700",
                                                        header.column.columnDef.meta?.className,
                                                    )}
                                                >
                                                    {flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext(),
                                                    )}
                                                </TableHeaderCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableHead>
                                <TableBody>
                                    {table.getRowModel().rows?.length ? (
                                        table.getRowModel().rows.map((row) => {
                                            const isExpired = isJobExpired(row.original.expiry);
                                            return (
                                            <TableRow
                                                key={row.id}
                                                onClick={() => {
                                                    handleRowClick(row.original.id)
                                                }}
                                                className={`group cursor-pointer select-none transition-colors ${
                                                    isExpired 
                                                        ? "bg-red-50 hover:bg-red-100" 
                                                        : "hover:bg-indigo-50"
                                                }`}
                                            >
                                                {row.getVisibleCells().map((cell, index) => (
                                                    <TableCell
                                                        key={cell.id}
                                                        className={cx(
                                                            row.getIsSelected()
                                                                ? "bg-indigo-50"
                                                                : "",
                                                            "relative whitespace-nowrap py-2 px-2 text-xs text-gray-700 first:w-8",
                                                            cell.column.columnDef.meta?.className,
                                                        )}
                                                    >
                                                        {index === 0 && row.getIsSelected() && (
                                                            <div className="absolute inset-y-0 left-0 w-0.5 bg-indigo-600" />
                                                        )}
                                                        {flexRender(
                                                            cell.column.columnDef.cell,
                                                            cell.getContext(),
                                                        )}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={jobColumns.length}
                                                className="h-24 text-center text-xs"
                                            >
                                                No jobs found matching your search criteria.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            <DataTableBulkEditor 
                                table={table} 
                                rowSelection={rowSelection} 
                                onDelete={handleBulkDelete}
                            />
                        </div>
                        <AIContentBlock delay={2} blockType="card">
                            <div className="px-2">
                                <DataTablePagination table={table} pageSize={pageSize} />
                            </div>
                        </AIContentBlock>
                    </div>
                </AIContentBlock>
            </div>
        </AIPageWrapper>
    )
} 