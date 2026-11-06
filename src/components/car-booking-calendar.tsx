import { useMemo, useState } from "react";
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
} from "date-fns";
import type { CarBookingCalendarItem } from "@/api/bookings.api.ts";
import { Button } from "@/components/ui/button.tsx";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card.tsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import {
  CALENDAR_STATUS_COLORS,
  formatRentalPeriod,
  getWeekSegments,
} from "@/lib/carBookingCalendar.ts";

function BookingTooltipContent({ booking }: { booking: CarBookingCalendarItem }) {
  return (
    <div className="space-y-1.5 text-left max-w-xs text-primary-foreground">
      <p className="font-semibold">{booking.customerName}</p>
      {booking.customerEmail && (
        <p className="text-primary-foreground/80">{booking.customerEmail}</p>
      )}
      <p className="text-primary-foreground/90">{formatRentalPeriod(booking)}</p>
      <p className="text-primary-foreground/90">Amount: ${booking.totalAmount}</p>
      <p className="capitalize text-primary-foreground/90">Status: {booking.status.replace(/_/g, " ")}</p>
      <p className="text-[10px] text-primary-foreground/70 font-mono">#{booking._id.slice(-8).toUpperCase()}</p>
    </div>
  );
}

function CalendarWeekRow({
  weekDays,
  bookings,
  currentMonth,
  onViewBooking,
}: {
  weekDays: Date[];
  bookings: CarBookingCalendarItem[];
  currentMonth: Date;
  onViewBooking: (bookingId: string) => void;
}) {
  const segments = useMemo(() => getWeekSegments(weekDays, bookings), [weekDays, bookings]);
  const maxLane = segments.reduce((max, s) => Math.max(max, s.lane), -1);
  const barAreaHeight = Math.max(24, (maxLane + 1) * 22 + 4);

  return (
    <div className="relative grid grid-cols-7 gap-px bg-border/40">
      {weekDays.map((day) => {
        const inCurrentMonth = isSameMonth(day, currentMonth);
        const isToday = isSameDay(day, new Date());

        return (
          <div
            key={day.toISOString()}
            className={cn(
              "bg-card p-1.5 flex flex-col",
              !inCurrentMonth && "bg-muted/20 text-muted-foreground",
              isToday && "ring-1 ring-inset ring-primary/40",
            )}
            style={{ minHeight: 28 + barAreaHeight }}
          >
            <span
              className={cn(
                "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full shrink-0",
                isToday && "bg-primary text-primary-foreground",
              )}
            >
              {format(day, "d")}
            </span>
            <div className="flex-1" aria-hidden />
          </div>
        );
      })}

      <div
        className="absolute left-0 right-0 top-8 pointer-events-none"
        style={{ height: barAreaHeight }}
      >
        {segments.map((seg) => (
          <HoverCard key={`${seg.booking._id}-${seg.startCol}-${seg.lane}`} openDelay={150} closeDelay={120}>
            <HoverCardTrigger asChild>
              <button
                type="button"
                className={cn(
                  "absolute h-5 truncate px-1.5 py-0.5 text-[10px] font-medium text-white text-left cursor-pointer transition-colors pointer-events-auto",
                  CALENDAR_STATUS_COLORS[seg.booking.status] ?? "bg-muted-foreground",
                  seg.isStart && seg.isEnd && "rounded-md",
                  seg.isStart && !seg.isEnd && "rounded-l-md rounded-r-none",
                  !seg.isStart && seg.isEnd && "rounded-r-md rounded-l-none",
                  !seg.isStart && !seg.isEnd && "rounded-none",
                )}
                style={{
                  left: `calc(${(seg.startCol / 7) * 100}% + ${seg.isStart ? 4 : 0}px)`,
                  width: `calc(${((seg.endCol - seg.startCol + 1) / 7) * 100}% - ${(seg.isStart ? 4 : 0) + (seg.isEnd ? 4 : 0)}px)`,
                  top: seg.lane * 22,
                }}
                onClick={() => onViewBooking(seg.booking._id)}
              >
                {seg.isStart ? seg.booking.customerName.split(" ")[0] : "\u00A0"}
              </button>
            </HoverCardTrigger>
            <HoverCardContent
              side="top"
              className="w-auto max-w-sm border-primary bg-primary p-0 text-primary-foreground shadow-lg"
            >
              <button
                type="button"
                className="w-full cursor-pointer p-3 text-left"
                onClick={() => onViewBooking(seg.booking._id)}
              >
                <BookingTooltipContent booking={seg.booking} />
                <p className="mt-2 text-[10px] text-primary-foreground/70">Click to open booking</p>
              </button>
            </HoverCardContent>
          </HoverCard>
        ))}
      </div>
    </div>
  );
}

export function CarBookingCalendar({
  bookings,
  onViewBooking,
}: {
  bookings: CarBookingCalendarItem[];
  onViewBooking: (bookingId: string) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));

  const calendarWeeks = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
    const weeks: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  }, [currentMonth]);

  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="icon"
          className="cursor-pointer shrink-0"
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold">{format(currentMonth, "MMMM yyyy")}</h3>
        <Button
          variant="outline"
          size="icon"
          className="cursor-pointer shrink-0"
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-xl overflow-hidden border border-border/40">
        <div className="grid grid-cols-7 gap-px bg-border/40">
          {weekdayLabels.map((label) => (
            <div
              key={label}
              className="bg-muted/40 px-2 py-2 text-center text-xs font-medium text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="space-y-px bg-border/40">
          {calendarWeeks.map((weekDays) => (
            <CalendarWeekRow
              key={weekDays[0].toISOString()}
              weekDays={weekDays}
              bookings={bookings}
              currentMonth={currentMonth}
              onViewBooking={onViewBooking}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1">
        {Object.entries(CALENDAR_STATUS_COLORS).map(([status, colorClass]) => (
          <span key={status} className="inline-flex items-center gap-1.5 text-[10px] capitalize text-muted-foreground">
            <span className={cn("h-2.5 w-2.5 rounded-sm", colorClass.split(" ")[0])} />
            {status.replace(/_/g, " ")}
          </span>
        ))}
      </div>
    </div>
  );
}
