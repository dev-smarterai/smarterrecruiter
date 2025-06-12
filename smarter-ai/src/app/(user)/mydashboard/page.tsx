"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { useAuth } from "@/lib/auth"
import ProfileSection from "@/components/newUI/user/profile-section"
import SavedJobs from "@/components/newUI/user/saved-jobs"
import AskAdam from "@/components/newUI/user/ask-adam"
import ApplicationProgress from "@/components/newUI/user/application-progress"
import ProfileMatching from "@/components/newUI/user/profile-matching"
import { Card } from "@/components/ui/card"

export default function Dashboard() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const [isLoadingData, setIsLoadingData] = useState(true)

  // Get candidate information for the current user
  const candidatesData = useQuery(
    api.candidates.getCandidatesByUserId,
    user?._id ? { userId: user._id } : "skip"
  )
  
  // Get the first candidate if available (most users will have only one candidate profile)
  const candidateData = candidatesData && candidatesData.length > 0 ? candidatesData[0] : null
  
  // Get fully detailed candidate for profile matching if we have a candidate ID
  const detailedCandidate = useQuery(
    api.candidates.getCandidate,
    candidateData?._id ? { id: candidateData._id } : "skip"
  )
  
  // Get job based on candidate's meeting code
  const jobData = useQuery(
    api.jobs.getJobInformation,
    candidateData?.meetingCode ? { meetingCode: candidateData.meetingCode } : "skip"
  )

  useEffect(() => {
    // If auth is done loading and user is not authenticated, redirect to login
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
    
    // Set loading state - only wait for candidatesData to be defined
    if (!authLoading && candidatesData !== undefined) {
      setIsLoadingData(false)
    }
  }, [authLoading, isAuthenticated, router, candidatesData])

  // If loading, show loading state
  if (authLoading || isLoadingData) {
    return (
      <div className="min-h-screen p-4 md:p-6 flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="flex justify-center my-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
          <h2 className="text-lg font-semibold mb-2">Loading Dashboard</h2>
          <p className="text-gray-600">Please wait...</p>
        </Card>
      </div>
    )
  }

  // If no candidate data found, show error and button to create profile
  if (!candidateData) {
    return (
      <div className="min-h-screen p-4 md:p-6 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-lg font-semibold mb-2">No candidate profile found</h2>
          <p className="text-gray-600 mb-6">You need to complete your candidate profile before accessing the dashboard.</p>
          <button 
            onClick={() => router.push('/application-form')} 
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Complete Profile
          </button>
        </Card>
      </div>
    )
  }

  // Calculate profile matching scores using aiScore
  const aiScore = candidateData.aiScore || 75
  
  // Prepare profile data from candidate data
  const profileData = {
    name: candidateData.name,
    email: candidateData.email,
    phone: candidateData.phone || "Not provided",
    avatar: "/placeholder.svg?height=96&width=96", // Use default avatar for now
    profileUrl: "/application-form", // URL for edit profile button
    hasInterview: !!detailedCandidate?.candidateProfile?.skills
  }

  // Prepare saved jobs data - use the job associated with the candidate's meeting code
  const savedJobs = jobData ? [
    { 
      id: Number(jobData._id.slice(-4)), // Use last 4 chars of ID for display purposes
      title: jobData.title, 
      company: jobData.company, 
      location: jobData.location || "Remote", 
      type: jobData.type || "Full-time" 
    }
  ] : []

  // Check if interview data is available
  const hasInterviewData = !!detailedCandidate?.candidateProfile?.skills?.technical?.overallScore

  // Prepare application progress data using candidate properties
  const applicationProgressData = {
    title: "Where You Are In the Process",
    subtitle: "Based on last job applied for",
    currentStage: hasInterviewData ? 3 : 2, // Move to offer stage if interview completed
    stages: [
      { name: "Profile", subtext: "Submitted", completed: true },
      { name: "Skills", subtext: "Matched", completed: true },
      { name: "Interview", subtext: hasInterviewData ? "Completed" : "Scheduled", completed: hasInterviewData },
      { name: "Offer", subtext: "", completed: false },
    ],
    metrics: [
      { 
        value: detailedCandidate?.candidateProfile?.skills?.technical?.overallScore?.toString() || aiScore.toString(), 
        unit: "%", 
        label: "Skills matched" 
      },
      { 
        value: detailedCandidate?.candidateProfile?.skillInsights?.matchedSkills?.length?.toString() || "6", 
        unit: "", 
        label: "Matched skills" 
      },
      { 
        value: detailedCandidate?.candidateProfile?.skills?.technical?.overallScore > 85 
          ? "Excellent" 
          : detailedCandidate?.candidateProfile?.skills?.technical?.overallScore > 70 
            ? "Good" 
            : "Fair", 
        unit: "", 
        label: "Role Fit", 
        color: "text-green-600" 
      },
    ],
  }

  // Prepare profile matching data using the real values from candidateData
  const profileMatchingData = {
    title: "Profile Matching",
    keySkillsPercentage: detailedCandidate?.candidateProfile?.skills?.technical?.overallScore || aiScore,
    skillsMatched: detailedCandidate?.candidateProfile?.skillInsights?.matchedSkills?.length || 6,
    assessments: [
      { 
        name: "Overall Fit", 
        passed: (detailedCandidate?.candidateProfile?.skills?.technical?.overallScore || aiScore) >= 70
      },
      { 
        name: "Culture Fit", 
        passed: (detailedCandidate?.candidateProfile?.skills?.culture?.overallScore || aiScore) >= 65
      },
      { 
        name: "Soft Skills", 
        passed: (detailedCandidate?.candidateProfile?.skills?.soft?.overallScore || aiScore) >= 70 
      },
      { 
        name: "Technical Skills", 
        passed: (detailedCandidate?.candidateProfile?.skills?.technical?.overallScore || aiScore) >= 75
      },
    ],
    footer: hasInterviewData 
      ? "Based on your resume and interview analysis" 
      : "Interview not yet conducted or analyzed",
    hasInterviewData: hasInterviewData
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 h-full">
          {/* Left Column */}
          <div className="space-y-4 md:space-y-6">
            <ProfileSection
              name={profileData.name}
              email={profileData.email}
              phone={profileData.phone}
              avatar={profileData.avatar}
              profileUrl={profileData.profileUrl}
              hasInterview={profileData.hasInterview}
            />
            <SavedJobs jobs={savedJobs} />
          </div>

          {/* Middle Column */}
          <div className="h-full">
            <AskAdam />
          </div>

          {/* Right Column */}
          <div className="space-y-4 md:space-y-6">
            <ApplicationProgress
              title={applicationProgressData.title}
              subtitle={applicationProgressData.subtitle}
              currentStage={applicationProgressData.currentStage}
              stages={applicationProgressData.stages}
              metrics={applicationProgressData.metrics}
            />
            <ProfileMatching
              title={profileMatchingData.title}
              keySkillsPercentage={profileMatchingData.keySkillsPercentage}
              skillsMatched={profileMatchingData.skillsMatched}
              assessments={profileMatchingData.assessments}
              footer={profileMatchingData.footer}
              hasInterviewData={profileMatchingData.hasInterviewData}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
