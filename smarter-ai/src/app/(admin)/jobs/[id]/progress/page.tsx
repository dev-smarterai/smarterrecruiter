"use client"

import { Badge } from "@/components/Badge"
import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import { ProgressCircle } from "@/components/ProgressCircle"
import { cx } from "@/lib/utils"
import { RiAlertLine, RiArrowRightUpLine, RiFileTextLine } from "@remixicon/react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useQuery } from "convex/react"
import { queries } from "@/lib/api"
import { Id } from "../../../../../../convex/_generated/dataModel"

interface CandidateItem {
    id: string
    name: string
    email: string
    matchScore: number
}

interface LearningPath {
    title: string
    provider: string
}

interface JobProgress {
    _id: Id<"jobProgress">
    _creationTime: number
    jobId: Id<"jobs">
    title: string
    role: string
    summary: {
        totalResumes: number
        meetingMinCriteria: number
        shortlisted: number
        rejected: number
        biasScore: number
    }
    topCandidate: {
        name: string
        position: string
        matchPercentage: number
        education: string
        location: string
        achievements: string[]
        skills: string[]
        skillGaps: string[]
        linkedin: string
    }
    skillAnalysis: {
        totalScreened: number
        matchingThreshold: number
        shortlistedRate: number
        averageSkillFit: number
    }
    suggestedQuestions: string[]
    hasAiQuestions?: boolean
    candidatesPool: {
        topSkills: string[]
        missingCriteria: string[]
        learningPaths: LearningPath[]
    }
    candidates: CandidateItem[]
}

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}

// Function to calculate bias score based on data analysis
const calculateBiasScore = (data: JobProgress): number => {
    // Real-world bias calculation would analyze demographics, rejection patterns, etc.
    // This is a simplified example that looks at:
    // 1. Ratio of rejected to total candidates
    // 2. Whether shortlisted candidates represent a reasonable percentage

    const rejectionRatio = (data.summary.totalResumes - data.summary.meetingMinCriteria) / data.summary.totalResumes;
    const shortlistRatio = data.summary.shortlisted / data.summary.meetingMinCriteria;

    // Lower rejection ratio and balanced shortlist ratio indicate less bias
    // Ideal shortlist ratio would be around 0.2-0.4 (20-40% of qualified candidates)
    const balancedShortlistFactor = Math.abs(shortlistRatio - 0.3) < 0.1 ? 1 : 0.8;

    // Calculate bias score (higher is better - less biased)
    // Scale between 0-100
    const rawScore = (1 - rejectionRatio * 0.5) * balancedShortlistFactor * 100;

    // Ensure score is between 0-100
    return Math.min(Math.max(Math.round(rawScore), 0), 100);
};

