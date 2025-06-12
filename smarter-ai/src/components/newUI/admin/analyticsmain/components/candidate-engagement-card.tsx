import { Clock, MessageSquare } from "lucide-react"
import { Card } from "@/components/ui/card"

export interface CandidateEngagementCardProps {
  percentage: number
  responseTime: number
  candidatesResponded: number
  percentageChange: number
  observation: string
}

export function CandidateEngagementCard({
  percentage = 88,
  responseTime = 3.2,
  candidatesResponded = 88,
  percentageChange = 6,
  observation = "Strong engagement observed from tech and product roles.",
}: CandidateEngagementCardProps) {
  return (
    <Card className="flex flex-col p-3 bg-white rounded-3xl shadow-sm border-0 w-full max-w-sm">
      {/* Top: header and subtitle */}
      <div className="mb-2">
        <div className="flex items-center gap-1 mb-0.5">
          <MessageSquare className="w-3 h-3 text-[#A5B4FC]" />
          <h3 className="font-semibold text-[14px] leading-tight text-gray-900">
            Candidate
            <br />
            Engagement Score
          </h3>
        </div>
        <p className="text-[8px] text-gray-500 leading-tight">
          Avg. responsiveness rate
          <br />
          across touchpoints
        </p>
      </div>

      {/* Horizontal divider */}
      <hr className="border-gray-200" />

      {/* Middle: metric/visual, centered */}
      <div className="flex-1 flex flex-col justify-center items-center ">
        <div className="relative w-28 h-28 ">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            <defs>
              <linearGradient id="engagementGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#A5B4FC" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
            <circle 
              cx="50" 
              cy="50" 
              r="35" 
              fill="none" 
              stroke="#F1F5F9" 
              strokeWidth="8" 
            />
            <circle
              cx="50"
              cy="50"
              r="35"
              fill="none"
              stroke="url(#engagementGradient)"
              strokeWidth="8"
              strokeDasharray={`${(percentage / 100) * 219.8} 219.8`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{percentage}%</div>
              <div className="text-[9px] text-gray-600 font-medium">Engaged</div>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal divider */}
      <hr className="border-gray-200 mb-2" />

      {/* Bottom: details and input */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[8px]">
          <div className="flex items-center gap-1 text-gray-600">
            <Clock className="w-3 h-3" />
            <span className="font-medium">April</span>
          </div>
          <span className="font-semibold text-gray-900">{responseTime} hrs</span>
        </div>
        
        <div className="text-[8px] text-gray-600">
          <span className="font-medium">{candidatesResponded}% of candidates responded</span>
          <br />
          <span>to at least one message</span>
          <span className="text-green-500 font-semibold ml-1">↑{percentageChange}%</span>
        </div>
        
        {/* Horizontal divider */}
        <hr className="border-gray-200" />
        
        <p className="text-[8px] text-gray-700 font-medium">{observation}</p>
        
        <input
          type="text"
          placeholder="Type message..."
          className="w-full max-h-[4px] rounded-md  pl-1.5 pr-4 border border-gray-200  text-[8px]"
        />
      </div>
    </Card>
  )
}
