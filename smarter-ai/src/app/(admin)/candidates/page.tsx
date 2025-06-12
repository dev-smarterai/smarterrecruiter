"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeaderCell,
    TableRow,
} from "@/components/Table"
import { candidateColumns } from "@/components/ui/data-table/candidateColumns"
import { CandidateFilterbar } from "@/components/ui/data-table/candidateFilterbar"
import { DataTableBulkEditor } from "@/components/ui/data-table/DataTableBulkEditor"
import { DataTablePagination } from "@/components/ui/data-table/DataTablePagination"
import { Candidate } from "@/data/schema"
import { cx } from "@/lib/utils"
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable
} from "@tanstack/react-table"
import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"
import { Input } from "@/components/ui/input"
// AI Navigation imports
import { AIPageWrapper } from "@/lib/ai-navigation"
import { AIContentBlock } from "@/components/ui/ai-navigation/AIContentBuilder"

export default function CandidatesPage() {
    const pageSize = 12
    const [rowSelection, setRowSelection] = React.useState({})
    const [searchTerm, setSearchTerm] = React.useState("");
    const router = useRouter()
    const deleteCandidate = useMutation(api.candidates.deleteCandidate)
    const bulkDeleteCandidates = useMutation(api.candidates.bulkDeleteCandidates)

    // Fetch candidates from Convex instead of mock store
    const convexCandidates = useQuery(api.candidates.getCandidates) || []
    console.log(convexCandidates)
    // Map Convex candidates to the format expected by the UI
    const candidates = React.useMemo(() => {
        return convexCandidates.map(candidate => ({
            id: candidate._id,
            name: candidate.name,
            initials: candidate.initials,
            email: candidate.email,
            textColor: candidate.textColor,
            bgColor: candidate.bgColor,
            status: candidate.status || "",
            appliedDate: candidate.appliedDate || "",
            position: candidate.position || "",
            recruiter: candidate.recruiter || "",
            progress: candidate.progress || 0,
            lastActivity: candidate.lastActivity || "",
            aiScore: candidate.aiScore || 0,
            cvFileId: candidate.cvFileId || null,
        })) as Candidate[]
    }, [convexCandidates])

    // Filter candidates by name using searchTerm
    const filteredCandidates = React.useMemo(() =>
        searchTerm
            ? convexCandidates.filter(candidate =>
                candidate.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            : convexCandidates,
    [convexCandidates, searchTerm])

    // Function to handle bulk deletion of selected candidates
    const handleBulkDelete = async () => {
        if (Object.keys(rowSelection).length === 0) return;
        
        const selectedCandidates = Object.keys(rowSelection).map(
            index => table.getRowModel().rows[parseInt(index)].original
        );
        
        if (confirm(`Are you sure you want to delete ${selectedCandidates.length} candidate${selectedCandidates.length > 1 ? 's' : ''}?`)) {
            try {
                // Convert string IDs to Convex IDs
                const candidateIds = selectedCandidates.map(candidate => candidate.id as unknown as Id<"candidates">);
                
                // Call the bulkDeleteCandidates mutation instead of deleting individually
                const result = await bulkDeleteCandidates({ ids: candidateIds });
                
                if (result.success) {
                    console.log(result.message);
                } else {
                    console.warn(result.message);
                    if (result.failedIds.length > 0) {
                        console.warn("Failed to delete some candidates:", result.failedIds);
                    }
                }
                // Reset row selection after deletion
                table.resetRowSelection();
            } catch (error) {
                console.error("Error in bulk delete operation:", error);
            }
        }
    };
console.log(filteredCandidates)
    const table = useReactTable({
        data: filteredCandidates,
        columns: candidateColumns,
        state: {
            rowSelection,
        },
        initialState: {
            pagination: {
                pageIndex: 0,
                pageSize: pageSize,
            },
        },
        enableRowSelection: true,
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    })

    const handleRowClick = (candidateId: string) => {
        router.push(`/candidates/${candidateId}`)
    }

    return (
        <AIPageWrapper className="min-h-screen py-8 px-2 sm:px-6">
            <div className="max-w-6xl mx-auto">
                {/* Header, Tabs, and Search */}
                <AIContentBlock delay={0} blockType="header">
                    <div className="space-y-6 mb-8">
                        {/* Title and Search Row */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex-shrink-0">Candidate Roster</h1>
                            <div className="flex items-center gap-2 md:gap-4">
                                <div className="w-full md:w-48">
                                    <Input
                                        type="search"
                                        className="rounded-full border border-blue-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 h-8 text-xs"
                                        placeholder="Search by name..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                {/* Filter icon */}
                                <button className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 flex-shrink-0">
                                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        {/* Tabs Row - Separated and Mobile Responsive */}
                        <div className="flex flex-wrap items-center gap-2 md:gap-4">
                            <button className="px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-medium bg-blue-600 text-white shadow-sm">All Candidates</button>
                            <button className="px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm">Shortlisted</button>
                            <button className="px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm">Archived</button>
                        </div>
                    </div>
                </AIContentBlock>

                <AIContentBlock delay={1} blockType="table">
                    <div className="mt-4 space-y-3">
                        {/* Table Container */}
                        <div className="relative overflow-hidden overflow-x-auto rounded-2xl shadow border border-gray-200 bg-white">
                            <Table>
                                <TableHead>
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow
                                            key={headerGroup.id}
                                            className="bg-white border-b-2 border-gray-100"
                                        >
                                            {headerGroup.headers.map((header) => (
                                                <TableHeaderCell
                                                    key={header.id}
                                                    className={cx(
                                                        "whitespace-nowrap py-3 md:py-4 px-3 md:px-6 text-xs md:text-sm font-bold text-gray-800 tracking-wide uppercase",
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
                                        table.getRowModel().rows.map((row) => (
                                            <TableRow
                                                key={row.id}
                                                onClick={() => {
                                                    handleRowClick(row.original._id)
                                                }}
                                                className="group cursor-pointer select-none hover:bg-blue-50/50 transition-all duration-200 border-b border-gray-50 hover:shadow-sm"
                                            >
                                                {row.getVisibleCells().map((cell, index) => (
                                                    <TableCell
                                                        key={cell.id}
                                                        className={cx(
                                                            row.getIsSelected()
                                                                ? "bg-blue-50 border-l-4 border-blue-500"
                                                                : "",
                                                            "relative py-3 md:py-4 px-3 md:px-6 text-xs md:text-sm text-gray-900 font-medium",
                                                            cell.column.columnDef.meta?.className,
                                                        )}
                                                    >

                                                        {flexRender(
                                                            cell.column.columnDef.cell,
                                                            cell.getContext(),
                                                        )}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={candidateColumns.length}
                                                className="h-32 text-center text-sm text-gray-500"
                                            >
                                                No results.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            <DataTableBulkEditor table={table} rowSelection={rowSelection} onDelete={handleBulkDelete} />
                        </div>
                        <AIContentBlock delay={2} blockType="card">
                            <div className="px-2">
                                <DataTablePagination table={table} pageSize={pageSize} />
                            </div>
                        </AIContentBlock>
                        {/* Download List Button */}
                        <AIContentBlock delay={2.5} blockType="card">
                            <div className="flex justify-center pt-4">
                                <button className="flex items-center gap-2 px-6 py-2 rounded-full bg-[#f5f6fa] text-indigo-700 font-medium shadow border border-gray-200 hover:bg-indigo-50 text-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v11.25m0 0l-4.5-4.5m4.5 4.5l4.5-4.5M3.75 19.5h16.5" />
                                    </svg>
                                    Download List
                                </button>
                            </div>
                        </AIContentBlock>
                    </div>
                </AIContentBlock>
            </div>
        </AIPageWrapper>
    )
} 