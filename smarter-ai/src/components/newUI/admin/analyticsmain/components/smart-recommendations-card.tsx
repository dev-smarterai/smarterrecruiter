import { Card } from "@/components/ui/card"

export interface Recommendation {
  icon: "automation" | "interview" | "time"
  title: string
  description: string
}

export interface SmartRecommendationsCardProps {
  recommendations: Recommendation[]
  workflowsAnalyzed: number
}

export function SmartRecommendationsCard({
  recommendations = [
    {
      icon: "automation",
      title: "Automation",
      description: "Automate initial screening for technical roles to reduce delay",
    },
    {
      icon: "interview",
      title: "Interview Process",
      description: "High drop-off at interview round – consider improving scheduling experience",
    },
    {
      icon: "time",
      title: "Time-to-Hire",
      description: "Implement async video interviews to speed up time-to-hire",
    },
  ],
  workflowsAnalyzed = 41,
}: SmartRecommendationsCardProps) {
  return (
    <Card className="p-1.5 bg-white rounded-3xl">
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
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
            <line x1="9" y1="9" x2="9.01" y2="9"></line>
            <line x1="15" y1="9" x2="15.01" y2="9"></line>
          </svg>
        </div>
        <h3 className="font-semibold text-[10px] text-gray-800">
          Smart
          <br />
          Recommendations
        </h3>
      </div>

      <p className="text-[8px] text-gray-500 mb-0.5">
        Suggested improvements based on
        <br />
        current hiring activity
      </p>

      <div className="space-y-0.5 mb-0.5">
        <div className="flex items-start">
          <div className="min-w-[50px] font-medium text-[8px] text-gray-700">Automation</div>
          <div className="text-[8px] text-gray-600 flex-1">{recommendations[0].description}</div>
        </div>

        <div className="flex items-start">
          <div className="min-w-[50px] font-medium text-[8px] text-gray-700">Interview Process</div>
          <div className="text-[8px] text-gray-600 flex-1">{recommendations[1].description}</div>
        </div>

        <div className="flex items-start">
          <div className="min-w-[50px] font-medium text-[8px] text-gray-700">Time-to-Hire</div>
          <div className="text-[8px] text-gray-600 flex-1">{recommendations[2].description}</div>
        </div>
      </div>

      <p className="text-[6px] text-gray-500 italic mb-0.5">Generated from analysis of {workflowsAnalyzed} workflows</p>

      <button className="w-full bg-[#6366F1] text-white rounded-full py-0.5 text-[8px]">Apply Suggestions</button>
    </Card>
  )
}
