"use client"

import { Calendar } from "lucide-react"
import { Card } from "@/components/ui/card"

export interface CandidateQualityScoreCardProps {
  score: number
  month: string
  previousMonth: string
  scoreChange: number
  trendingMessage: string
}

export function CandidateQualityCard({
  score = 82,
  month = "April",
  previousMonth = "March",
  scoreChange = 4,
  trendingMessage = "Your cost per hire is trending up for engineering roles",
}: CandidateQualityScoreCardProps) {
  return (
    <Card className="flex flex-col p-1.5 rounded-3xl ">
      {/* Top: header and subtitle */}
      <div>
        <div className="flex items-start gap-1 mb-0.5">
          <div className="w-3 h-3 mt-0.5 text-gray-700">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="12" r="3" fill="currentColor" />
            </svg>
          </div>
          <h3 className="font-semibold text-[14px] text-gray-800">
            Candidate
            <br />
            Quality Score
          </h3>
        </div>
        <p className="text-[8px] text-gray-500 mb-0.5">
          Avg. assessment score across
          <br />
          shortlisted candidates
        </p>
      </div>

      {/* Middle: metric/visual, centered */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex justify-center items-center mb-1">
          <div className="relative w-24 h-24">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {/* Background track - invisible */}
              <circle cx="50" cy="50" r="40" fill="none" stroke="transparent" strokeWidth="10" strokeLinecap="round" />

              {/* Green segment (left/bottom) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#86efac"
                strokeWidth="10"
                strokeDasharray="125.6"
                strokeDashoffset="0"
                strokeLinecap="round"
              />

              {/* Yellow segment (middle) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#fde68a"
                strokeWidth="10"
                strokeDasharray="62.8"
                strokeDashoffset="-125.6"
                strokeLinecap="round"
              />

              {/* Light blue segment (right) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#a5f3fc"
                strokeWidth="10"
                strokeDasharray="62.8"
                strokeDashoffset="-188.4"
                strokeLinecap="round"
              />

              {/* Pink segment (end) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#fda4af"
                strokeWidth="10"
                strokeDasharray="31.4"
                strokeDashoffset="-251.2"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-gray-800">{score}</div>
              <div className="text-[9px] text-gray-500">/100</div>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-300 my-0.5"></div>

      {/* Bottom: details/info */}
      <div className="space-y-0.5">
        <div className="flex items-center gap-1 text-[8px] text-gray-600">
          <Calendar className="w-2 h-2 text-gray-400" />
          <span className="font-semibold">
            {month}: {score}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[8px]">
          <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[4px] border-b-green-500"></div>
          <span className="text-green-600 font-semibold">+{scoreChange} pts</span>
          <span className="text-gray-600">vs {previousMonth}</span>
        </div>

        <p className="text-[8px] text-gray-600">
          Your cost per hire <span className="italic">is trending up</span>
          <br />
          for engineering roles
        </p>
      </div>
    </Card>
  )
}
