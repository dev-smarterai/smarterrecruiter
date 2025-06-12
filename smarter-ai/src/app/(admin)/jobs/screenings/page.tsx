'use client'
import { useQuery } from "convex/react"
import { queries } from "@/lib/api"
import CandidateTracker from "@/components/newUI/admin/candidates/sourceCandidates"
import { Id } from "../../../../../convex/_generated/dataModel"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/Button"

export default function ScreeningsPage() {
  const params = useParams()
  const jobIdStr = params.id as string

  // Get job progress data
  let jobsProgress;
  try {
    jobsProgress = useQuery(queries.getJobProgressData, { jobId: jobIdStr as Id<"jobs"> });
  } catch (err) {
    jobsProgress = null;
  }

  // Loading state
  if (jobsProgress === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading candidates data...</p>
      </div>
    )
  }

  // If job progress not found, show error
  if (!jobsProgress) {
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

  // Transform candidates data from jobProgress into the format CandidateTracker expects
  const candidates = jobsProgress.candidates.map(candidate => ({
    id: candidate.id,
    name: candidate.name,
    avatarUrl: undefined, // We don't have avatar URLs in the data yet
    previousCompany: "Unknown", // This needs to be fetched from candidate profile
    experience: 0, // This needs to be calculated from candidate profile
    degree: "Unknown", // This needs to be fetched from candidate profile
    status: "sourced" as const, // Default status
    inviteToInterview: candidate.matchScore > 75, // Show interview button for high match scores
    approved: candidate.matchScore > 85, // Auto-approve very high match scores
  }))

  // Transform job data into hiring process format
  const hiringProcess = {
    position: jobsProgress.role,
    stages: [
      { label: "Application submitted", completed: true },
      { label: "Screening interview", completed: jobsProgress.summary.meetingMinCriteria > 0 },
      { label: "Assigned task", completed: false },
      { label: "Final interview", completed: false },
      { label: "Offer", completed: false },
    ],
    currentStage: 1, // Assuming we're at screening stage
    skills: jobsProgress.candidatesPool.topSkills,
    daysWithoutReview: 0, // This could be calculated from last activity timestamp
  }

  const handleInviteToInterview = (candidateId: string) => {
    console.log(`Inviting candidate ${candidateId} to interview`)
    // TODO: Implement interview invitation logic
  }

  const handleReviewNow = () => {
    console.log("Review now clicked")
    // TODO: Implement review logic
  }

  const handleFilterChange = (filters: any) => {
    console.log("Filters changed:", filters)
    // TODO: Implement filter logic
  }

  return (
    <div className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 min-h-screen font-sans">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Screenings for {jobsProgress.role} Role</h1>
        <div className="flex items-center text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-900">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/jobs" className="hover:text-gray-900">Active Jobs</Link>
          <span className="mx-2">/</span>
          <Link href={`/jobs/${jobIdStr}`} className="hover:text-gray-900">Job Details</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Screenings</span>
        </div>
      </div>
      <CandidateTracker
        candidates={candidates}
        hiringProcess={hiringProcess}
        onInviteToInterview={handleInviteToInterview}
        onReviewNow={handleReviewNow}
        onFilterChange={handleFilterChange}
      />
    </div>
  )
}
