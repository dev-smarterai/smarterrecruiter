import { ArrowUpRight, Timer } from "lucide-react"
import { Card } from "@/components/ui/card"

export interface WorkloadReductionCardProps {
  hours: number
  month: string
  previousMonth: string
  hoursChange: number
  weeksEquivalent: number
}

export function WorkloadReductionCard({
  hours = 134,
  month = "April",
  previousMonth = "March",
  hoursChange = 28,
  weeksEquivalent = 3,
}: WorkloadReductionCardProps) {
  // Calculate percentage for the radial chart (assuming max hours is around 200 for full chart)
  const percentage = Math.min((hours / 200) * 100, 100)
  
  // Calculate stroke dash array for the progress circle
  const radius = 35
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <Card className="p-3 bg-white rounded-3xl">
      <div className="flex flex-col md:flex-row justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 ">
            <div className="w-6 h-6 rounded-full  flex items-center justify-center">
              <Timer className="w-6 h-6 text-gray-300" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              Recruiter
              <br />
              Workload Reduction
            </h2>
          </div>

          <div className="text-[10px] ml-8 text-gray-500">
            <p>
              Estimated hours saved
              <br />
              through automation
            </p>
          </div>

          <div className="flex items-center ml-8 gap-1 text-[10px] text-gray-700">
            <Timer className="w-2.5 h-2.5 text-gray-400" />
            <span>
              {month}: {hours} hrs
            </span>
          </div>

          <div className="flex items-center ml-8 gap-1 text-[10px] text-gray-700">
            <ArrowUpRight className="w-2.5 h-2.5 text-green-500" />
            <span>
              + {hoursChange} hrs vs {previousMonth}
            </span>
          </div>

          <p className="text-[10px] ml-8 text-gray-500 italic">
            AI tools saved you the equivalent of {weeksEquivalent} full work weeks.
          </p>
        </div>

        <div className="mt-1 md:mt-0 flex items-center justify-center">
          <div className="relative w-28 h-28">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="8"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="#E0E7FF"
                strokeWidth="8"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-xl font-bold text-indigo-600">{hours}</div>
                <div className="text-[9px] text-indigo-500 font-medium">hrs saved</div>
                <div className="text-[8px] text-gray-600">this month</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
