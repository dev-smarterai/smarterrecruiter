import React, { useState } from "react";
import { format, isSameDay, addWeeks, subWeeks, startOfWeek, parse, parseISO } from "date-fns";
import { Calendar as CalendarIcon, User as UserIcon, Clock as ClockIcon, X as XIcon, ChevronLeft, ChevronRight } from "lucide-react";

// Types for the data prop
interface Event {
  id: number;
  name: string;
  time: string;
  datetime: string;
  status?: string;
  interviewer?: string;
  avatarUrl?: string;
  duration?: number;
}

interface DayData {
  day: Date;
  events: Event[];
}

interface WeekCalendarDemoProps {
  data: DayData[];
}

const HOURS = Array.from({ length: 15 }, (_, i) => 8 + i);
const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

function getStartOfWeekMonday(date: Date) {
  return startOfWeek(date, { weekStartsOn: 1 });
}

function getStatusColor(status: string | undefined) {
  if (status === "accepted") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (status === "rejected") return "bg-rose-50 text-rose-700 border-rose-100";
  if (status === "scheduled" || status === "pending") return "bg-violet-50 text-violet-700 border-violet-100";
  return "bg-gray-50 text-gray-700 border-gray-100";
}

function normalizeTime(time: string): string {
  if (time.match(/am|pm|AM|PM/)) {
    const d = parse(time, "h:mm a", new Date());
    return format(d, "h:mm a");
  }
  const d = parse(time, "H:mm", new Date());
  return format(d, "h:mm a");
}

function calculateDuration(startTime: string, datetime: string): number {
  const start = parse(startTime, "HH:mm", new Date());
  const end = parseISO(datetime);
  const diffInMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  return Math.max(diffInMinutes, 30); // Minimum duration of 30 minutes
}

