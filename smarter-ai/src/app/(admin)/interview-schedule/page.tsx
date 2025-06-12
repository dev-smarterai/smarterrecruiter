"use client"

import { useState, useEffect, useMemo } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"
import { CalendarDemo } from "@/components/ui/calendar-demo"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/Table"
import { format, isSameDay } from "date-fns"
import { BadgeCheck, X, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Bell, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CalendarPicker } from "@/components/ui/calendar-picker"
import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table"
import { DataTablePagination } from "@/components/ui/data-table/DataTablePagination"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/Dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {WeekCalendarDemo}  from "@/components/ui/week-calendar-demo"
import {DayCalendarDemo} from "@/components/ui/day-calendar-demo"
// AI Navigation imports
import { AIPageWrapper } from "@/lib/ai-navigation"
import { AIContentBlock, AIGrid } from "@/components/ui/ai-navigation/AIContentBuilder"

// Type definitions to match our UI components
interface InterviewRequest {
  id: number;
  candidateName: string;
  position: string;
  date: Date;
  time: string;
  status: "pending" | "accepted" | "rejected"; // Updated to match the component requirements
  _originalId?: string; // Store the original Convex ID for operations
}

// Convert Convex data to our component format
const mapConvexToInterviewRequests = (requests: any[]): InterviewRequest[] => {
  return requests.map((request, index) => ({
    id: index + 1, // Use sequential numbers for the UI component
    candidateName: request.candidateName,
    position: request.position,
    date: new Date(request.date), // Convert ISO string to Date
    time: request.time,
    status: (request.status === "pending" || request.status === "accepted" || request.status === "rejected")
      ? request.status as "pending" | "accepted" | "rejected"
      : "pending", // Default to pending for any other status value
    _originalId: request._id // Store the original Convex ID
  }));
};

interface ColumnMetaType {
  className?: string;
  displayName: string;
}

// Define columns for the interview requests table
const interviewColumns: ColumnDef<InterviewRequest, any>[] = [
  {
    accessorKey: "candidateName",
    header: "Candidate",
    cell: ({ row }) => <div className="font-medium">{row.getValue("candidateName")}</div>,
    meta: { className: "w-1/5", displayName: "Candidate Name" } as ColumnMetaType
  },
  {
    accessorKey: "position",
    header: "Position",
    meta: { className: "w-1/5", displayName: "Position" } as ColumnMetaType
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => format(row.getValue("date"), "MMM d, yyyy"),
    meta: { className: "w-1/6", displayName: "Date" } as ColumnMetaType
  },
  {
    accessorKey: "time",
    header: "Time",
    meta: { className: "w-1/6", displayName: "Time" } as ColumnMetaType
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <>
          {status === "pending" ? (
            <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500">
              Pending
            </span>
          ) : status === "accepted" ? (
            <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-500">
              Accepted
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-500">
              Rejected
            </span>
          )}
        </>
      )
    },
    meta: { className: "w-1/6", displayName: "Status" } as ColumnMetaType
  }
];

// Define columns for the day modal interview requests table
const dayModalInterviewColumns: ColumnDef<InterviewRequest, any>[] = [
  {
    accessorKey: "candidateName",
    header: "Candidate",
    cell: ({ row }) => <div className="font-medium">{row.getValue("candidateName")}</div>,
    meta: { className: "w-1/4", displayName: "Candidate Name" } as ColumnMetaType
  },
  {
    accessorKey: "position",
    header: "Position",
    meta: { className: "w-1/4", displayName: "Position" } as ColumnMetaType
  },
  {
    accessorKey: "time",
    header: "Time",
    meta: { className: "w-1/4", displayName: "Time" } as ColumnMetaType
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <>
          {status === "pending" ? (
            <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500">
              Pending
            </span>
          ) : status === "accepted" ? (
            <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-500">
              Accepted
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-500">
              Rejected
            </span>
          )}
        </>
      )
    },
    meta: { className: "w-1/4", displayName: "Status" } as ColumnMetaType
  }
];

