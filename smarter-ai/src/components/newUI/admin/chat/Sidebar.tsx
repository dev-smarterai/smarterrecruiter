import { FAQManagement } from "./faq-management"
import { ConversationInsights } from "./conversation-insights"

const conversationData = [
  {
    id: "1",
    name: "Jordan",
    avatar: "/placeholder.svg?height=48&width=48",
    insights: [
      "Available to start from June 15",
      "Seeking a salary of $110,000",
      "6 years of experience in project management",
    ],
  },
  {
    id: "2",
    name: "Michelle",
    avatar: "/placeholder.svg?height=48&width=48",
    insights: [
      "Available to start beginning in May",
      "Looking for a salary of $95,000",
      "MBA graduate with financial analysis background",
    ],
  },
  {
    id: "3",
    name: "Aisha",
    avatar: "/placeholder.svg?height=48&width=48",
    insights: ["Available to start from May 1", "Seeking a salary of $90,000", "5 years of experience in marketing"],
  },
]

export function Sidebar() {
  return (
    <div className="w-64 lg:w-56 xl:w-64 p-2 lg:p-3 bg-gradient-to-br from-purple-100 via-indigo-100 to-violet-100 max-h-[95vh] rounded-xl flex flex-col">
      {/* FAQ Management - fixed at top */}
     
      {/* Conversation Insights - scrollable */}
      <div className="flex-1 overflow-y-auto space-y-2 lg:space-y-3 pr-1">
        {conversationData.map((person) => (
          <ConversationInsights key={person.id} data={person} />
        ))}
      </div>
    </div>
  )
}
