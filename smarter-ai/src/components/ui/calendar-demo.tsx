"use client"

import { FullScreenCalendar } from "@/components/ui/fullscreen-calendar"

// The CalendarDemo now accepts data as a prop
interface CalendarDemoProps {
  data: any[]
}

function CalendarDemo({ data }: CalendarDemoProps) {
  return (
    <div className="w-full">
      <div className="rounded-xl shadow-sm border border-gray-200 bg-white">
        <FullScreenCalendar data={data} />
      </div>
    </div>
  )
}

export { CalendarDemo } 