export default function InterviewSchedulePage() {
  // State to keep a mapping between UI IDs and Convex IDs
  const [idMapping, setIdMapping] = useState<Record<number, string>>({});
  const [rescheduleId, setRescheduleId] = useState<number | null>(null);
  const pageSize = 10;

  const [calendarView, setCalendarView] = useState<"day" | "week" | "month">("month");
  // State for day modal
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayInterviews, setDayInterviews] = useState<InterviewRequest[]>([]);

  // Fetch interview requests from Convex
  const convexRequests = useQuery(api.interviews.getInterviewRequests, {});

  // For accept/reject/reschedule operations
  const updateStatus = useMutation(api.interviews.updateInterviewRequestStatus);
  const rescheduleInterview = useMutation(api.interviews.rescheduleInterviewRequest);

  // Fetch calendar data from Convex
  const calendarData = useQuery(api.interviews.getCalendarData, {});

  // Convert the Convex calendar data to the format expected by CalendarDemo
  const formattedCalendarData = useMemo(() => {
    if (!calendarData) return [];

    return calendarData.map(item => ({
      day: new Date(item.day),
      events: item.events.map(event => ({
        id: event.id ? parseInt(event.id) : Math.floor(Math.random() * 100000), // Use consistent random IDs
        name: event.name,
        time: event.time,
        datetime: event.datetime,
        status: event.status
      }))
    }));
  }, [calendarData]);

  // Store the processed interview requests in state to avoid recreating on every render
  const [processedRequests, setProcessedRequests] = useState<InterviewRequest[]>([]);

  // Update processed requests only when convexRequests changes
  useEffect(() => {
    if (convexRequests) {
      // Map Convex data to our component format
      const requests = mapConvexToInterviewRequests(convexRequests);

      // Sort requests: first by status (pending first), then by date (newest first), then by time
      const sortedRequests = [...requests].sort((a, b) => {
        // First prioritize pending requests
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (a.status !== "pending" && b.status === "pending") return 1;

        // If same status, compare dates (newest first)
        const dateComparison = b.date.getTime() - a.date.getTime();
        if (dateComparison !== 0) return dateComparison;

        // If dates are the same, compare by time
        return b.time.localeCompare(a.time);
      });

      setProcessedRequests(sortedRequests);
    }
  }, [convexRequests]);

  // Update ID mapping whenever processed requests change
  useEffect(() => {
    if (processedRequests.length > 0) {
      const mapping: Record<number, string> = {};
      processedRequests.forEach(request => {
        if (request._originalId) {
          mapping[request.id] = request._originalId;
        }
      });
      setIdMapping(mapping);
    }
  }, [processedRequests]);

  // Table setup for interview requests
  const table = useReactTable({
    data: processedRequests,
    columns: interviewColumns,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: pageSize,
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Table setup for day modal interview requests
  const dayModalTable = useReactTable({
    data: dayInterviews,
    columns: dayModalInterviewColumns,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 5, // Smaller page size for the modal
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Loading state
  if (!convexRequests || !calendarData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">Interview Schedule</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block size-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" role="status">
              <span className="sr-only">Loading...</span>
            </div>
            <p className="mt-4 text-gray-600">Loading interview schedule...</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle accepting an interview request
  const handleAccept = (id: number) => {
    const convexId = idMapping[id];
    if (!convexId) {
      console.error(`No Convex ID found for UI ID: ${id}`);
      return;
    }

    updateStatus({
      id: convexId as Id<"interviewRequests">,
      status: "accepted"
    }).catch(console.error);
  }

  // Handle rejecting an interview request
  const handleReject = (id: number) => {
    const convexId = idMapping[id];
    if (!convexId) {
      console.error(`No Convex ID found for UI ID: ${id}`);
      return;
    }

    updateStatus({
      id: convexId as Id<"interviewRequests">,
      status: "rejected"
    }).catch(console.error);
  }

  // Handle rescheduling an interview request
  const handleReschedule = (id: number, newDate: Date, newTime: string) => {
    const convexId = idMapping[id];
    if (!convexId) {
      console.error(`No Convex ID found for UI ID: ${id}`);
      return;
    }

    rescheduleInterview({
      id: convexId as Id<"interviewRequests">,
      newDate: newDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
      newTime
    }).catch(console.error);
    setRescheduleId(null);
  }

  const handleRescheduleClick = (id: number) => {
    setRescheduleId(id);
  };

  const handleRescheduleCancel = () => {
    setRescheduleId(null);
  };

  // Handle day click to open modal with interviews for that day
  const handleDayClick = (date: Date) => {
    const interviewsOnDay = processedRequests.filter(request =>
      isSameDay(request.date, date)
    );

    setSelectedDate(date);
    setDayInterviews(interviewsOnDay);
    setDayModalOpen(true);
  };

  // Add custom onClick to CalendarDemo component
  const calendarClickHandler = (event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    const dayElement = target.closest('[data-day]');

    if (dayElement) {
      const dateAttr = dayElement.getAttribute('data-day');
      if (dateAttr) {
        const date = new Date(dateAttr);
        handleDayClick(date);
        event.preventDefault();
        event.stopPropagation();
      }
    }
  };


  return (
    <AIPageWrapper>
      <div className="container mx-auto px-1 py-4 sm:py-6 md:py-8 max-w-full">
        <AIContentBlock delay={0} blockType="header">
          <h1 className="mb-3 sm:mb-4 md:mb-6 text-lg sm:text-xl md:text-2xl font-bold">Interview Schedule</h1>
        </AIContentBlock>
        
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
          {/* Left: Calendar & Interview Requests (4/5) */}
          <div className="col-span-1 xl:col-span-4 flex flex-col gap-3 sm:gap-4 md:gap-6 min-w-0">
            {/* Calendar View */}
            <AIContentBlock delay={1} blockType="card">
              <div className="mb-0 rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl bg-white p-2 sm:p-3 md:p-8 border border-blue-100 min-w-0 overflow-x-auto" style={{boxShadow: '0 4px 32px 0 rgba(80, 120, 255, 0.12)'}}>
                {/* Calendar Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 sm:gap-4 mb-2 sm:mb-4">
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <input
                      type="text"
                      placeholder="Search"
                      className="w-full md:w-64 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button className="flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-3 sm:px-4 py-2 text-xs sm:text-sm shadow-md hover:bg-blue-50 transition">
                      <img src="/google.png" alt="Google" width={20} height={20} className="rounded-full" />
                      Integrate
                    </button>
                    <button className="flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-3 sm:px-4 py-2 text-xs sm:text-sm shadow-md hover:bg-blue-50 transition">
                      <img src="/outlook.png" alt="Outlook" width={20} height={20} className="rounded-full" />
                      Integrate
                    </button>
                  </div>
                </div>
                {/* Calendar Controls */}
                <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-4">
                  <button
                    className={cn("rounded-full px-3 sm:px-4 py-1 text-xs sm:text-sm font-medium border", calendarView === "day" && "bg-blue-100")}
                    onClick={() => setCalendarView("day")}
                  >Day</button>
                  <button
                    className={cn("rounded-full px-3 sm:px-4 py-1 text-xs sm:text-sm font-medium border", calendarView === "week" && "bg-blue-100")}
                    onClick={() => setCalendarView("week")}
                  >Week</button>
                  <button
                    className={cn("rounded-full px-3 sm:px-4 py-1 text-xs sm:text-sm font-medium border", calendarView === "month" && "bg-blue-100")}
                    onClick={() => setCalendarView("month")}
                  >Month</button>
                  <button className="ml-auto flex items-center gap-1 rounded-full px-3 sm:px-4 py-1 text-xs sm:text-sm font-medium border border-gray-200 bg-gray-50 hover:bg-blue-100 transition">
                    <span>Filter</span>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0013 13.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 017 17v-3.586a1 1 0 00-.293-.707L3.293 6.707A1 1 0 013 6V4z" /></svg>
                  </button>
                </div>
                {/* Calendar */}
                <div className="mb-2 overflow-x-auto min-w-0" onClick={calendarClickHandler}>
                  {calendarView === "month" && <CalendarDemo data={formattedCalendarData} />}
                  {calendarView === "week" && <WeekCalendarDemo data={formattedCalendarData} />}
                  {calendarView === "day" && <DayCalendarDemo data={formattedCalendarData} />}
                </div>
              </div>
            </AIContentBlock>
            
            {/* Interview Requests Table */}
            <AIContentBlock delay={3} blockType="table">
              <div className="min-w-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 sm:mb-4 gap-2">
                  <h2 className="text-lg sm:text-xl font-semibold">Interview Requests</h2>
                  <span className="text-xs sm:text-sm text-gray-500">
                    {processedRequests.length} {processedRequests.length === 1 ? 'request' : 'requests'}
                  </span>
                </div>

                {processedRequests.length === 0 ? (
                  <div className="text-center p-4 sm:p-6 md:p-8 border rounded-lg">
                    <p className="text-muted-foreground">No interview requests at this time</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto min-w-0">
                      <div className="relative min-w-[400px] sm:min-w-[500px] md:min-w-0 overflow-x-auto">
                        <Table>
                          <TableHead>
                            {table.getHeaderGroups().map((headerGroup) => (
                              <TableRow
                                key={headerGroup.id}
                                className="border-y border-gray-200 dark:border-gray-800"
                              >
                                {headerGroup.headers.map((header) => (
                                  <TableHeaderCell
                                    key={header.id}
                                    className={cn(
                                      "whitespace-nowrap py-1 text-sm sm:text-xs",
                                      header.column.columnDef.meta?.className,
                                    )}
                                  >
                                    {flexRender(
                                      header.column.columnDef.header,
                                      header.getContext(),
                                    )}
                                  </TableHeaderCell>
                                ))}
                                <TableHeaderCell className="w-1/4">Actions</TableHeaderCell>
                              </TableRow>
                            ))}
                          </TableHead>
                          <TableBody>
                            {table.getRowModel().rows?.length ? (
                              table.getRowModel().rows.map((row) => (
                                <TableRow
                                  key={row.id}
                                  className={cn(
                                    "hover:bg-gray-50 hover:dark:bg-gray-900 group select-none",
                                    row.original.status === "accepted" && "bg-green-50/50 dark:bg-green-900/10",
                                    row.original.status === "rejected" && "bg-red-50/50 dark:bg-red-900/10"
                                  )}
                                >
                                  {row.getVisibleCells().map((cell) => (
                                    <TableCell
                                      key={cell.id}
                                      className={cn(
                                        "relative whitespace-nowrap py-1 text-gray-600 dark:text-gray-400",
                                        cell.column.columnDef.meta?.className,
                                      )}
                                    >
                                      {flexRender(
                                        cell.column.columnDef.cell,
                                        cell.getContext()
                                      )}
                                    </TableCell>
                                  ))}
                                  <TableCell className="relative whitespace-nowrap py-1 text-gray-600 dark:text-gray-400">
                                    {row.original.status === "pending" && (
                                      <div className="flex gap-2 flex-nowrap">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-7 px-2 border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
                                          onClick={() => handleAccept(row.original.id)}
                                        >
                                          <BadgeCheck className="mr-1 h-3 w-3" />
                                          <span className="text-xs">Accept</span>
                                        </Button>
                                        <Popover open={rescheduleId === row.original.id} onOpenChange={(open) => {
                                          if (!open) handleRescheduleCancel();
                                          else handleRescheduleClick(row.original.id);
                                        }}>
                                          <PopoverTrigger asChild>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="h-7 px-2 border-amber-500 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                                            >
                                              <CalendarIcon className="mr-1 h-3 w-3" />
                                              <span className="text-xs">Reschedule</span>
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="p-0 w-auto" align="start">
                                            <CalendarPicker
                                              defaultDate={row.original.date}
                                              defaultTime={row.original.time}
                                              onDateSelect={(date, time) => handleReschedule(row.original.id, date, time)}
                                              onCancel={handleRescheduleCancel}
                                            />
                                          </PopoverContent>
                                        </Popover>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-7 px-2 border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
                                          onClick={() => handleReject(row.original.id)}
                                        >
                                          <X className="mr-1 h-3 w-3" />
                                          <span className="text-xs">Reject</span>
                                        </Button>
                                      </div>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell
                                  colSpan={interviewColumns.length + 1}
                                  className="h-24 text-center"
                                >
                                  No interview requests found.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    <div className="w-full flex justify-center">
                      <DataTablePagination table={table} pageSize={pageSize} />
                    </div>
                  </div>
                )}
              </div>
            </AIContentBlock>
          </div>
          
          {/* Right: Sidebar (1/5) */}
          <div className="col-span-1 flex flex-col gap-3 w-full">
            {/* Filter by View */}
            <AIContentBlock delay={2} blockType="card">
              <div className="rounded-xl shadow-lg bg-white p-3 border border-gray-100 w-full max-w-full" style={{boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)'}}>
                <h3 className="font-bold mb-2 text-sm text-gray-800 flex items-center gap-2">
                  <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0013 13.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 017 17v-3.586a1 1 0 00-.293-.707L3.293 6.707A1 1 0 013 6V4z" /></svg>
                  Filter by View
                </h3>
                <div className="flex flex-col gap-1.5">
                  <button className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium bg-violet-100 text-violet-700 w-full hover:bg-violet-200 transition-colors border border-violet-200">
                    <span className="w-4 h-4 flex items-center justify-center rounded-md bg-violet-500 text-white shadow-sm"><Check size={12} /></span>
                    <span className="flex-1 text-left">Executive View</span>
                  </button>
                  <button className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium bg-gray-50 text-gray-600 w-full hover:bg-blue-100 hover:text-blue-700 transition-colors border border-gray-200">
                    <span className="w-4 h-4 flex items-center justify-center rounded-md bg-blue-100"></span>
                    <span className="flex-1 text-left">Recruiter Headview</span>
                  </button>
                  <button className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium bg-gray-50 text-gray-600 w-full hover:bg-green-100 hover:text-green-700 transition-colors border border-gray-200">
                    <span className="w-4 h-4 flex items-center justify-center rounded-md bg-green-100"></span>
                    <span className="flex-1 text-left">Recruitment Officer View</span>
                  </button>
                  <button className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium bg-gray-50 text-gray-500 w-full hover:bg-gray-100 transition-colors border border-gray-200">
                    <span className="w-4 h-4 flex items-center justify-center rounded-md bg-gray-200"></span>
                    <span className="flex-1 text-left">Clear Filter</span>
                  </button>
                </div>
              </div>
            </AIContentBlock>
            
            {/* Automated Reminders */}
            <AIContentBlock delay={4} blockType="card">
              <div className="rounded-xl shadow-lg bg-white p-3 border border-gray-100 flex flex-col gap-2 w-full max-w-full" style={{boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)'}}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-blue-100">
                    <Bell className="text-blue-600" size={14} />
                  </div>
                  <h3 className="font-bold text-sm text-gray-800">Automated Reminders</h3>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-2 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-lg px-2.5 py-2 border border-blue-200/50 w-full shadow-sm">
                    <span className="inline-block h-2 w-2 mt-1 rounded-full bg-blue-500 shadow-sm"></span>
                    <div className="flex-1">
                      <div className="font-semibold text-xs text-blue-900">Interview Rescheduled</div>
                      <div className="text-[10px] text-blue-700/70 leading-tight mt-0.5">Wednesday, June 18<br/>3:00 PM – 3:30 PM</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-gradient-to-r from-green-50 to-green-100/50 rounded-lg px-2.5 py-2 border border-green-200/50 w-full shadow-sm">
                    <span className="inline-block h-2 w-2 mt-1 rounded-full bg-green-500 shadow-sm"></span>
                    <div className="flex-1">
                      <div className="font-semibold text-xs text-green-900">Interview Scheduled</div>
                      <div className="text-[10px] text-green-700/70 leading-tight mt-0.5">Monday, June 30<br/>3:00 PM – 3:30 PM</div>
                    </div>
                  </div>
                </div>
              </div>
            </AIContentBlock>
            
            {/* Adam's Suggestions */}
            <AIContentBlock delay={5} blockType="card">
              <div className="rounded-xl shadow-lg bg-white p-3 border border-gray-100 flex flex-col gap-2 w-full max-w-full" style={{boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)'}}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100">
                    <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-800">Adam's Suggestions</h3>
                    <div className="text-[10px] text-gray-500">Smart picks based on availability</div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg px-2.5 py-2 border border-blue-200/50 w-full shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-1.5 rounded-lg bg-blue-100">
                      <CalendarIcon className="h-3 w-3 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-blue-900 text-xs">Monday, June 24</div>
                      <div className="text-[10px] text-blue-700/70 leading-tight mt-0.5">3:00 PM – 3:30 PM</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg px-2.5 py-2 border border-blue-200/50 w-full shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-1.5 rounded-lg bg-blue-100">
                      <CalendarIcon className="h-3 w-3 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-blue-900 text-xs">Tuesday, June 26</div>
                      <div className="text-[10px] text-blue-700/70 leading-tight mt-0.5">10:00 AM – 10:30 AM</div>
                    </div>
                  </div>
                </div>
                <button className="mt-2 w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 px-3 font-semibold shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-[1.02] text-xs">
                  Confirm & Reschedule
                </button>
              </div>
            </AIContentBlock>
          </div>
        </div>
        {/* Day Modal */}
        <Dialog open={dayModalOpen} onOpenChange={setDayModalOpen}>
          <DialogContent className="sm:max-w-[600px] p-0">
            <DialogHeader className="p-3 sm:p-4 pb-0">
              <DialogTitle className="text-lg sm:text-xl">
                Interviews for {selectedDate ? format(selectedDate, "MMMM d, yyyy") : ""}
              </DialogTitle>
              <DialogDescription>
                {dayInterviews.length} {dayInterviews.length === 1 ? 'interview' : 'interviews'} scheduled for this day
              </DialogDescription>
            </DialogHeader>

            <div className="p-3 sm:p-4">
              {dayInterviews.length === 0 ? (
                <div className="text-center p-4 sm:p-6 md:p-8 border rounded-lg">
                  <p className="text-muted-foreground">No interviews scheduled for this day</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto min-w-0">
                    <div className="relative min-w-[300px] sm:min-w-[400px] md:min-w-0 overflow-x-auto">
                      <Table>
                        <TableHead>
                          {dayModalTable.getHeaderGroups().map((headerGroup) => (
                            <TableRow
                              key={headerGroup.id}
                              className="border-y border-gray-200 dark:border-gray-800"
                            >
                              {headerGroup.headers.map((header) => (
                                <TableHeaderCell
                                  key={header.id}
                                  className={cn(
                                    "whitespace-nowrap py-1 text-sm sm:text-xs",
                                    header.column.columnDef.meta?.className,
                                  )}
                                >
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext(),
                                  )}
                                </TableHeaderCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableHead>
                        <TableBody>
                          {dayModalTable.getRowModel().rows?.length ? (
                            dayModalTable.getRowModel().rows.map((row) => (
                              <TableRow
                                key={row.id}
                                className={cn(
                                  "hover:bg-gray-50 hover:dark:bg-gray-900 group select-none",
                                  row.original.status === "accepted" && "bg-green-50/50 dark:bg-green-900/10",
                                  row.original.status === "rejected" && "bg-red-50/50 dark:bg-red-900/10"
                                )}
                              >
                                {row.getVisibleCells().map((cell) => (
                                  <TableCell
                                    key={cell.id}
                                    className={cn(
                                      "relative whitespace-nowrap py-2 text-gray-600 dark:text-gray-400",
                                      cell.column.columnDef.meta?.className,
                                    )}
                                  >
                                    {flexRender(
                                      cell.column.columnDef.cell,
                                      cell.getContext()
                                    )}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={dayModalInterviewColumns.length}
                                className="h-24 text-center"
                              >
                                No interviews found.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  {dayInterviews.length > 5 && (
                    <div className="pt-2">
                      <DataTablePagination table={dayModalTable} pageSize={5} />
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="p-3 sm:p-4 pt-2">
              <Button variant="outline" onClick={() => setDayModalOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AIPageWrapper>
  )
}