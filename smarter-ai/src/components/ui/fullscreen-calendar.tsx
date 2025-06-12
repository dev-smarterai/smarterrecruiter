"use client"

import * as React from "react"
import {
  add,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isEqual,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  startOfToday,
  startOfWeek,
  parseISO,
} from "date-fns"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusCircleIcon,
  SearchIcon,
  CalendarIcon,
  CheckIcon,
  ChevronsUpDown
} from "lucide-react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useMediaQuery } from "@/hooks/use-media-query"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/DropdownMenu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/Dialog"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/Popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Event {
  id: number
  name: string
  time: string
  datetime: string
  status?: "pending" | "accepted" | "rejected"
}

interface CalendarData {
  day: Date
  events: Event[]
}

interface FullScreenCalendarProps {
  data: CalendarData[]
}

const colStartClasses = [
  "",
  "col-start-2",
  "col-start-3",
  "col-start-4",
  "col-start-5",
  "col-start-6",
  "col-start-7",
]

export function FullScreenCalendar({ data }: FullScreenCalendarProps) {
  const today = startOfToday()
  const [selectedDay, setSelectedDay] = React.useState(today)
  const [currentMonth, setCurrentMonth] = React.useState(
    format(today, "MMM-yyyy"),
  )
  const firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date())
  const isDesktop = useMediaQuery("(min-width: 768px)")
  
  // State for the schedule interview dialog
  const [open, setOpen] = React.useState(false)
  const [selectedCandidateId, setSelectedCandidateId] = React.useState("")
  const [interviewDate, setInterviewDate] = React.useState(format(selectedDay, "yyyy-MM-dd"))
  const [interviewTime, setInterviewTime] = React.useState("09:00")
  const [isScheduling, setIsScheduling] = React.useState(false)
  
  // Fetch candidates from Convex
  const candidates = useQuery(api.candidates.getCandidates) || []
  
  // Mutation for creating a new interview request
  const createInterviewRequest = useMutation(api.interviews.createInterviewRequest)

  const days = eachDayOfInterval({
    start: startOfWeek(firstDayCurrentMonth),
    end: endOfWeek(endOfMonth(firstDayCurrentMonth)),
  })

  function previousMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: -1 })
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"))
  }

  function nextMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 })
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"))
  }

  function goToToday() {
    setCurrentMonth(format(today, "MMM-yyyy"))
  }

  // Handle form submission
  const handleScheduleInterview = async () => {
    if (!selectedCandidateId || !interviewDate || !interviewTime) {
      // Simple validation
      alert("Please fill in all fields")
      return
    }
    
    setIsScheduling(true)
    
    try {
      // Create the interview request with default position
      await createInterviewRequest({
        candidateId: selectedCandidateId as Id<"candidates">,
        position: "Interview", // Default position value
        date: interviewDate,
        time: interviewTime,
        status: "pending"
      })
      
      // Close the dialog and reset form
      setOpen(false)
      setSelectedCandidateId("")
      setInterviewDate(format(selectedDay, "yyyy-MM-dd"))
      setInterviewTime("09:00")
    } catch (error) {
      console.error("Error scheduling interview:", error)
      alert("Failed to schedule interview. Please try again.")
    } finally {
      setIsScheduling(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col space-y-2">
      {/* Calendar Header */}
      <div className="flex flex-col space-y-2 p-2 sm:p-3 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex flex-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden w-20 flex-col items-center justify-center rounded-lg border bg-muted p-1 md:flex">
              <h1 className="p-0.5 text-sm uppercase text-muted-foreground font-medium">
                {format(today, "MMM")}
              </h1>
              <div className="flex w-full items-center justify-center rounded-lg border bg-background p-0.5 text-lg font-bold">
                <span>{format(today, "d")}</span>
              </div>
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-foreground">
                {format(firstDayCurrentMonth, "MMMM, yyyy")}
              </h2>
              <p className="text-xs text-muted-foreground">
                {format(firstDayCurrentMonth, "MMM d, yyyy")} -{" "}
                {format(endOfMonth(firstDayCurrentMonth), "MMM d, yyyy")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
          <Button variant="outline" size="sm" className="hidden lg:flex h-8 w-8">
            <SearchIcon size={16} strokeWidth={2} aria-hidden="true" />
          </Button>

          <Separator orientation="vertical" className="hidden h-6 lg:block" />

          <div className="inline-flex w-full -space-x-px rounded-lg shadow-sm shadow-black/5 md:w-auto rtl:space-x-reverse">
            <Button
              onClick={previousMonth}
              className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 h-8 w-8"
              variant="outline"
              size="icon"
              aria-label="Navigate to previous month"
            >
              <ChevronLeftIcon size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
            <Button
              onClick={goToToday}
              className="w-full rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 md:w-auto h-8 px-4 text-sm font-medium"
              variant="outline"
            >
              Today
            </Button>
            <Button
              onClick={nextMonth}
              className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 h-8 w-8"
              variant="outline"
              size="icon"
              aria-label="Navigate to next month"
            >
              <ChevronRightIcon size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
          </div>

          <Separator orientation="vertical" className="hidden h-6 md:block" />

          <Button 
            className="w-full gap-2 md:w-auto h-8 px-4 text-sm bg-indigo-500 font-medium" 
            onClick={() => setOpen(true)}
            size="sm"
          >
            <CalendarIcon size={16} strokeWidth={2} aria-hidden="true" />
            <span>Schedule Interview</span>
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="lg:flex lg:flex-auto lg:flex-col border rounded-3xl overflow-hidden bg-white shadow-lg border-blue-100">
        {/* Week Days Header */}
        <div className="grid grid-cols-7 text-center text-xs font-semibold leading-6 border-b bg-muted/50">
          <div className="border-r py-2">Sun</div>
          <div className="border-r py-2">Mon</div>
          <div className="border-r py-2">Tue</div>
          <div className="border-r py-2">Wed</div>
          <div className="border-r py-2">Thu</div>
          <div className="border-r py-2">Fri</div>
          <div className="py-2">Sat</div>
        </div>

        {/* Calendar Days */}
        <div className="flex text-xs leading-6 lg:flex-auto">
          <div className="hidden w-full lg:grid lg:grid-cols-7 lg:grid-rows-5">
            {days.map((day, dayIdx) => (
              <div
                key={dayIdx}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  dayIdx === 0 && colStartClasses[getDay(day)],
                  !isEqual(day, selectedDay) &&
                    !isToday(day) &&
                    !isSameMonth(day, firstDayCurrentMonth) &&
                    "bg-blue-50 text-blue-300",
                  "relative flex flex-col border-b border-r hover:bg-blue-50 focus:z-10 min-h-[130px] transition-colors",
                  !isEqual(day, selectedDay) && "hover:bg-blue-100",
                  isSameMonth(day, firstDayCurrentMonth) ? "bg-white" : "bg-blue-50"
                )}
                data-day={format(day, "yyyy-MM-dd")}
              >
                <header className="flex items-center justify-between p-2">
                  <button
                    type="button"
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-sm transition-colors",
                      isEqual(day, selectedDay) && "text-white",
                      !isEqual(day, selectedDay) &&
                        !isToday(day) &&
                        isSameMonth(day, firstDayCurrentMonth) &&
                        "text-foreground hover:bg-muted",
                      !isEqual(day, selectedDay) &&
                        !isToday(day) &&
                        !isSameMonth(day, firstDayCurrentMonth) &&
                        "text-muted-foreground",
                      isEqual(day, selectedDay) &&
                        isToday(day) &&
                        "bg-primary text-primary-foreground",
                      isEqual(day, selectedDay) &&
                        !isToday(day) &&
                        "bg-primary text-primary-foreground",
                      isToday(day) && !isEqual(day, selectedDay) && "bg-muted border border-primary text-primary",
                      "hover:bg-primary/90 hover:text-primary-foreground"
                    )}
                  >
                    <time dateTime={format(day, "yyyy-MM-dd")}>
                      {format(day, "d")}
                    </time>
                  </button>
                </header>
                <div className="flex-1 px-1 pb-1 overflow-hidden">
                  {data
                    .filter((event) => isSameDay(event.day, day))
                    .map((day) => (
                      <div key={`event-${day.day.toString()}-${day.events[0].time}-${Math.random()}`} 
                        className="space-y-1"
                      >
                        <div className="flex flex-col gap-1">
                          {day.events.slice(0, 2).map((event, index) => (
                            <div
                              key={`event-${event.id}-${event.time}-${index}`}
                              className={cn(
                                "flex items-center gap-1 px-2 py-1 rounded-xl text-xs leading-none group shadow-sm",
                                event.status === "accepted" && "bg-blue-100 text-blue-900 border border-blue-200",
                                event.status === "rejected" && "bg-red-100 text-red-900 border border-red-200",
                                event.status === "pending" && "bg-purple-100 text-purple-900 border border-purple-200"
                              )}
                            >
                              <span className="w-1 h-1 rounded-full shrink-0 group-hover:w-1.5 group-hover:h-1.5 transition-all" 
                                style={{
                                  backgroundColor: event.status === "accepted" ? "rgb(22 163 74)" : 
                                                 event.status === "rejected" ? "rgb(220 38 38)" : 
                                                 "rgb(234 179 8)"
                                }}
                              />
                              <p className="font-medium truncate flex-1">
                                {event.name}
                              </p>
                              <p className="text-[10px] tabular-nums opacity-80">
                                {event.time}
                              </p>
                            </div>
                          ))}
                        </div>
                        {day.events.length > 2 && (
                          <div className="px-2 py-0.5">
                            <span className="text-[10px] font-medium text-muted-foreground">
                              + {day.events.length - 2} more
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Mobile View */}
          <div className="isolate grid w-full grid-cols-7 grid-rows-5 lg:hidden">
            {days.map((day, dayIdx) => (
              <button
                onClick={() => setSelectedDay(day)}
                key={dayIdx}
                type="button"
                className={cn(
                  "relative flex flex-col border-b border-r px-1 py-1 hover:bg-muted/50 focus:z-10 min-h-[80px] transition-colors",
                  !isSameMonth(day, firstDayCurrentMonth) && "bg-muted/10 text-muted-foreground",
                  isSameMonth(day, firstDayCurrentMonth) && "bg-background"
                )}
                data-day={format(day, "yyyy-MM-dd")}
              >
                <time
                  dateTime={format(day, "yyyy-MM-dd")}
                  className={cn(
                    "ml-auto flex h-6 w-6 items-center justify-center rounded-full text-xs transition-colors",
                    isEqual(day, selectedDay) && isToday(day) && "bg-primary text-primary-foreground",
                    isEqual(day, selectedDay) && !isToday(day) && "bg-primary text-primary-foreground",
                    isToday(day) && !isEqual(day, selectedDay) && "bg-muted border border-primary text-primary",
                  )}
                >
                  {format(day, "d")}
                </time>
                {data.filter((date) => isSameDay(date.day, day)).length > 0 && (
                  <div className="mt-auto">
                    {data
                      .filter((date) => isSameDay(date.day, day))
                      .map((date) => (
                        <div
                          key={`event-${date.day.toString()}-${date.events[0].time}-${Math.random()}`}
                          className="flex gap-0.5 px-1 pt-1"
                        >
                          {date.events.slice(0, 3).map((event) => (
                            <span
                              key={`event-${event.id}-${event.time}`}
                              className={cn(
                                "h-1 w-1 rounded-full",
                                event.status === "accepted" && "bg-green-500",
                                event.status === "rejected" && "bg-red-500",
                                event.status === "pending" && "bg-yellow-500"
                              )}
                            />
                          ))}
                          {date.events.length > 3 && (
                            <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Schedule Interview Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
            <DialogDescription>
              Select a candidate and set up an interview time.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="candidate">Candidate</Label>
              <select 
                id="candidate"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
              >
                <option value="">Select a candidate...</option>
                {candidates.map((candidate) => (
                  <option key={candidate._id} value={candidate._id}>
                    {candidate.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input 
                  id="date" 
                  type="date" 
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="time">Time</Label>
                <Input 
                  id="time" 
                  type="time" 
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={handleScheduleInterview}
              disabled={isScheduling}
            >
              {isScheduling ? "Scheduling..." : "Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 