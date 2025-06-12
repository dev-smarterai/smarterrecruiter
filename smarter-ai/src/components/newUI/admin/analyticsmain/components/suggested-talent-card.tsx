import { Cpu } from "lucide-react"
import { Card } from "@/components/ui/card"

export interface TalentPool {
  role: string
  location: string
  matchPercentage: number
}

export interface SuggestedTalentCardProps {
  talentPools: TalentPool[]
  dataSource: string
}

export function SuggestedTalentCard({
  talentPools = [
    { role: "Senior Backend Engineers", location: "London, Remote", matchPercentage: 92 },
    { role: "Product Managers", location: "New York", matchPercentage: 86 },
    { role: "UX Designers", location: "Germany", matchPercentage: 81 },
  ],
  dataSource = "Generated based on recent job performance data",
}: SuggestedTalentCardProps) {
  return (
    <Card className="flex flex-col p-3 bg-white rounded-3xl shadow-sm border-0 w-full max-w-sm">
      {/* Top: header and subtitle */}
      <div className="mb-2">
        <div className="flex items-center gap-1 mb-1">
          <div className="w-4 h-4 rounded bg-gray-200 flex items-center justify-center">
            <Cpu className="w-2.5 h-2.5 text-gray-600" />
          </div>
          <h3 className="font-semibold text-[14px] leading-tight text-gray-900">
            AI Suggested
            <br />
            Talent Pools
          </h3>
        </div>
        <p className="text-[8px] text-gray-500 leading-tight">
          Curated matches based on
          <br />
          your hiring trends
        </p>
      </div>

      {/* Horizontal divider */}
      <hr className="border-gray-200" />

      {/* Middle: talent pool list */}
      <div className="flex-1 flex flex-col justify-center py-2">
        <div className="space-y-1">
          {talentPools.map((pool, index) => (
            <div key={index} className="flex justify-between items-start p-2 bg-white border border-gray-100 rounded-lg">
              <div className="flex-1">
                <div className="font-semibold text-[10px] text-gray-900 mb-0.5">{pool.role}</div>
                <div className="text-[10px] text-gray-500">{pool.location}</div>
              </div>
              <div className="text-right ml-2">
                <div className="text-[12px] font-bold text-gray-900">{pool.matchPercentage}%</div>
                <div className="text-[8px] text-gray-500">match</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Horizontal divider */}
      <hr className="border-gray-200 mb-2" />

      {/* Bottom: details and button */}
      <div className="space-y-2">
        <p className="text-[8px] text-gray-700 font-medium">{dataSource}</p>
        <button className="w-full bg-[#6366F3] hover:bg-[#5448E6] text-white rounded-xl py-2.5 text-[12px] font-medium transition-colors">
          Explore Talent Pools
        </button>
      </div>
    </Card>
  )
}
