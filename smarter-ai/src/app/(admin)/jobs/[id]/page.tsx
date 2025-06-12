"use client"

import { Badge } from "@/components/Badge"
import { Button } from "@/components/Button"
import { RiBriefcaseLine, RiMapPinLine, RiTimeLine } from "@remixicon/react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useQuery } from "convex/react"
import { queries } from "@/lib/api"
import { Id } from "../../../../../convex/_generated/dataModel"

export default function JobDetailPage() {
    const params = useParams()
    const jobIdStr = params.id as string
    
    // Convert string ID to Convex ID type
    // Note: This assumes the ID format from Convex is directly used in URLs
    // If you have a different ID mapping approach, adjust accordingly
    let job;
    try {
        // Get job data from Convex
        job = useQuery(queries.getJob, { id: jobIdStr as Id<"jobs"> });
    } catch (err) {
        // Handle invalid ID format
        job = null;
    }
    
    // Loading state
    if (job === undefined) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Loading job details...</p>
            </div>
        );
    }

    // If job not found, show error
    if (!job) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <h1 className="text-2xl font-bold mb-4">Job not found</h1>
                <p className="text-gray-500 mb-6">The job you're looking for doesn't exist or has been removed.</p>
                <Link href="/jobs">
                    <Button>Back to Jobs</Button>
                </Link>
            </div>
        )
    }

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Job Detail</h1>
                <div className="flex items-center text-sm text-gray-500">
                    <Link href="/" className="hover:text-gray-900">Home</Link>
                    <span className="mx-2">/</span>
                    <Link href="/jobs" className="hover:text-gray-900">Active Jobs</Link>
                    <span className="mx-2">/</span>
                    <span className="text-gray-900">Job Detail</span>
                </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200 mb-8">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-red-100 flex items-center justify-center text-red-500">
                        <span className="text-2xl font-bold">{job.company.charAt(0)}</span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold">{job.title}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span>at {job.company}</span>
                            <Badge className="bg-gray-100 text-gray-800">{job.type}</Badge>
                            {job.featured && <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <h3 className="text-lg font-semibold mb-3">Job Description</h3>
                        <p className="text-gray-700 mb-4">{job.description.intro}</p>
                        <p className="text-gray-700 mb-4">{job.description.details}</p>
                        <p className="text-gray-700 mb-4">{job.description.responsibilities}</p>
                        <p className="text-gray-700 mb-4">{job.description.closing}</p>

                        <h3 className="text-lg font-semibold mt-6 mb-3">Requirements</h3>
                        <ul className="list-disc pl-5 space-y-2 text-gray-700">
                            {job.requirements.map((req, index) => (
                                <li key={index}>{req}</li>
                            ))}
                        </ul>

                        <h3 className="text-lg font-semibold mt-6 mb-3">Desirable:</h3>
                        <ul className="list-disc pl-5 space-y-2 text-gray-700">
                            {job.desirables.map((item, index) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>

                        <h3 className="text-lg font-semibold mt-6 mb-3">Benefits</h3>
                        <ul className="list-disc pl-5 space-y-2 text-gray-700">
                            {job.benefits.map((benefit, index) => (
                                <li key={index}>{benefit}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-gray-50 p-5 rounded-lg">
                            <div className="mb-6">
                                <h3 className="text-gray-500 mb-1">Salary ({job.salary.currency})</h3>
                                <p className="text-xl font-semibold">${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()}</p>
                                <p className="text-sm text-gray-500">{job.salary.period}</p>
                            </div>

                            <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <h3 className="text-blue-700 font-medium mb-1">Meeting Code</h3>
                                <div className="flex items-center">
                                    <span className="text-2xl font-bold text-blue-800">{job.meetingCode || "N/A"}</span>
                                </div>
                                <p className="text-xs text-blue-600 mt-1">Share this code with candidates to join interviews</p>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-gray-500 mb-1">Job Location</h3>
                                <div className="flex items-center gap-1">
                                    <RiMapPinLine className="text-gray-400" />
                                    <span>{job.location}</span>
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold mb-4">Job Overview</h3>

                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="col-span-1 flex flex-col items-center">
                                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-1">
                                        <RiBriefcaseLine className="text-blue-500" />
                                    </div>
                                    <span className="text-xs text-gray-500">JOB POSTED</span>
                                    <span className="text-sm font-medium">{job.posted}</span>
                                </div>

                                <div className="col-span-1 flex flex-col items-center">
                                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mb-1">
                                        <RiTimeLine className="text-purple-500" />
                                    </div>
                                    <span className="text-xs text-gray-500">JOB EXPIRE IN</span>
                                    <span className="text-sm font-medium">{job.expiry}</span>
                                </div>

                                <div className="col-span-1 flex flex-col items-center">
                                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-1">
                                        <RiBriefcaseLine className="text-green-500" />
                                    </div>
                                    <span className="text-xs text-gray-500">JOB LEVEL</span>
                                    <span className="text-sm font-medium">{job.level}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="col-span-1 flex flex-col">
                                    <span className="text-xs text-gray-500">EXPERIENCE</span>
                                    <span className="text-sm font-medium">{job.experience}</span>
                                </div>

                                <div className="col-span-1 flex flex-col">
                                    <span className="text-xs text-gray-500">EDUCATION</span>
                                    <span className="text-sm font-medium">{job.education}</span>
                                </div>
                            </div>

                            <h3 className="text-sm font-medium mb-2">Share this job:</h3>
                            <div className="flex gap-2 mb-6">
                                <button className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center text-blue-600">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19.7 3H4.3C3.582 3 3 3.582 3 4.3v15.4c0 .718.582 1.3 1.3 1.3h15.4c.718 0 1.3-.582 1.3-1.3V4.3c0-.718-.582-1.3-1.3-1.3zm-4.8 5.5h1.8v1.5h-1.8c-.4 0-.8.4-.8.8v7.5h-1.5v-7.5c0-1.3 1-2.3 2.3-2.3z" />
                                        <circle cx="7.5" cy="7.5" r="1.5" />
                                        <path d="M7.5 10.5h-2v7.5h2v-7.5z" />
                                    </svg>
                                </button>
                                <button className="w-8 h-8 bg-blue-800 rounded-md flex items-center justify-center text-white">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
                                    </svg>
                                </button>
                                <button className="w-8 h-8 bg-blue-400 rounded-md flex items-center justify-center text-white">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                                    </svg>
                                </button>
                                <button className="w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center text-gray-600">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                                    </svg>
                                </button>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Button
                                    variant="secondary"
                                    className="w-full flex items-center justify-center gap-2"
                                    onClick={() => window.location.href = `/jobs/${jobIdStr}/screenings`}
                                >
                                    <span>View Job Progress</span>
                                </Button>
                                <Button className="w-full flex items-center justify-center gap-2" onClick={() => window.location.href = `/jobs/edit/${jobIdStr}`}>
                                    <span>Edit Job Posting</span>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 12h14M13 5l7 7-7 7" />
                                    </svg>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
} 