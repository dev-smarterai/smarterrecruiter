import { TrendingUp } from "lucide-react"
import { Card } from "@/components/ui/card"

export interface PredictiveHiringCardProps {
  forecastThrough: string
  highDemandDate: string
  months: string[]
  engineeringPrediction: string
  marketingPrediction: string
}

export function PredictiveHiringCard({
  forecastThrough = "December 2024",
  highDemandDate = "Dec 2024",
  months = ["Jun", "Aug", "Oct", "Dec 2024"],
  engineeringPrediction = "Engineering hiring predicted to increase significantly",
  marketingPrediction = "Marketing demand pro jected to remain steady",
}: PredictiveHiringCardProps) {
  return (
    <Card className="flex flex-col p-3 bg-white rounded-3xl shadow-sm border-0 w-full max-w-sm">
      {/* Top: header and subtitle */}
      <div className="mb-2">
        <div className="flex items-center gap-1 mb-1">
          <TrendingUp className="w-3 h-3 text-[#6366F1]" />
          <h3 className="font-semibold text-[14px] leading-tight text-gray-900">
            Predictive Hiring
            <br />
            Trends
          </h3>
        </div>
        <p className="text-[8px] text-gray-500 leading-tight">
          Forecasted hiring needs through
          <br />
          {forecastThrough}
        </p>
      </div>

      {/* Horizontal divider */}
      <hr className="border-gray-200" />

      {/* Middle: chart/visual, centered */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="h-24 relative mb-2">
          {/* High demand label */}
          <div className="absolute top-0 right-0 text-right">
            <div className="text-[10px] font-semibold text-gray-900">
              {highDemandDate}
            </div>
            <div className="text-[8px] text-gray-500">High demand</div>
          </div>
          
          {/* Chart area */}
          <div className="h-full w-full relative mt-4">
            <svg viewBox="0 0 300 80" className="w-full h-16">
              <defs>
                <linearGradient id="engineeringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#818CF8" />
                </linearGradient>
                <linearGradient id="marketingGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#A855F7" />
                  <stop offset="100%" stopColor="#C084FC" />
                </linearGradient>
              </defs>
              
              {/* Engineering roles line (steeper curve) */}
              <path
                d="M0,60 C50,55 100,45 150,35 C200,25 250,15 300,5"
                stroke="url(#engineeringGradient)"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
              
              {/* Marketing roles line (gentler curve) */}
              <path
                d="M0,65 C50,62 100,58 150,52 C200,48 250,45 300,40"
                stroke="url(#marketingGradient)"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Month labels */}
        <div className="flex justify-between text-[8px] text-gray-500 mb-2">
          {months.map((month, index) => (
            <span key={index} className="font-medium">{month}</span>
          ))}
        </div>
      </div>

      {/* Horizontal divider */}
      <hr className="border-gray-200 mb-2" />

      {/* Bottom: legend and details */}
      <div className="space-y-1.5">
        {/* Legend */}
        <div className="flex items-center gap-3 text-[8px]">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[#6366F1]"></div>
            <span className="text-gray-700 font-medium">Engineering roles</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[#A855F7]"></div>
            <span className="text-gray-700 font-medium">Marketing roles</span>
          </div>
        </div>

        {/* Predictions */}
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[#6366F1]"></div>
            <span className="text-[8px] text-gray-700 font-medium">{engineeringPrediction}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[#A855F7]"></div>
            <span className="text-[8px] text-gray-700 font-medium">{marketingPrediction}</span>
          </div>
        </div>

        {/* Horizontal divider */}
        <hr className="border-gray-200" />

        {/* Input field */}
        <input
          type="text"
          placeholder="Type a question..."
          className="w-full px-2 max-h-[4px] border border-gray-200 rounded-md text-[8px] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 transition-colors"
        />
      </div>
    </Card>
  )
}
