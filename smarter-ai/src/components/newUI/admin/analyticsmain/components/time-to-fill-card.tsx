import { Clock } from "lucide-react"
import { Card } from "@/components/ui/card"

export interface TimeToFillCardProps {
  days: number
  month: string
  daysChange: number
  percentageFaster: number
}

export function TimeToFillCard({
  days = 21,
  month = "April",
  daysChange = 3,
  percentageFaster = 15,
}: TimeToFillCardProps) {
  // SVG path for a simple line chart
  const linePath = "M5,40 C15,20 25,35 35,25 C45,15 55,30 65,20 C75,10 85,25 95,15"

  return (
    <Card className="flex flex-col p-1.5 bg-white rounded-3xl">
      {/* Top: header and subtitle */}
      <div>
        <div className="flex items-center gap-1 mb-0.5">
          <div className="w-3 h-3 text-[#6366F1]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
          </div>
          <h3 className="font-semibold text-[14px] text-gray-800">Time to Fill</h3>
        </div>
        <p className="text-[8px] text-gray-500 mb-0.5">Average days from job post to hire</p>
      </div>

      {/* Middle: metric/visual, centered */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="text-center mb-1">
          <div className="text-[10px] font-semibold text-gray-800">{month}</div>
          <div className="text-[10px] text-gray-600">{days} days</div>
        </div>

        <div className="relative h-10 w-full mb-1">
          <svg viewBox="0 0 100 50" className="w-full h-full">
            <path d={linePath} fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <div className="flex justify-between text-[6px] text-gray-400 mb-1">
          <span>Jan</span>
          <span>Feb</span>
          <span>Mar</span>
          <span>Apr</span>
          <span>May</span>
          <span>Jun</span>
        </div>
      </div>

      {/* Bottom: details/info */}
      <div className="space-y-0.5">
        <div className="flex items-center gap-1 text-[8px] text-green-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="8"
            height="8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
          <span className="font-semibold">{daysChange} day's</span>
          <span className="text-gray-500">vs March</span>
        </div>

        <div className="flex items-center gap-1 text-[8px] text-gray-600">
          <Clock className="w-2 h-2 text-gray-400" />
          <span>
            Your time to fill is {percentageFaster}% faster
            <br />
            than industry average
          </span>
        </div>
      </div>
    </Card>
  )
}
