"use client";

import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { useId, useState } from "react";

interface CalendarPickerProps {
  onDateSelect: (date: Date, time: string) => void;
  onCancel: () => void;
  defaultDate?: Date;
  defaultTime?: string;
}

export function CalendarPicker({ 
  onDateSelect, 
  onCancel, 
  defaultDate = new Date(), 
  defaultTime = "12:00" 
}: CalendarPickerProps) {
  const id = useId();
  const [date, setDate] = useState<Date | undefined>(defaultDate);
  const [time, setTime] = useState(defaultTime);

  const handleConfirm = () => {
    if (date) {
      onDateSelect(date, time);
    }
  };

  // Custom styles for the calendar
  const calendarClassNames = {
    caption: "text-center",
    caption_label: "text-center mx-auto font-medium"
  };

  return (
    <div className="rounded-lg border border-border shadow-lg bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm">
      <Calendar 
        mode="single" 
        className="p-2 bg-transparent" 
        selected={date} 
        onSelect={setDate}
        classNames={calendarClassNames}
      />
      <div className="border-t border-border p-3 bg-transparent">
        <div className="flex items-center gap-3">
          <Label htmlFor={id} className="text-xs">
            Enter time
          </Label>
          <div className="relative grow">
            <Input
              id={id}
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="peer ps-9 [&::-webkit-calendar-picker-indicator]:hidden bg-white/95 dark:bg-gray-950/95"
            />
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
              <Clock size={16} strokeWidth={2} aria-hidden="true" />
            </div>
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="default" size="sm" onClick={handleConfirm}>
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
} 