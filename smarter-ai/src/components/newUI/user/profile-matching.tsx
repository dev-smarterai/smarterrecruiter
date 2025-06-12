"use client"

import { Card } from "@/components/ui/card"

interface Assessment {
  name: string
  passed: boolean
}

interface ProfileMatchingProps {
  title: string
  keySkillsPercentage: number
  skillsMatched: number
  assessments: Assessment[]
  footer: string
  hasInterviewData?: boolean
}

const ProfileMatching = ({ 
  title, 
  keySkillsPercentage, 
  skillsMatched, 
  assessments, 
  footer,
  hasInterviewData = false 
}: ProfileMatchingProps) => {
  return (
    <Card className="p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-xl font-bold text-gray-900 mb-6 font-sans">{title}</h2>

      {!hasInterviewData && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
          <p className="text-amber-700 text-sm font-sans">
            Interview has not been conducted or analyzed yet. Assessment shown is based on preliminary profile data.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        {/* Key Skills Circle */}
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Background circle */}
            <circle cx="50" cy="50" r="45" fill="none" stroke="#e9d5ff" strokeWidth="10" />

            {/* Progress circle - we calculate the dash offset based on percentage */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#a78bfa"
              strokeWidth="10"
              strokeDasharray="283"
              strokeDashoffset={283 - (283 * keySkillsPercentage) / 100}
              transform="rotate(-90 50 50)"
            />

            {/* Text in the center */}
            <text x="50" y="45" textAnchor="middle" fontSize="14" fontWeight="500" fontFamily="sans-serif">
              Key
            </text>
            <text x="50" y="65" textAnchor="middle" fontSize="14" fontWeight="500" fontFamily="sans-serif">
              Skills
            </text>
          </svg>
        </div>

        <div className="text-center">
          <div className="text-5xl font-bold font-sans">{skillsMatched}</div>
          <div className="text-sm text-gray-500 font-sans">Skills matched</div>
        </div>
      </div>

      <div className="space-y-3">
        {assessments.map((assessment, index) => (
          <div key={index} className="flex justify-between items-center">
            <div className="font-medium font-sans">{assessment.name}</div>
            <div
              className={`w-6 h-6 rounded-full ${
                assessment.passed ? "bg-green-100" : "bg-red-100"
              } flex items-center justify-center`}
            >
              {assessment.passed ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-4 font-sans">{footer}</p>
    </Card>
  )
}

export default ProfileMatching
