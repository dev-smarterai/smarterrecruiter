"use client"

import { Badge, BadgeProps } from "@/components/Badge"
import { Checkbox } from "@/components/Checkbox"
import { ProgressBar } from "@/components/ProgressBar"
import { Candidate } from "@/data/schema"
import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import Link from "next/link"
import { DataTableColumnHeader } from "./DataTableColumnHeader"
import { DataTableRowActions } from "./DataTableRowActions"

const columnHelper = createColumnHelper<Candidate>()

// Define candidate statuses
export const candidateStatuses = [
    { value: "applied", label: "Applied", variant: "neutral" },
    { value: "screening", label: "Screening", variant: "warning" },
    { value: "interview", label: "Interview", variant: "info" },
    { value: "offer", label: "Offer", variant: "success" },
    { value: "rejected", label: "Rejected", variant: "error" },
]

export const candidateColumns = [
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
                    // Stop propagation to prevent row click
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
    columnHelper.accessor("name", {
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Candidate" />
        ),
        cell: ({ row }) => {
            return (
                <div className="flex items-center space-x-2 md:space-x-3">
                    <span
                        className={`flex size-8 md:size-10 shrink-0 items-center justify-center rounded-full text-xs md:text-sm font-medium ${row.original.bgColor} ${row.original.textColor}`}
                        aria-hidden="true"
                    >
                        {row.original.initials}
                    </span>
                    <div className="min-w-0 flex-1">
                        <Link
                            href={`/candidates/${row.original._id}`}
                            className="font-medium hover:text-indigo-600 hover:underline block truncate"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {row.getValue("name")}
                        </Link>
                        <div className="text-xs text-gray-500 truncate">{row.original.email}</div>
                    </div>
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
            displayName: "Candidate",
        },
    }),
    columnHelper.accessor("position", {
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Applied Job" />
        ),
        cell: ({ getValue }) => {
            const value = getValue() || "Not specified"
            return (
                <div className="text-xs md:text-sm">
                    <div className="font-medium truncate">{value}</div>
                </div>
            )
        },
        enableSorting: true,
        meta: {
            className: "text-left",
            displayName: "Applied Job",
        },
    }),
    columnHelper.accessor("recruiter", {
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Team" />
        ),
        cell: ({ getValue }) => {
            const value = getValue() || "Unassigned"
            return (
                <div className="text-xs md:text-sm font-medium truncate">{value}</div>
            )
        },
        enableSorting: true,
        meta: {
            className: "text-left",
            displayName: "Team",
        },
    }),
    columnHelper.display({
        id: "seniority",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Seniority" />
        ),
        cell: ({ row }) => {
            // Extract seniority from position or use a default
            const position = row.original.position || ""
            let seniority = "Mid-Level"
            
            if (position.toLowerCase().includes("senior") || position.toLowerCase().includes("lead")) {
                seniority = "Senior"
            } else if (position.toLowerCase().includes("junior") || position.toLowerCase().includes("entry")) {
                seniority = "Junior"
            } else if (position.toLowerCase().includes("principal") || position.toLowerCase().includes("staff")) {
                seniority = "Principal"
            }
            
            return (
                <div className="text-xs md:text-sm font-medium">{seniority}</div>
            )
        },
        meta: {
            className: "text-left",
            displayName: "Seniority",
        },
    }),
    columnHelper.accessor("aiScore", {
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Match Score" />
        ),
        cell: ({ getValue }) => {
            const value = getValue() || 0

            return (
                <div className="flex items-center justify-center w-20">
                    {value > 0 ? (
                        <div className="relative w-full">
                            <div className="w-full bg-gray-200 rounded-full h-5">
                                <div 
                                    className="bg-blue-500 h-5 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                                    style={{ width: `${value}%` }}
                                >
                                    {value}%
                                </div>
                            </div>
                        </div>
                    ) : (
                        <span className="text-xs text-gray-500">N/A</span>
                    )}
                </div>
            )
        },
        enableSorting: true,
        meta: {
            className: "text-center",
            displayName: "Match Score",
        },
    }),
    columnHelper.display({
        id: "skills",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Skills" />
        ),
        cell: ({ row }) => {
            // Extract real skills from candidateProfile
            let skills: string[] = []
            
            // Get technical skills
            if (row.original.candidateProfile?.skills?.technical?.skills) {
                const technicalSkills = row.original.candidateProfile.skills.technical.skills
                    .slice(0, 2) // Take first 2 skills
                    .map((skill: any) => skill.name)
                skills = [...skills, ...technicalSkills]
            }
            
            // If no technical skills, try matched skills
            if (skills.length === 0 && row.original.candidateProfile?.skillInsights?.matchedSkills) {
                skills = row.original.candidateProfile.skillInsights.matchedSkills.slice(0, 2)
            }
            
            // If still no skills, fallback to position-based skills
            if (skills.length === 0) {
                const position = row.original.position || ""
                if (position.toLowerCase().includes("frontend") || position.toLowerCase().includes("react")) {
                    skills = ["React", "TypeScript"]
                } else if (position.toLowerCase().includes("backend") || position.toLowerCase().includes("node")) {
                    skills = ["Node.js", "Docker"]
                } else if (position.toLowerCase().includes("ux") || position.toLowerCase().includes("design")) {
                    skills = ["Wireframing", "Prototyping"]
                } else if (position.toLowerCase().includes("data")) {
                    skills = ["SQL", "Power BI"]
                } else if (position.toLowerCase().includes("devops")) {
                    skills = ["Kubernetes", "AWS"]
                } else {
                    skills = ["General"]
                }
            }
            
            return (
                <div className="flex flex-wrap gap-1">
                    {skills.slice(0, 2).map((skill, index) => (
                        <span key={index} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded truncate max-w-20 md:max-w-none">
                            {skill}
                        </span>
                    ))}
                </div>
            )
        },
        meta: {
            className: "text-left",
            displayName: "Skills",
        },
    }),
    columnHelper.display({
        id: "years",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Years" />
        ),
        cell: ({ row }) => {
            // Try to get from candidateProfile.career.experience first
            let years = 5 // default
            
            if (row.original.candidateProfile?.career?.experience) {
                const experience = row.original.candidateProfile.career.experience
                const match = experience.match(/(\d+)/)
                if (match) {
                    years = parseInt(match[1])
                }
            } else {
                // Fallback to position-based logic
                const position = row.original.position || ""
                if (position.toLowerCase().includes("senior") || position.toLowerCase().includes("lead")) {
                    years = 8
                } else if (position.toLowerCase().includes("junior") || position.toLowerCase().includes("entry")) {
                    years = 1
                } else if (position.toLowerCase().includes("principal") || position.toLowerCase().includes("staff")) {
                    years = 15
                }
            }
            
            return (
                <div className="text-xs md:text-sm font-medium">{years}</div>
            )
        },
        meta: {
            className: "text-center",
            displayName: "Years",
        },
    }),
    columnHelper.display({
        id: "education",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Education" />
        ),
        cell: ({ row }) => {
            // This would come from education field in the expanded schema
            // For now, using placeholder based on position
            const position = row.original.position || ""
            let education = "BSc"
            
            if (position.toLowerCase().includes("senior") || position.toLowerCase().includes("lead")) {
                education = "BSc"
            } else if (position.toLowerCase().includes("data") || position.toLowerCase().includes("analyst")) {
                education = "MSc"
            }
            
            return (
                <div className="text-xs md:text-sm font-medium">{education}</div>
            )
        },
        meta: {
            className: "text-center",
            displayName: "Education",
        },
    }),
    columnHelper.display({
        id: "location",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Location" />
        ),
        cell: ({ row }) => {
            // Extract real location from candidateProfile
            let location = "Not specified"
            
            if (row.original.candidateProfile?.personal?.location && 
                row.original.candidateProfile.personal.location !== "Not specified") {
                location = row.original.candidateProfile.personal.location
            } else {
                // Fallback to placeholder locations for demo
                const locations = [
                    "New York, New York",
                    "San Francisco, San Francisco", 
                    "Austin, Austin",
                    "Denver, Denver",
                    "Seattle, Seattle"
                ]
                location = locations[Math.floor(Math.random() * locations.length)]
            }
            
            const parts = location.split(', ')
            if (parts.length >= 2) {
                return (
                    <div className="text-xs md:text-sm">
                        <div className="font-medium truncate">{parts[0]}</div>
                        <div className="text-gray-500 truncate">{parts[1]}</div>
                    </div>
                )
            } else {
                return (
                    <div className="text-xs md:text-sm">
                        <div className="font-medium truncate">{location}</div>
                    </div>
                )
            }
        },
        meta: {
            className: "text-left",
            displayName: "Location",
        },
    }),
] as ColumnDef<Candidate>[] 