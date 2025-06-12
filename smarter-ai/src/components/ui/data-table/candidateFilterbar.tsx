"use client"

import { Button } from "@/components/Button"
import { Searchbar } from "@/components/Searchbar"
import { RiDownloadLine } from "@remixicon/react"
import { Table } from "@tanstack/react-table"
import { useState } from "react"
import { useDebouncedCallback } from "use-debounce"
import { candidateStatuses } from "./candidateColumns"
import { DataTableFilter } from "./DataTableFilter"
import { ViewOptions } from "./DataTableViewOptions"

interface CandidateFilterbarProps<TData> {
    table: Table<TData>
}

export function CandidateFilterbar<TData>({ table }: CandidateFilterbarProps<TData>) {
    const isFiltered = table.getState().columnFilters.length > 0
    const [searchTerm, setSearchTerm] = useState<string>("")

    const debouncedSetFilterValue = useDebouncedCallback((value) => {
        table.getColumn("name")?.setFilterValue(value)
        table.getColumn("email")?.setFilterValue(value)
    }, 300)

    const handleSearchChange = (event: any) => {
        const value = event.target.value
        setSearchTerm(value)
        debouncedSetFilterValue(value)
    }

    // Positions for filter dropdown
    const positions = [
        { value: "Frontend Developer", label: "Frontend Developer" },
        { value: "Backend Developer", label: "Backend Developer" },
        { value: "Full Stack Developer", label: "Full Stack Developer" },
        { value: "UI/UX Designer", label: "UI/UX Designer" },
        { value: "Product Manager", label: "Product Manager" },
        { value: "DevOps Engineer", label: "DevOps Engineer" },
        { value: "Data Scientist", label: "Data Scientist" }
    ];

    return (
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-x-6">
            <div className="flex w-full flex-col gap-2 sm:w-fit sm:flex-row sm:items-center">
                {table.getColumn("status")?.getIsVisible() && (
                    <DataTableFilter
                        column={table.getColumn("status")}
                        title="Status"
                        options={candidateStatuses}
                        type="select"
                    />
                )}
                {table.getColumn("position")?.getIsVisible() && (
                    <DataTableFilter
                        column={table.getColumn("position")}
                        title="Position"
                        options={positions}
                        type="checkbox"
                    />
                )}
                {table.getColumn("name")?.getIsVisible() && (
                    <Searchbar
                        type="search"
                        placeholder="Search candidates..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="w-full sm:max-w-[250px] sm:[&>input]:h-[30px]"
                    />
                )}
                {isFiltered && (
                    <Button
                        variant="ghost"
                        onClick={() => table.resetColumnFilters()}
                        className="border border-gray-200 px-2 font-semibold text-indigo-600 sm:border-none sm:py-1 dark:border-gray-800 dark:text-indigo-500"
                    >
                        Clear filters
                    </Button>
                )}
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="secondary"
                    className="hidden gap-x-2 px-2 py-1.5 text-sm sm:text-xs lg:flex"
                >
                    <RiDownloadLine className="size-4 shrink-0" aria-hidden="true" />
                    Export
                </Button>
                <ViewOptions table={table} />
            </div>
        </div>
    )
} 