import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ConversationInsight {
  id: string
  name: string
  avatar: string
  insights: string[]
}

interface ConversationInsightsProps {
  data: ConversationInsight
}

export function ConversationInsights({ data }: ConversationInsightsProps) {
  return (
    <Card className="w-full bg-gradient-to-br from-indigo-50 to-purple-50 border border-gray-100 rounded-xl shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-gray-900">Conversation Insights</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-gray-600 font-medium text-sm">{data.name.charAt(0)}</span>
          </div>
          <h3 className="text-sm font-semibold text-gray-900">{data.name}</h3>
        </div>

        <ul className="space-y-1">
          {data.insights.map((insight, index) => (
            <li key={index} className="flex items-start gap-2">
              <div className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 flex-shrink-0" />
              <span className="text-xs text-gray-700 leading-relaxed">{insight}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
