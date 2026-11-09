import { addDaysYmd, todayYmd } from "@/lib/bookingWindow.ts";
import { asBookingYmd } from "@/lib/timeFormat.ts";

export type DatePreset = "today" | "week" | "month" | "custom";

export const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "custom", label: "Custom" },
];

export function rangeForPreset(preset: Exclude<DatePreset, "custom">): { start: string; end: string } {
  const today = todayYmd();
  if (preset === "today") {
    return { start: today, end: today };
  }
  if (preset === "week") {
    const [year, month, day] = today.split("-").map(Number);
    const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    const start = addDaysYmd(today, -dow);
    return { start, end: addDaysYmd(start, 6) };
  }
  const [year, month] = today.split("-").map(Number);
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

export function pickupDateKey(value: string): string {
  return asBookingYmd(value);
}

export function orderedDateRange(start: string, end: string): { from: string; to: string } {
  if (start && end && start > end) return { from: end, to: start };
  return { from: start, to: end };
}
