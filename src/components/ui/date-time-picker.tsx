
"use client";

import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DateTimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
}

export function DateTimePicker({ date, setDate }: DateTimePickerProps) {
  const [selectedTime, setSelectedTime] = React.useState<{
    hours: string;
    minutes: string;
    ampm: "AM" | "PM";
  }>({
    hours: "12",
    minutes: "00",
    ampm: "AM",
  });

  // Update time when date changes
  React.useEffect(() => {
    if (date) {
      const hours = date.getHours();
      const ampm = hours >= 12 ? "PM" : "AM";
      const twelveHour = hours % 12 || 12;
      const minutes = date.getMinutes();

      setSelectedTime({
        hours: twelveHour.toString(),
        minutes: minutes < 10 ? `0${minutes}` : minutes.toString(),
        ampm,
      });
    }
  }, [date]);

  // Update date with selected time
  const handleTimeChange = React.useCallback(() => {
    if (date) {
      const newDate = new Date(date);
      let hours = parseInt(selectedTime.hours);
      
      if (selectedTime.ampm === "PM" && hours !== 12) {
        hours += 12;
      } else if (selectedTime.ampm === "AM" && hours === 12) {
        hours = 0;
      }
      
      newDate.setHours(hours);
      newDate.setMinutes(parseInt(selectedTime.minutes));
      newDate.setSeconds(0);
      setDate(newDate);
    }
  }, [date, selectedTime, setDate]);

  // Run handleTimeChange when selectedTime changes
  React.useEffect(() => {
    if (date) {
      handleTimeChange();
    }
  }, [selectedTime, handleTimeChange, date]);

  // Generate hours options for select
  const hoursOptions = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  
  // Generate minutes options for select
  const minutesOptions = Array.from({ length: 60 }, (_, i) => {
    const minute = i.toString().padStart(2, "0");
    return minute;
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP p") : <span>Pick a date and time</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
        />
        <div className="border-t p-3 flex justify-between">
          <div className="flex space-x-2">
            <Select
              value={selectedTime.hours}
              onValueChange={(value) =>
                setSelectedTime({ ...selectedTime, hours: value })
              }
            >
              <SelectTrigger className="w-16">
                <SelectValue placeholder="Hours" />
              </SelectTrigger>
              <SelectContent>
                {hoursOptions.map((hour) => (
                  <SelectItem key={hour} value={hour}>
                    {hour}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="flex items-center">:</span>
            <Select
              value={selectedTime.minutes}
              onValueChange={(value) =>
                setSelectedTime({ ...selectedTime, minutes: value })
              }
            >
              <SelectTrigger className="w-16">
                <SelectValue placeholder="Mins" />
              </SelectTrigger>
              <SelectContent>
                {minutesOptions.map((minute) => (
                  <SelectItem key={minute} value={minute}>
                    {minute}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedTime.ampm}
              onValueChange={(value) =>
                setSelectedTime({
                  ...selectedTime,
                  ampm: value as "AM" | "PM",
                })
              }
            >
              <SelectTrigger className="w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AM">AM</SelectItem>
                <SelectItem value="PM">PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
