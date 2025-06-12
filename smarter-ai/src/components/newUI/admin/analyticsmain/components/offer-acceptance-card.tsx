import { ArrowUpRight } from "lucide-react"
import { Card } from "@/components/ui/card"

export interface OfferAcceptanceCardProps {
  percentage: number
  industryAverage: number
  percentageChange: number
}

export function OfferAcceptanceCard({
  percentage = 89,
  industryAverage = 75,
  percentageChange = 14,
}: OfferAcceptanceCardProps) {
  return (
    <Card className="flex flex-col p-2.5 bg-white rounded-3xl shadow-sm border-0">
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-[14px] leading-tight text-gray-900">Offer Acceptance Rate</h3>
          <ArrowUpRight className="w-3 h-3 text-[#6366F1]" />
        </div>
        <p className="text-[8px] text-gray-500 mb-1">Compared to industry</p>
        <hr className="border-gray-200 mb-1" />
        <div className="flex flex-col justify-center items-center mb-1 flex-1">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 mb-0.5">{percentage}%</div>
            <div className="flex items-center justify-center gap-1 text-[8px] text-green-600 font-medium">
              <ArrowUpRight className="w-2 h-2" />
              <span>+{percentageChange}% vs avg.</span>
            </div>
          </div>
        </div>
        <hr className="border-gray-200 mb-1" />
        <p className="text-[8px] text-gray-700 mb-1 font-medium">
          Your offer acceptance rate is<br />
          <span className="font-semibold text-gray-900">{percentage}%</span> compared to an industry<br />
          average of <span className="font-semibold text-gray-900">{industryAverage}%</span>
        </p>
      </div>
      <div>
        <input
          type="text"
          placeholder="Type your message..."
          className="w-full max-h-[4px] rounded-md pl-1.5 pr-4 border border-gray-200 text-[8px] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 transition-colors"
        />
      </div>
    </Card>
  )
}
