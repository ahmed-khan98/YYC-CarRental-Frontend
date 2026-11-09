/** IANA zone for Calgary. After 1 Nov 2026 Alberta stays on permanent UTC-6 (ABT). */
export const APP_TIMEZONE = "America/Edmonton";

/** 1 Nov 2026 02:00 MDT — Alberta no longer falls back to MST. */
const ALBERTA_PERMANENT_ABT_FROM = Date.UTC(2026, 10, 1, 8, 0, 0);
/** Etc/GMT+6 is UTC-6 (POSIX sign is inverted). */
const ALBERTA_PERMANENT_ZONE = "Etc/GMT+6";

export function resolveAppTimeZone(value: Date | number | string = new Date()): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime()) || date.getTime() < ALBERTA_PERMANENT_ABT_FROM) {
    return APP_TIMEZONE;
  }
  return ALBERTA_PERMANENT_ZONE;
}

/** e.g. "Aug 31, 2026 at 4:40 PM" in Calgary time */
export function formatAppDateTime(value?: number | Date | string | null): string {
  if (value == null) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: resolveAppTimeZone(date),
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return `${get("month")} ${get("day")}, ${get("year")} at ${get("hour")}:${get("minute")} ${get("dayPeriod").toUpperCase()}`;
}

/** Calendar date only, in Calgary. */
export function formatAppDate(value?: number | Date | string | null): string {
  if (value == null) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: resolveAppTimeZone(date),
    month: "short",
    day: "numeric",
    year: "numeric",
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return `${get("month")} ${get("day")}, ${get("year")}`;
}

/** Clock time only, in Calgary. */
export function formatAppTime(value?: number | Date | string | null): string {
  if (value == null) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: resolveAppTimeZone(date),
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return `${get("hour")}:${get("minute")} ${get("dayPeriod").toUpperCase()}`;
}

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Pickup/drop-off calendar date as stored. No timezone conversion. */
export function asBookingYmd(value?: string | Date | null): string {
  if (value == null || value === "") return "";
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    return value.toISOString().slice(0, 10);
  }
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(String(value).trim());
  return match ? match[1] : "";
}

export function formatBookingDate(
  value?: string | Date | null,
  pattern: "full" | "short" | "long" = "full",
): string {
  const ymd = asBookingYmd(value);
  if (!ymd) return "—";
  const [year, month, day] = ymd.split("-").map(Number);
  const short = MONTHS_SHORT[month - 1] ?? "";
  const long = MONTHS_LONG[month - 1] ?? "";
  if (pattern === "short") return `${short} ${day}`;
  if (pattern === "long") return `${day} ${long} ${year}`;
  return `${short} ${day}, ${year}`;
}

/** Format HH:mm (24h) as h:mm AM/PM for display. Values stay 24h in forms/API. */
export function formatTime12h(time?: string | null): string {
  if (!time) return "—";
  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

/** e.g. "Aug 25, 2026 at 9:00 PM" */
export function formatDateAtTime(dateLabel: string, time?: string | null): string {
  if (!time) return dateLabel;
  return `${dateLabel} at ${formatTime12h(time)}`;
}

/** e.g. "Aug 25 9:00 PM" */
export function formatDateWithTime(dateLabel: string, time?: string | null): string {
  if (!time) return dateLabel;
  return `${dateLabel} ${formatTime12h(time)}`;
}

export function formatPickupDateTime(booking: { pickupDate: string; pickupTime?: string | null }) {
  const date = formatBookingDate(booking.pickupDate);
  const time = booking.pickupTime ? ` ${formatTime12h(booking.pickupTime)}` : "";
  return `${date}${time}`;
}

export function formatDropoffDateTime(booking: { returnDate: string; returnTime?: string | null }) {
  const date = formatBookingDate(booking.returnDate);
  const time = booking.returnTime ? ` ${formatTime12h(booking.returnTime)}` : "";
  return `${date}${time}`;
}
