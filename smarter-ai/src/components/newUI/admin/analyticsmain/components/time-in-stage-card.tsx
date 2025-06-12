import { ArrowUpRight } from "lucide-react"
import { Card } from "@/components/ui/card"

export interface StageTime {
  name: string
  days: number
}

export interface TimeInStageCardProps {
  stages: StageTime[]
  month: string
  candidates: number
  totalDays: number
  bottleneck: string
}

export function TimeInStageCard({
  stages = [
    { name: "Application Review", days: 2.5 },
    { name: "Initial Screening", days: 1.2 },
    { name: "Interview Rounds", days: 6.8 },
    { name: "Offer Stage", days: 3.0 },
  ],
  month = "April",
  candidates = 1800,
  totalDays = 13.5,
  bottleneck = "Interview Rounds",
}: TimeInStageCardProps) {
  return (
    <Card className="flex flex-col p-1.5 bg-white rounded-3xl ">
      <div className="flex-1 flex flex-col justify-center">
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
              <path d="M6 2v6h.01M18 2v6h.01M6 10h12M12 14v4M16 18h-8" />
            </svg>
          </div>
          <h3 className="font-semibold text-[14px] text-gray-800">
            Time in Each
            <br />
            Hiring Stage
          </h3>
        </div>
        <p className="text-[8px] text-gray-500 mb-0.5">
          Identify stage bottlenecks in the<br />process
        </p>
        <div className="space-y-0.5 mb-0.5 flex-1 flex flex-col justify-center">
          {stages.map((stage, index) => (
            <div key={index} className="space-y-0.5">
              <div className="flex justify-between text-[8px] text-gray-600">
                <span>{stage.name}</span>
                <span>{stage.days} days</span>
              </div>
              <div className="w-full h-1 bg-[#EEF1FB] rounded-full overflow-hidden">
                <div
                  className="bg-[#6366F1] h-1 rounded-full"
                  style={{ width: `${(stage.days / 7) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center justify-between text-[8px] text-gray-600">
            <span>
              {month}: {candidates} candidates
            </span>
            <span>{totalDays} days</span>
          </div>
          <div className="flex items-center gap-1 text-[8px] text-green-500">
            <ArrowUpRight className="w-1.5 h-1.5" />
            <span>Bottleneck: {bottleneck}</span>
          </div>
        </div>
      </div>
      <div>
        <input
          type="text"
          placeholder="Type your message..."
          className="w-full max-h-[4px] rounded-md  pl-1.5 pr-4 border border-gray-200  text-[8px]"
        />
      </div>
    </Card>
  )
}
