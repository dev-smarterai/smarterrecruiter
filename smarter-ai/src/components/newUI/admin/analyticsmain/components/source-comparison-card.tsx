import { Clock } from "lucide-react"
import { Card } from "@/components/ui/card"

export interface SourceComparisonCardProps {
  aiPercentage: number
  otherPercentage: number
  totalCandidates: number
  aiCandidates: number
  month: string
}

export function SourceComparisonCard({
  aiPercentage = 62,
  otherPercentage = 38,
  totalCandidates = 2445,
  aiCandidates = 1517,
  month = "April",
}: SourceComparisonCardProps) {
  return (
    <Card className="flex flex-col p-3 bg-white rounded-3xl shadow-sm border-0 w-full max-w-sm">
      {/* Top: header and subtitle */}
      <div className="mb-2">
        <h3 className="font-semibold text-[14px] leading-tight text-gray-900 mb-1">Adam vs Other Sources</h3>
        <p className="text-[8px] text-gray-500 leading-tight">Sourcing percentage comparison</p>
      </div>

      {/* Horizontal divider */}
      <hr className="border-gray-200" />

      {/* Middle: metric/visual, centered */}
      <div className="flex-1 flex flex-col justify-center items-center">
        <div className="flex justify-center mb-2">
          <div className="relative w-28 h-28">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <defs>
                <linearGradient id="sourceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#818CF8" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="35" fill="none" stroke="#EEF1FB" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="35"
                fill="none"
                stroke="url(#sourceGradient)"
                strokeWidth="8"
                strokeDasharray="219.8"
                strokeDashoffset={219.8 * (1 - aiPercentage / 100)}
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-2xl font-bold text-gray-800">{aiPercentage}%</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center mb-2">
          <div>
            <div className="text-[8px] text-gray-500">Adam (AI Recruiter)</div>
            <div className="font-semibold text-[12px] text-[#6366F1]">{aiPercentage}%</div>
          </div>
          <div>
            <div className="text-[8px] text-gray-500">Other Sources</div>
            <div className="font-semibold text-[12px] text-gray-600">{otherPercentage}%</div>
          </div>
        </div>
      </div>

      {/* Horizontal divider */}
      <hr className="border-gray-200 mb-2" />

      {/* Bottom: details/info */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1 text-[8px] text-gray-600">
          <Clock className="w-3 h-3 text-gray-400" />
          <span className="font-medium">
            {month}: {totalCandidates.toLocaleString()} candidates
          </span>
        </div>
        <div className="text-[8px] text-gray-600 ml-4">{aiCandidates.toLocaleString()} candidates</div>
        
        {/* Horizontal divider */}
        <hr className="border-gray-200" />
        
        <p className="text-[8px] text-gray-700 font-medium italic">
          Adam contributed over 60% of source
          <br />
          candidates this month
        </p>
      </div>
    </Card>
  )
}