export const WeekCalendarDemo: React.FC<WeekCalendarDemoProps> = ({ data }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const today = new Date();
  const [weekStart, setWeekStart] = useState<Date>(getStartOfWeekMonday(today));
  const weekDays = Array.from({ length: 7 }, (_, i) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i));
  const eventsByDay: Record<number, Event[]> = {};
  weekDays.forEach((day, idx) => {
    const found = data.find(d => isSameDay(d.day, day));
    eventsByDay[idx] = found ? found.events : [];
  });

  const ROW_HEIGHT = 36; // Slightly increased from 32px for better vertical spacing

  function getEventPosition(event: Event) {
    const normalized = normalizeTime(event.time);
    const d = parse(normalized, "h:mm a", new Date());
    let hour = d.getHours();
    let minute = d.getMinutes();
    let duration = event.duration || calculateDuration(format(d, "HH:mm"), event.datetime);
    const startIdx = hour - 8 + (minute >= 30 ? 0.5 : minute / 60);
    return {
      top: `${startIdx * ROW_HEIGHT}px`,
      height: `${(duration / 60) * ROW_HEIGHT}px`,
    };
  }

  function EventModal() {
    if (!selectedEvent) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm relative animate-fade-in">
          <button
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
            onClick={() => setModalOpen(false)}
            aria-label="Close"
          >
            <XIcon size={20} />
          </button>
          <div className="flex items-center gap-3 mb-4">
            {selectedEvent.avatarUrl ? (
              <img src={selectedEvent.avatarUrl} alt="avatar" className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover" />
            ) : (
              <span className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center text-violet-600"><UserIcon size={24} /></span>
            )}
            <div>
              <div className="font-semibold text-lg text-gray-900 mb-1">{selectedEvent.name}</div>
              <div className="text-sm text-gray-500">Interview with {selectedEvent.interviewer || "No interviewer"}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <ClockIcon size={16} className="text-violet-500" />
            <span className="text-sm font-medium text-gray-700">{normalizeTime(selectedEvent.time)}</span>
            {selectedEvent.duration && (
              <span className="ml-1 text-gray-400">({selectedEvent.duration} min)</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium capitalize px-3 py-1 rounded-full border ${getStatusColor(selectedEvent.status)}`}>
              {selectedEvent.status}
            </span>
          </div>
          {selectedEvent.status === "pending" && (
            <button className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-violet-200 bg-violet-50 text-violet-700 text-sm font-medium hover:bg-violet-100 transition">
              <CalendarIcon size={16} /> Reschedule
            </button>
          )}
        </div>
      </div>
    );
  }

  function goToPrevWeek() {
    setWeekStart(prev => subWeeks(prev, 1));
  }
  function goToNextWeek() {
    setWeekStart(prev => addWeeks(prev, 1));
  }
  function goToThisWeek() {
    setWeekStart(getStartOfWeekMonday(today));
  }

  return (
    <div className="w-full overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
      {modalOpen && <EventModal />}
      <div className="min-w-[800px]">
        {/* Calendar Header with navigation */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <button onClick={goToPrevWeek} className="rounded-lg p-1 hover:bg-gray-100 transition">
              <ChevronLeft size={16} className="text-gray-600" />
            </button>
            <button onClick={goToThisWeek} className="rounded-lg px-2 py-1 bg-violet-50 text-violet-700 text-xs font-medium hover:bg-violet-100 transition">
              This Week
            </button>
            <button onClick={goToNextWeek} className="rounded-lg p-1 hover:bg-gray-100 transition">
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </div>
          <div className="text-sm font-semibold text-gray-900">
            {format(weekDays[0], "MMM d")} - {format(weekDays[6], "MMM d, yyyy")}
          </div>
        </div>
        {/* Header: Days */}
        <div className="grid grid-cols-8 border-b border-gray-100">
          <div className="h-11"></div>
          {weekDays.map((day, idx) => (
            <div key={idx} className="h-11 flex flex-col items-center justify-center border-l border-gray-100">
              <span className="text-[10px] font-semibold text-gray-400 tracking-wider mb-0.5">{DAYS[idx]}</span>
              <span className={`text-base font-semibold ${isSameDay(day, today) ? 'text-violet-600' : 'text-gray-900'}`}>
                {format(day, "d")}
              </span>
            </div>
          ))}
        </div>
        {/* Grid: Time slots */}
        <div className="relative grid grid-cols-8" style={{ minHeight: `${HOURS.length * ROW_HEIGHT}px` }}>
          {/* Time labels */}
          <div className="flex flex-col w-26 border-r border-gray-100">
            {HOURS.map((hour) => (
              <div key={hour} className="h-9 border-t border-gray-100 text-[10px] text-gray-400 font-medium flex items-center justify-end pr-1">
                {hour < 12 ? `${hour}am` : hour === 12 ? `12pm` : `${hour - 12}pm`}
              </div>
            ))}
          </div>
          {/* Days columns */}
          {weekDays.map((day, dayIdx) => (
            <div key={dayIdx} className="relative border-l border-gray-100">
              {/* Events for this day */}
              {eventsByDay[dayIdx].map(event => {
                const { top, height } = getEventPosition(event);
                return (
                  <div
                    key={event.id}
                    className="absolute left-0.5 right-0.5"
                    style={{ top, height, minHeight: 28 }}
                  >
                    <div
                      className={`flex flex-col gap-0.5 rounded-lg shadow-sm border px-1.5 py-1 cursor-pointer transition group ${getStatusColor(event.status)} hover:scale-[1.02] hover:shadow-md`}
                      onClick={() => { setSelectedEvent(event); setModalOpen(true); }}
                    >
                      <div className="flex items-center gap-1">
                        {event.avatarUrl ? (
                          <img src={event.avatarUrl} alt="avatar" className="w-5 h-5 rounded-full border-2 border-white shadow-sm object-cover" />
                        ) : (
                          <span className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
                            <UserIcon size={12} />
                          </span>
                        )}
                        <span className="font-medium text-[11px] truncate flex-1">{event.name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px]">
                        <ClockIcon size={10} className="text-violet-500" />
                        <span className="text-gray-600">{normalizeTime(event.time)}</span>
                        {event.duration && (
                          <span className="text-gray-400">({event.duration}m)</span>
                        )}
                      </div>
                      {event.interviewer && (
                        <div className="text-[9px] text-gray-500">
                          With <span className="font-medium text-gray-700">{event.interviewer}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 