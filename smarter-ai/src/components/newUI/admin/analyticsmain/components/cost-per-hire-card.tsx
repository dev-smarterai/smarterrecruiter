import { Calendar } from "lucide-react"
import { Card } from "@/components/ui/card"

export interface CostPerHireCardProps {
  cost: number
  month: string
  costChange: number
  percentageLower: number
}

export function CostPerHireCard({
  cost = 3400,
  month = "April",
  costChange = 200,
  percentageLower = 8,
}: CostPerHireCardProps) {
  return (
    <Card className="flex flex-col p-1.5  bg-white rounded-3xl">
      {/* Top: header and subtitle */}
      <div className="">
        <div className="flex items-center gap-1 mb-0.5">
          <div className="w-3 h-3 text-teal-500">
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
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <h3 className="font-semibold text-[14px] text-gray-800">Cost per Hire</h3>
        </div>
        <p className="text-[8px] text-gray-500 mb-0.5">
          Avg, recruitment cost per successful
          <br />
          hire
        </p>
      </div>

      {/* Middle: metric/visual, centered */}
      <div className="flex-1 flex flex-col p-2 justify-center">
        <div className="flex justify-center items-center mb-1">
          <div className="relative w-28 h-28">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Background circle */}
              <circle cx="50" cy="50" r="35" fill="none" stroke="#F3F4F6" strokeWidth="8" />

              {/* Purple segment (about 45% of circle) */}
              <circle
                cx="50"
                cy="50"
                r="35"
                fill="none"
                stroke="#A78BFA"
                strokeWidth="8"
                strokeDasharray="98.96"
                strokeDashoffset="0"
                transform="rotate(-90 50 50)"
                strokeLinecap="round"
              />

              {/* Light blue segment (about 30% of circle) */}
              <circle
                cx="50"
                cy="50"
                r="35"
                fill="none"
                stroke="#93C5FD"
                strokeWidth="8"
                strokeDasharray="65.97"
                strokeDashoffset="-98.96"
                transform="rotate(-90 50 50)"
                strokeLinecap="round"
              />

              {/* Teal segment (about 25% of circle) */}
              <circle
                cx="50"
                cy="50"
                r="35"
                fill="none"
                stroke="#6EE7B7"
                strokeWidth="8"
                strokeDasharray="54.98"
                strokeDashoffset="-164.93"
                transform="rotate(-90 50 50)"
                strokeLinecap="round"
              />
            </svg>

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-[14px] font-bold text-gray-800">${cost.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: details/info */}
      <div className="space-y-0.5">
        <div className="flex items-center gap-1 text-[8px] text-gray-600">
          <Calendar className="w-2 h-2 text-gray-400" />
          <span>{month}:</span>
          <span className="font-semibold ml-auto">${cost.toLocaleString()}</span>
        </div>

        <div className="flex items-center gap-1 text-[8px] text-teal-500">
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
            <path d="M7 13l3 3 7-7"></path>
          </svg>
          <span className="font-semibold ">▼${costChange}</span>
          <span className="text-gray-500 ml-auto">vs March</span>
        </div>

        <p className="text-[8px] text-gray-600">
          Your cost per hire is {percentageLower}% lower
          <br />
          than last quarter.
        </p>
      </div>
    </Card>
  )
}
