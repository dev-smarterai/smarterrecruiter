"use client"

import React from "react"

// Icon components
const WarningIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
      stroke="#F59E0B"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const StarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
      stroke="#8B5CF6"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 6L9 17L4 12" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const ChatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
      stroke="#60A5FA"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="#F59E0B" strokeWidth="2" />
    <polyline points="12,6 12,12 16,14" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="#60A5FA" strokeWidth="2" />
    <line x1="16" y1="2" x2="16" y2="6" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
    <line x1="8" y1="2" x2="8" y2="6" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
    <line x1="3" y1="10" x2="21" y2="10" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const DocumentIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
      stroke="#6366F1"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <polyline points="14,2 14,8 20,8" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const PeopleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
      stroke="#6366F1"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="9" cy="7" r="4" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M23 21V19C23 18.1645 22.7155 17.3541 22.2094 16.6977C21.7033 16.0414 20.9999 15.5735 20.2 15.3613"
      stroke="#6366F1"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 3.36133C16.8003 3.57343 17.5037 4.04133 18.0098 4.69767C18.5159 5.35401 18.8004 6.16441 18.8004 7C18.8004 7.83559 18.5159 8.64599 18.0098 9.30233C17.5037 9.95867 16.8003 10.4266 16 10.6387"
      stroke="#6366F1"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

// Circular Progress Component
const CircularProgress = ({ percentage, size = 120 }: { percentage: number; size?: number }) => {
  const radius = (size - 20) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#E5E7EB" strokeWidth="8" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#8B5CF6"
          strokeWidth="8"
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-bold text-gray-800">{percentage}%</span>
      </div>
    </div>
  )
}

// Progress Bar Component
const ProgressBar = ({ label, percentage }: { label: string; percentage: number }) => (
  <div className="flex items-center justify-between mb-3">
    <span className="text-sm text-gray-600 w-24">{label}</span>
    <div className="flex-1 mx-3">
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-blue-400 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
    <span className="text-sm font-medium text-gray-800 w-8">{percentage}%</span>
  </div>
)

// Heatmap Cell Component
const HeatmapCell = ({ value }: { value: number }) => {
  const getColor = (val: number) => {
    if (val >= 80) return "bg-green-300"
    if (val >= 60) return "bg-yellow-300"
    if (val >= 40) return "bg-orange-300"
    return "bg-red-300"
  }

  return (
    <div className={`${getColor(value)} p-4 text-center font-medium text-gray-800 border border-white`}>{value}</div>
  )
}

interface DashboardProps {
  recommendations?: {
    urgentAttention?: {
      title: string
      description: string
    }
    highPotential?: {
      title: string
      description: string
    }
    suggestion?: {
      title: string
      description: string
    }
  }
  todaysActions?: {
    feedback?: string
    assessments?: string
    interviews?: string
  }
  metrics?: {
    activeJobs: number
    candidates: number
    sourced: number
    screened: number
    scheduled: number
  }
  profileMatching?: {
    percentage: number
    rolesMatched: number
    skills: Array<{ name: string; percentage: number }>
  }
  candidateMatch?: {
    departments: string[]
    levels: string[]
    data: number[][]
  }
}

