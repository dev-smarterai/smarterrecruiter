import { Calendar } from "lucide-react"
import { Card } from "@/components/ui/card"

export interface ScreeningSuccessCardProps {
  percentage: number
  month: string
  totalScreened: number
  passedScreening: number
  observation: string
}

export function ScreeningSuccessCard({
  percentage = 72,
  month = "April",
  totalScreened = 1250,
  passedScreening = 900,
  observation = "AI screening accuracy proving across technical roles.",
}: ScreeningSuccessCardProps) {
  return (
    <Card className="flex flex-col p-1.5 bg-white rounded-3xl">
      {/* Top: header and subtitle */}
      <div>
        <div className="flex items-center gap-2 ml-1 mb-0.5">
          <div className="w-3 h-3 bg-[#6366F1] rounded-md flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="10" x="3" y="11" rx="2"/>
              <circle cx="12" cy="5" r="2"/>
              <path d="m12 7-4 1v4h8V8l-4-1z"/>
              <circle cx="9" cy="13" r="1"/>
              <circle cx="15" cy="13" r="1"/>
            </svg>
          </div>
          <h3 className="font-semibold text-[14px] text-gray-800">
            Screening
            <br />
            Success Rate
          </h3>
        </div>
        <p className="text-[8px] text-gray-500 ml-6 mb-0.5">
          % AI-screened candidates
          <br />
          passing recruiter review
        </p>
      </div>

      {/* Middle: metric/visual, centered */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex justify-center items-center mb-1">
          <div className="relative w-16 h-16">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <defs>
                <linearGradient id="screeningGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="40" fill="none" stroke="#EEF1FB" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="url(#screeningGradient)"
                strokeWidth="8"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 * (1 - percentage / 100)}
                transform="rotate(-90 50 50)"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-[18px] font-bold text-gray-800">{percentage}%</div>
                <div className="text-[6px] text-gray-500">Passed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal divider line */}
      <div className="w-full h-px bg-gray-200 mb-1"></div>

      {/* Bottom: details and input */}
      <div>
        <div className="space-y-0.5">
          <div className="flex items-center justify-between text-[8px] text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="w-2 h-2 text-gray-400" />
              <span>
                {month}: {totalScreened.toLocaleString()}
              </span>
            </div>
            <span>{passedScreening.toLocaleString()} candidates</span>
          </div>
          <p className="text-[8px] text-gray-600">{observation}</p>
        </div>
        <div className="mt-0.5">
          <input
            type="text"
            placeholder="Type your message..."
            className="w-full max-h-[4px] rounded-md  pl-1.5 pr-4 border border-gray-200  text-[8px]"
          />
        </div>
      </div>
    </Card>
  )
}
