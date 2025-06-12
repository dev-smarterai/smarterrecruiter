"use client"

import type React from "react"
import { useState } from "react"
import { format, isSameDay, addDays, subDays, parse, parseISO } from "date-fns"
import { CalendarIcon, UserIcon, ClockIcon, XIcon, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

interface Event {
  id: number
  name: string
  time: string
  datetime: string
  status?: string
  interviewer?: string
  avatarUrl?: string
  duration?: number
}

interface DayData {
  day: Date
  events: Event[]
}

interface DayCalendarDemoProps {
  data: DayData[]
}

const HOURS = Array.from({ length: 15 }, (_, i) => 8 + i)

function getStatusColor(status: string | undefined) {
  if (status === "accepted") return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50"
  if (status === "rejected") return "bg-rose-50 text-rose-700 ring-1 ring-rose-200/50"
  if (status === "scheduled" || status === "pending") return "bg-purple-50 text-purple-700 ring-1 ring-purple-200/50"
  return "bg-gray-50 text-gray-700 ring-1 ring-gray-200/50"
}

function getStatusDot(status: string | undefined) {
  if (status === "accepted") return "bg-emerald-500"
  if (status === "rejected") return "bg-rose-500"
  if (status === "scheduled" || status === "pending") return "bg-purple-500"
  return "bg-gray-500"
}

function normalizeTime(time: string): string {
  if (time.match(/am|pm|AM|PM/)) {
    const d = parse(time, "h:mm a", new Date())
    return format(d, "h:mm a")
  }
  const d = parse(time, "H:mm", new Date())
  return format(d, "h:mm a")
}

function calculateDuration(startTime: string, datetime: string): number {
  const start = parse(startTime, "HH:mm", new Date())
  const end = parseISO(datetime)
  const diffInMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60))
  return Math.max(diffInMinutes, 30) // Minimum duration of 30 minutes
}

