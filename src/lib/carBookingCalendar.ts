import {
  isSameDay,
  isWithinInterval,
  startOfDay,
} from "date-fns";
import type { CarBookingCalendarItem } from "@/api/bookings.api.ts";
import { asBookingYmd, formatBookingDate, formatDateWithTime } from "@/lib/timeFormat.ts";

function bookingDay(value: string) {
  const ymd = asBookingYmd(value);
  const [year, month, day] = (ymd || "1970-01-01").split("-").map(Number);
  return startOfDay(new Date(year, month - 1, day));
}

export const CALENDAR_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/80 hover:bg-yellow-500",
  confirmed: "bg-primary/80 hover:bg-primary",
  checked_in: "bg-blue-500/80 hover:bg-blue-500",
  checked_out: "bg-purple-500/80 hover:bg-purple-500",
  completed: "bg-green-600/80 hover:bg-green-600",
  cancelled: "bg-red-500/60 hover:bg-red-500 line-through opacity-70",
};

export type CalendarBarSegment = {
  booking: CarBookingCalendarItem;
  startCol: number;
  endCol: number;
  isStart: boolean;
  isEnd: boolean;
  lane: number;
};

export function formatRentalPeriod(booking: CarBookingCalendarItem) {
  return `${formatDateWithTime(formatBookingDate(booking.pickupDate), booking.pickupTime)} → ${formatDateWithTime(formatBookingDate(booking.returnDate), booking.returnTime)}`;
}

export function getWeekSegments(weekDays: Date[], bookings: CarBookingCalendarItem[]): CalendarBarSegment[] {
  const raw: Omit<CalendarBarSegment, "lane">[] = [];

  for (const booking of bookings) {
    const pickup = bookingDay(booking.pickupDate);
    const returnDay = bookingDay(booking.returnDate);

    let startCol = -1;
    let endCol = -1;

    weekDays.forEach((day, idx) => {
      const d = startOfDay(day);
      if (isWithinInterval(d, { start: pickup, end: returnDay })) {
        if (startCol === -1) startCol = idx;
        endCol = idx;
      }
    });

    if (startCol !== -1) {
      raw.push({
        booking,
        startCol,
        endCol,
        isStart: isSameDay(weekDays[startCol], pickup),
        isEnd: isSameDay(weekDays[endCol], returnDay),
      });
    }
  }

  const sorted = [...raw].sort((a, b) => a.startCol - b.startCol || a.endCol - b.endCol);
  const laneEnds: number[] = [];
  const segments: CalendarBarSegment[] = [];

  for (const seg of sorted) {
    let lane = laneEnds.findIndex((endCol) => endCol < seg.startCol);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(seg.endCol);
    } else {
      laneEnds[lane] = seg.endCol;
    }
    segments.push({ ...seg, lane });
  }

  return segments;
}
