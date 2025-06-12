import { ArrowUpRight, Calendar, Briefcase } from "lucide-react"
import { Card } from "@/components/ui/card"

export interface InterviewToHireCardProps {
  interviews: number
  interviewsSubtext: number
  hires: number
  month: string
  interviewCount: number
  hireCount: number
  changeFromPrevious: number
  observation: string
}

export function InterviewToHireCard({
  interviews = 94,
  interviewsSubtext = 37,
  hires = 5.5,
  month = "April",
  interviewCount = 94,
  hireCount = 17,
  changeFromPrevious = 0.8,
  observation = "Conversion improved for mid-level engineering roles",
}: InterviewToHireCardProps) {
  return (
    <Card className="flex flex-col p-2 bg-white rounded-3xl shadow-sm border-0 w-full max-w-sm">
      {/* Top: header and subtitle */}
      <div className="mb-1.5">
        <div className="flex items-center gap-1 mb-0.5">
          <Briefcase className="w-3 h-3 text-[#8B9DC3]" />
          <h3 className="font-semibold text-[12px] leading-tight text-gray-900">
            Interview-to-Hire
            <br />
            Ratio
          </h3>
        </div>
        <p className="text-[6px] text-gray-500 leading-tight">Avg. interviews required per hire</p>
      </div>

      {/* Horizontal divider */}
      <hr className="border-gray-200" />

      {/* Middle: Progress bars and metric */}
      <div className="flex-1 flex flex-col justify-center py-1.5">
        <div className="space-y-2 mb-2">
          {/* Interviews section - unchanged */}
          <div>
            <div className="text-[8px] font-medium text-gray-900 mb-0.5">Interviews</div>
            <div className="flex items-center gap-1.5">
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="bg-[#8B9DC3] h-1.5 rounded-full" style={{ width: "100%" }}></div>
              </div>
              <span className="text-[10px] font-bold text-gray-900">{interviews}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="bg-[#8B9DC3] h-1.5 rounded-full" style={{ width: "40%" }}></div>
              </div>
              <span className="text-[10px] font-bold text-gray-900">{interviewsSubtext}</span>
            </div>
          </div>

          {/* Hires section - split horizontally */}
          <div className="flex items-center gap-3">
            {/* Left side: Hires progress bars */}
            <div className="flex-1">
              <div className="text-[8px] font-medium text-gray-900 mb-0.5">Hires</div>
              <div className="flex items-center gap-1.5">
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="bg-[#8B9DC3] h-1.5 rounded-full" style={{ width: "25%" }}></div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="bg-[#8B9DC3] h-1.5 rounded-full" style={{ width: "15%" }}></div>
                </div>
              </div>
            </div>
            
            {/* Right side: Large metric */}
            <div className="text-right">
              <div className="text-xl font-bold text-gray-900">{hires}</div>
              <div className="text-[6px] text-gray-700 font-medium">
                Interviews
                <br />
                per Hire
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal divider */}
      <hr className="border-gray-200 mb-1.5" />

      {/* Bottom: details */}
      <div className="space-y-1">
        <div className="flex items-center gap-0.5 text-[8px] text-gray-600">
          <Calendar className="w-2.5 h-2.5 text-gray-400" />
          <span className="font-medium">
            {month}: {interviewCount} interviews • {hireCount} hires
          </span>
        </div>

        <div className="flex items-center gap-0.5 text-[8px] text-gray-600">
          <ArrowUpRight className="w-2.5 h-2.5 text-green-500" />
          <span className="font-medium">{changeFromPrevious} from March</span>
        </div>

        {/* Horizontal divider */}
        <hr className="border-gray-200" />

        <p className="text-[8px] text-gray-700 font-medium italic">{observation}</p>
      </div>
    </Card>
  )
}