export const DayCalendarDemo: React.FC<DayCalendarDemoProps> = ({ data }) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const today = new Date()
  const [selectedDay, setSelectedDay] = useState<Date>(today)
  const dayEvents = data.find((d) => isSameDay(d.day, selectedDay))?.events || []

  const ROW_HEIGHT = 40 // Increased row height for better spacing

  function getEventPosition(event: Event) {
    const normalized = normalizeTime(event.time)
    const d = parse(normalized, "h:mm a", new Date())
    const hour = d.getHours()
    const minute = d.getMinutes()
    const duration = event.duration || calculateDuration(format(d, "HH:mm"), event.datetime)
    const startIdx = hour - 8 + (minute >= 30 ? 0.5 : minute / 60)
    return {
      top: `${startIdx * ROW_HEIGHT}px`,
      height: `${(duration / 60) * ROW_HEIGHT}px`,
    }
  }

  function EventModal() {
    if (!selectedEvent) return null
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={() => setModalOpen(false)}
      >
        <div
          className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm relative animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
            onClick={() => setModalOpen(false)}
            aria-label="Close"
          >
            <XIcon size={20} />
          </button>

          <div className="flex items-center gap-4 mb-5">
            {selectedEvent.avatarUrl ? (
              <img
                src={selectedEvent.avatarUrl || "/placeholder.svg"}
                alt="avatar"
                className="w-14 h-14 rounded-full border-2 border-white shadow-md object-cover ring-2 ring-purple-100"
              />
            ) : (
              <span className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 ring-2 ring-purple-50">
                <UserIcon size={24} />
              </span>
            )}
            <div>
              <div className="font-semibold text-lg text-gray-900 mb-1">{selectedEvent.name}</div>
              <div className="text-sm text-gray-500 flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${getStatusDot(selectedEvent.status)}`}></span>
                Interview with {selectedEvent.interviewer || "No interviewer"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4 bg-gray-50 px-4 py-3 rounded-xl">
            <ClockIcon size={18} className="text-purple-500" />
            <span className="text-sm font-medium text-gray-700">{normalizeTime(selectedEvent.time)}</span>
            {selectedEvent.duration && <span className="ml-1 text-gray-400">({selectedEvent.duration} min)</span>}
          </div>

          <div className="flex items-center gap-2 mb-5">
            <span
              className={`text-sm font-medium capitalize px-3 py-1.5 rounded-full ${getStatusColor(selectedEvent.status)}`}
            >
              {selectedEvent.status}
            </span>
          </div>

          <div className="flex gap-2">
            {selectedEvent.status === "pending" && (
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition shadow-sm shadow-purple-200">
                <CalendarIcon size={16} /> Reschedule
              </button>
            )}
            <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition">
              <MoreHorizontal size={16} /> Options
            </button>
          </div>
        </div>
      </div>
    )
  }

  function goToPrevDay() {
    setSelectedDay((prev) => subDays(prev, 1))
  }

  function goToNextDay() {
    setSelectedDay((prev) => addDays(prev, 1))
  }

  function goToToday() {
    setSelectedDay(today)
  }

  return (
    <div className="w-full overflow-hidden bg-white rounded-xl shadow-lg border border-gray-200">
      {modalOpen && <EventModal />}
      <div className="min-w-[800px]">
        {/* Calendar Header with navigation */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevDay}
              className="rounded-lg p-2 hover:bg-gray-100 transition text-gray-500 hover:text-gray-700"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={goToToday}
              className="rounded-lg px-3 py-1.5 bg-purple-100 text-purple-700 text-xs font-medium hover:bg-purple-200 transition"
            >
              Today
            </button>
            <button
              onClick={goToNextDay}
              className="rounded-lg p-2 hover:bg-gray-100 transition text-gray-500 hover:text-gray-700"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <CalendarIcon size={18} className="text-purple-500" />
            {format(selectedDay, "EEEE, MMMM d, yyyy")}
          </div>
        </div>

        {/* Header: Day */}
        <div className="grid grid-cols-[100px_1fr] border-b border-gray-100">
          <div className="h-14"></div>
          <div className="h-14 flex flex-col items-center justify-center border-l border-gray-100">
            <span className="text-xs font-semibold text-gray-400 tracking-wider mb-1">
              {format(selectedDay, "EEEE").toUpperCase()}
            </span>
            <span
              className={`text-xl font-bold ${isSameDay(selectedDay, today) ? "text-purple-600" : "text-gray-900"}`}
            >
              {format(selectedDay, "d")}
            </span>
          </div>
        </div>

        {/* Grid: Time slots */}
        <div className="relative grid grid-cols-[100px_1fr]" style={{ minHeight: `${HOURS.length * ROW_HEIGHT}px` }}>
          {/* Time labels */}
          <div className="flex flex-col border-r border-gray-100">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="h-10 border-t border-gray-100 text-xs text-gray-400 font-medium flex items-center justify-end pr-3"
              >
                {hour < 12 ? `${hour}am` : hour === 12 ? `12pm` : `${hour - 12}pm`}
              </div>
            ))}
          </div>

          {/* Day column */}
          <div className="relative border-l border-gray-100">
            {/* Time slot grid lines */}
            {HOURS.map((hour, index) => (
              <div
                key={`grid-${hour}`}
                className="absolute left-0 right-0 border-t border-gray-100"
                style={{ top: `${index * ROW_HEIGHT}px`, height: `${ROW_HEIGHT}px` }}
              />
            ))}

            {/* Current time indicator */}
            {isSameDay(selectedDay, today) && (
              <div
                className="absolute left-0 right-0 border-t-2 border-purple-500 z-10"
                style={{
                  top: `${(new Date().getHours() - 8 + new Date().getMinutes() / 60) * ROW_HEIGHT}px`,
                }}
              >
                <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-purple-500" />
              </div>
            )}

            {/* Events for this day */}
            {dayEvents.map((event) => {
              const { top, height } = getEventPosition(event)
              return (
                <div key={event.id} className="absolute left-1 right-1 z-20" style={{ top, height, minHeight: 32 }}>
                  <div
                    className={`flex flex-col gap-1 rounded-lg shadow-md border-l-4 px-3 py-2 cursor-pointer transition-all duration-200 group hover:translate-x-0.5 hover:shadow-lg ${
                      event.status === "accepted"
                        ? "border-l-emerald-500 bg-white"
                        : event.status === "rejected"
                          ? "border-l-rose-500 bg-white"
                          : "border-l-purple-500 bg-white"
                    }`}
                    onClick={() => {
                      setSelectedEvent(event)
                      setModalOpen(true)
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {event.avatarUrl ? (
                        <img
                          src={event.avatarUrl || "/placeholder.svg"}
                          alt="avatar"
                          className="w-6 h-6 rounded-full border border-white shadow-sm object-cover"
                        />
                      ) : (
                        <span className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                          <UserIcon size={12} />
                        </span>
                      )}
                      <span className="font-medium text-xs truncate flex-1 text-gray-900">{event.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <ClockIcon size={12} className="text-purple-500" />
                      <span className="text-gray-600">{normalizeTime(event.time)}</span>
                      {event.duration && <span className="text-gray-400">({event.duration}m)</span>}
                    </div>
                    {event.interviewer && (
                      <div className="text-[10px] text-gray-500 flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(event.status)}`}></span>
                        With <span className="font-medium text-gray-700">{event.interviewer}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