export default function JobProgressPage() {
    const params = useParams()
    const jobIdStr = params.id as string

    // Convert string ID to Convex ID type
    let jobProgress;
    try {
        // Get job progress data from Convex
        jobProgress = useQuery(queries.getJobProgressData, { jobId: jobIdStr as Id<"jobs"> });
    } catch (err) {
        // Handle invalid ID format
        jobProgress = null;
    }

    // Loading state
    if (jobProgress === undefined) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Loading job progress data...</p>
            </div>
        );
    }

    // If job progress not found, show error
    if (!jobProgress) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <h1 className="text-2xl font-bold mb-4">Job progress not found</h1>
                <p className="text-gray-500 mb-6">The job progress you're looking for doesn't exist or has been removed.</p>
                <Link href="/jobs">
                    <Button>Back to Jobs</Button>
                </Link>
            </div>
        )
    }

    // Prepare data for the progress circle
    const biasScore = calculateBiasScore(jobProgress);

    const progressData = [
        {
            category: 'Meeting Minimum Criteria',
            value: Math.round((jobProgress.summary.meetingMinCriteria / jobProgress.summary.totalResumes) * 100),
            count: jobProgress.summary.meetingMinCriteria,
            color: 'bg-green-600 dark:bg-green-600',
        },
        {
            category: 'Shortlisted',
            value: Math.round((jobProgress.summary.shortlisted / jobProgress.summary.totalResumes) * 100),
            count: jobProgress.summary.shortlisted,
            color: 'bg-blue-500 dark:bg-blue-500',
        },
        {
            category: 'Rejected',
            value: Math.round(((jobProgress.summary.totalResumes - jobProgress.summary.meetingMinCriteria) / jobProgress.summary.totalResumes) * 100),
            count: jobProgress.summary.totalResumes - jobProgress.summary.meetingMinCriteria,
            color: 'bg-red-500 dark:bg-red-500',
        },
        {
            category: 'Total Resumes',
            value: 100,
            count: jobProgress.summary.totalResumes,
            color: 'bg-gray-900 dark:bg-gray-100',
        },
        {
            category: 'Bias Score (Fair screening)',
            value: biasScore,
            count: biasScore,
            color: 'bg-gray-900 dark:bg-gray-100',
            isPercentage: true
        },
    ];

    const valueFormatter = (number: number) => number.toString();

    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-semibold">Progress for {jobProgress.role} Role</h1>
                <div className="flex items-center text-sm text-gray-500">
                    <Link href="/" className="hover:text-gray-900">Home</Link>
                    <span className="mx-2">/</span>
                    <Link href="/jobs" className="hover:text-gray-900">Active Jobs</Link>
                    <span className="mx-2">/</span>
                    <Link href={`/jobs/${jobIdStr}`} className="hover:text-gray-900">Job Details</Link>
                    <span className="mx-2">/</span>
                    <span className="text-gray-900">Job Progress</span>
                </div>
            </div>

            {/* CV Screening Summary */}
            {/* <h2 className="text-xl font-semibold mb-2">CV Screening Summary</h2> */}

            <Card className="p-4 border border-gray-200 shadow-sm rounded-lg mb-4">
                <h3 className="text-base font-medium text-gray-900 mb-2">Resume Processing Overview</h3>
                <p className="text-xs text-gray-500 mb-3">
                    Summary of all applicants processed for the {jobProgress.role} position.
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="flex flex-col items-center justify-center">
                        <div className="items-center justify-center">
                            <ProgressCircle value={progressData[0].value} radius={120} strokeWidth={16} variant="success" className="text-green-600">
                                <ProgressCircle
                                    value={progressData[1].value}
                                    radius={95}
                                    strokeWidth={16}
                                    variant="default"
                                >
                                    <ProgressCircle
                                        value={progressData[2].value}
                                        radius={70}
                                        strokeWidth={16}
                                        variant="error"
                                    >
                                        <p>
                                            <span className="text-3xl font-semibold text-gray-900 dark:text-gray-50">
                                                {jobProgress.summary.totalResumes}
                                            </span>
                                        </p>
                                    </ProgressCircle>
                                </ProgressCircle>
                            </ProgressCircle>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 w-full">
                            {progressData.map((item) => (
                                <div key={item.category} className="flex items-start">
                                    <div className={cx("w-1 h-12 rounded mr-2 flex-shrink-0", item.color.split(' ')[0])}></div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">
                                            {item.count}{item.isPercentage ? '%' : ''}{' '}
                                            {!item.isPercentage && item.category !== 'Total Resumes' && (
                                                <span className="font-normal text-gray-500 text-xs">({item.value}%)</span>
                                            )}
                                        </p>
                                        <p className="mt-0.5 text-xs text-gray-500">
                                            {item.category}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-12 gap-4 mb-4">
                {/* Top Candidate Insight */}
                <div className="col-span-12 lg:col-span-4">
                    <Card className="p-3 border border-gray-200 shadow-sm rounded-lg h-full">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-base font-semibold">Top Candidate Insight</h2>
                            <Badge className="bg-green-50 text-green-700">{jobProgress.topCandidate.matchPercentage}% Match</Badge>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold">{jobProgress.topCandidate.name}</h3>
                            <p className="text-gray-600 text-xs">{jobProgress.topCandidate.position} <span className="text-gray-400">• {jobProgress.topCandidate.matchPercentage}% Match</span></p>
                            <p className="text-gray-600 text-xs mb-2">
                                {jobProgress.topCandidate.education} <span className="mx-1">•</span> {jobProgress.topCandidate.location}
                            </p>

                            <div className="grid grid-cols-2 gap-2 mb-3">
                                <div>
                                    <h4 className="font-medium text-gray-700 text-xs mb-1">Key Achievements</h4>
                                    <ul className="space-y-0.5">
                                        {jobProgress.topCandidate.achievements.map((achievement: string, index: number) => (
                                            <li key={index} className="flex items-start text-xs">
                                                <RiArrowRightUpLine className="mt-0.5 mr-1 text-green-500 flex-shrink-0 size-3" />
                                                <span>{achievement}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-700 text-xs mb-1">Top Skills</h4>
                                    <div className="flex flex-wrap gap-1">
                                        {jobProgress.topCandidate.skills.map((skill: string, index: number) => (
                                            <Badge key={index} className="bg-blue-50 text-blue-700 text-xs py-0.5 px-1.5">{skill}</Badge>
                                        ))}
                                    </div>

                                    <h4 className="font-medium text-gray-700 text-xs mt-2 mb-1">Skill Gap</h4>
                                    <div className="flex flex-wrap gap-1">
                                        {jobProgress.topCandidate.skillGaps.map((skill: string, index: number) => (
                                            <Badge key={index} className="bg-red-50 text-red-700 text-xs py-0.5 px-1.5">{skill}</Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 mt-3 border-t pt-3">
                                <a
                                    href={jobProgress.topCandidate.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                >
                                    <svg className="size-3" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19.7 3H4.3C3.582 3 3 3.582 3 4.3v15.4c0 .718.582 1.3 1.3 1.3h15.4c.718 0 1.3-.582 1.3-1.3V4.3c0-.718-.582-1.3-1.3-1.3zM8.34 18.338H5.666v-8.59H8.34v8.59zM7.003 8.574a1.548 1.548 0 11-3.096 0 1.548 1.548 0 013.096 0zm11.335 9.764h-2.668v-4.177c0-.995-.017-2.277-1.387-2.277-1.389 0-1.601 1.086-1.601 2.207v4.247h-2.667v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.779 3.203 4.092v4.711z" />
                                    </svg>
                                    View LinkedIn
                                </a>
                                <div className="space-x-1">
                                    <Button variant="secondary" className="text-xs py-1 px-2">
                                        View Profile
                                    </Button>
                                    <Button className="text-xs py-1 px-2">
                                        Contact
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Skills Analysis */}
                <div className="col-span-12 lg:col-span-4">
                    <Card className="p-3 border border-gray-200 shadow-sm rounded-lg h-full">
                        <h2 className="text-base font-semibold mb-3">Skills Analysis</h2>

                        <div className="space-y-3">
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="text-xs font-medium text-gray-700">Total Screened</h3>
                                    <span className="text-xs font-semibold">{jobProgress.skillAnalysis.totalScreened}</span>
                                </div>
                                <div className="w-full h-1.5 bg-gray-100 rounded-full">
                                    <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: '100%' }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="text-xs font-medium text-gray-700">Matching Threshold</h3>
                                    <span className="text-xs font-semibold">{jobProgress.skillAnalysis.matchingThreshold}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-gray-100 rounded-full">
                                    <div className="h-1.5 bg-green-500 rounded-full" style={{ width: `${jobProgress.skillAnalysis.matchingThreshold}%` }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="text-xs font-medium text-gray-700">Shortlisted Rate</h3>
                                    <span className="text-xs font-semibold">{jobProgress.skillAnalysis.shortlistedRate}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-gray-100 rounded-full">
                                    <div className="h-1.5 bg-purple-500 rounded-full" style={{ width: `${jobProgress.skillAnalysis.shortlistedRate}%` }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="text-xs font-medium text-gray-700">Average Skill Fit</h3>
                                    <span className="text-xs font-semibold">{jobProgress.skillAnalysis.averageSkillFit}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-gray-100 rounded-full">
                                    <div className="h-1.5 bg-yellow-500 rounded-full" style={{ width: `${jobProgress.skillAnalysis.averageSkillFit}%` }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4">
                            <h3 className="text-xs font-medium text-gray-700 mb-2">
                                {jobProgress.hasAiQuestions ? "AI Interview Questions" : "Suggested Interview Questions"}
                            </h3>
                            {!jobProgress.hasAiQuestions && (
                                <div className="text-xs bg-gray-50 p-2 rounded mb-2 text-gray-500 italic">
                                    No AI interview configuration available.
                                </div>
                            )}
                            <ul className="space-y-2">
                                {jobProgress.suggestedQuestions.map((question: string, index: number) => (
                                    <li key={index} className="flex items-start text-xs bg-gray-50 p-2 rounded">
                                        <RiFileTextLine className="mt-0.5 mr-1.5 text-gray-500 flex-shrink-0 size-3.5" />
                                        <span>{question}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </Card>
                </div>

                {/* Candidate Pool Analysis */}
                <div className="col-span-12 lg:col-span-4">
                    <Card className="p-3 border border-gray-200 shadow-sm rounded-lg h-full">
                        <h2 className="text-base font-semibold mb-3">Candidate Pool Analysis</h2>

                        <div>
                            <h3 className="text-xs font-medium text-gray-700 mb-1">Top Skills in Candidate Pool</h3>
                            <div className="flex flex-wrap gap-1 mb-3">
                                {jobProgress.candidatesPool.topSkills.map((skill: string, index: number) => (
                                    <Badge key={index} className="bg-blue-50 text-blue-700 text-xs py-0.5 px-1.5">{skill}</Badge>
                                ))}
                            </div>

                            <h3 className="text-xs font-medium text-gray-700 mb-1">Missing Criteria in Most Candidates</h3>
                            <div className="flex flex-wrap gap-1 mb-3">
                                {jobProgress.candidatesPool.missingCriteria.map((criteria: string, index: number) => (
                                    <Badge key={index} className="bg-red-50 text-red-700 text-xs py-0.5 px-1.5">{criteria}</Badge>
                                ))}
                            </div>

                            <div className="bg-yellow-50 p-2 rounded mb-3">
                                <div className="flex items-start">
                                    <RiAlertLine className="mt-0.5 mr-1 text-yellow-700 flex-shrink-0 size-3.5" />
                                    <p className="text-xs text-yellow-800">
                                        Consider adjusting job requirements or providing learning opportunities for high-potential candidates.
                                    </p>
                                </div>
                            </div>

                            <h3 className="text-xs font-medium text-gray-700 mb-1">Recommended Learning Paths</h3>
                            <ul className="space-y-2">
                                {jobProgress.candidatesPool.learningPaths.map((path: LearningPath, index: number) => (
                                    <li key={index} className="flex flex-col text-xs bg-gray-50 p-2 rounded">
                                        <span className="font-medium">{path.title}</span>
                                        <span className="text-gray-500">{path.provider}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </Card>
                </div>
            </div>

            <h2 className="text-lg font-semibold mb-3">Top Matching Candidates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {jobProgress.candidates.map((candidate: CandidateItem) => (
                    <Card key={candidate.id} className="p-3 border border-gray-200 shadow-sm rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                                {candidate.name.split(' ').map((name: string) => name[0]).join('')}
                            </div>
                            <div>
                                <h3 className="font-medium text-sm">{candidate.name}</h3>
                                <p className="text-xs text-gray-500">{candidate.email}</p>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center">
                                <span className="text-sm font-semibold mr-2">{candidate.matchScore}%</span>
                                <div className="w-24 h-1.5 bg-gray-100 rounded-full">
                                    <div
                                        className={cx(
                                            "h-1.5 rounded-full",
                                            candidate.matchScore >= 80 ? "bg-green-500" :
                                                candidate.matchScore >= 60 ? "bg-blue-500" :
                                                    candidate.matchScore >= 40 ? "bg-yellow-500" : "bg-red-500"
                                        )}
                                        style={{ width: `${candidate.matchScore}%` }}
                                    ></div>
                                </div>
                            </div>
                            <Link href={`/candidates/${candidate.id}`}>
                                <Button variant="ghost" className="text-xs py-1 px-2">
                                    View
                                </Button>
                            </Link>
                        </div>
                    </Card>
                ))}
            </div>
        </>
    )
} 