export default function Dashboard({
  recommendations = {
    urgentAttention: {
      title: "Needs Urgent Attention",
      description: "Suggestions for roles with low candidate pipeline",
    },
    highPotential: {
      title: "High-Potential Candidates",
      description: "Flagged for immediate review",
    },
    suggestion: {
      title: "Adam Suggests",
      description: "Emily Dawson for Marketing Specialist",
    },
  },
  todaysActions = {
    feedback: "Feedback pending",
    assessments: "Expiring assessments",
    interviews: "Interviews to schedule",
  },
  metrics = {
    activeJobs: 8,
    candidates: 132,
    sourced: 56,
    screened: 45,
    scheduled: 31,
  },
  profileMatching = {
    percentage: 80,
    rolesMatched: 6,
    skills: [
      { name: "Experience", percentage: 85 },
      { name: "JavaScript", percentage: 90 },
      { name: "Leadership", percentage: 88 },
      { name: "Data Analysis", percentage: 75 },
      { name: "Python", percentage: 80 },
    ],
  },
  candidateMatch = {
    departments: ["Sales", "Operations", "Finance", "Engineering"],
    levels: ["Junior", "Middle", "Executive"],
    data: [
      [52, 73, 96],
      [41, 79, 88],
      [44, 56, 81],
      [33, 47, 73],
    ],
  },
}: DashboardProps) {
  return (
    <div className="relative lg:bottom-36">
      <div className="max-w-7xl mx-auto">
        {/* Top Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Adam's Recommendations */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-700 mb-6">Adam's Recommendations</h2>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-yellow-100 p-2 rounded-full">
                  <WarningIcon />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">{recommendations.urgentAttention?.title}</h3>
                  <p className="text-sm text-gray-600">{recommendations.urgentAttention?.description}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 p-2 rounded-full">
                  <StarIcon />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">{recommendations.highPotential?.title}</h3>
                  <p className="text-sm text-gray-600">{recommendations.highPotential?.description}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckIcon />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">{recommendations.suggestion?.title}</h3>
                  <p className="text-sm text-gray-600">{recommendations.suggestion?.description}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Actions */}
          <div className="bg-gradient-to-br from-white to-purple-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-600 mb-6 text-center">Todays Actions</h2>

            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-3 rounded-full">
                  <ChatIcon />
                </div>
                <span className="text-gray-700 font-medium">{todaysActions.feedback}</span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-yellow-100 p-3 rounded-full">
                  <ClockIcon />
                </div>
                <span className="text-gray-700 font-medium">{todaysActions.assessments}</span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-3 rounded-full">
                  <CalendarIcon />
                </div>
                <span className="text-gray-700 font-medium">{todaysActions.interviews}</span>
              </div>
            </div>
          </div>

          {/* Metrics Overview */}
          <div className="bg-gray-50 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-600 mb-6 text-center">Metrics Overview</h2>

            <div className="grid grid-cols-2 gap-6">
              <div className="text-center bg-white rounded-2xl p-4">
                <div className="flex justify-center mb-2">
                  <DocumentIcon />
                </div>
                <div className="text-sm text-gray-600 mb-1">Active Job</div>
                <div className="text-sm text-gray-600 mb-2">Postings</div>
                <div className="text-3xl font-bold text-gray-800">{metrics.activeJobs}</div>
              </div>

              <div className="text-center bg-white rounded-2xl p-4">
                <div className="flex justify-center mb-2">
                  <PeopleIcon />
                </div>
                <div className="text-sm text-gray-600 mb-1">Candidates</div>
                <div className="text-sm text-gray-600 mb-2">in Pipeline</div>
                <div className="text-3xl font-bold text-gray-800">{metrics.candidates}</div>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <div className="flex justify-between bg-white rounded-xl p-3">
                <span className="text-sm text-gray-600">Sourced</span>
                <span className="text-sm font-medium">{metrics.sourced}</span>
              </div>
              <div className="flex justify-between bg-white rounded-xl p-3">
                <span className="text-sm text-gray-600">Screened</span>
                <span className="text-sm font-medium">{metrics.screened}</span>
              </div>
              <div className="flex justify-between bg-white rounded-xl p-3">
                <span className="text-sm text-gray-600">Scheduled</span>
                <span className="text-sm font-medium">{metrics.scheduled}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Profile Matching */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-700 mb-6">Profile Matching</h2>

            <div className="flex items-center space-x-6 mb-6">
              <CircularProgress percentage={profileMatching.percentage} />
              <div>
                <div className="text-2xl font-bold text-gray-800">{profileMatching.rolesMatched}</div>
                <div className="text-gray-600">Roles matched</div>
              </div>
            </div>

            <div className="space-y-3">
              {profileMatching.skills.map((skill, index) => (
                <ProgressBar key={index} label={skill.name} percentage={skill.percentage} />
              ))}
            </div>

            <p className="text-xs text-gray-500 mt-4">Based on your resume and test results</p>
          </div>

          {/* Candidate Match Overview */}
          <div className="lg:col-span-3 bg-gradient-to-br from-white to-purple-200 rounded-3xl p-6 shadow-sm border-2 border-blue-300">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">CANDIDATE MATCH OVERVIEW</h2>

            <div className="overflow-hidden rounded-lg">
              <div className="grid grid-cols-4 gap-0">
                {/* Header row */}
                <div className="p-4"></div>
                {candidateMatch.levels.map((level, index) => (
                  <div key={index} className="p-4 text-center font-semibold text-gray-700">
                    {level}
                  </div>
                ))}

                {/* Data rows */}
                {candidateMatch.departments.map((dept, deptIndex) => (
                  <React.Fragment key={deptIndex}>
                    <div className=" p-4 font-semibold text-gray-700">{dept}</div>
                    {candidateMatch.data[deptIndex].map((value, levelIndex) => (
                      <HeatmapCell key={levelIndex} value={value} />
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
              <span>Low</span>
              <div className="flex space-x-1">
                <div className="w-4 h-4 bg-red-300 rounded"></div>
                <div className="w-4 h-4 bg-orange-300 rounded"></div>
                <div className="w-4 h-4 bg-yellow-300 rounded"></div>
                <div className="w-4 h-4 bg-green-300 rounded"></div>
              </div>
              <span>High</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
