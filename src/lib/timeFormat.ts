/** Business timezone — Calgary, Alberta (Mountain Time). */
export const APP_TIMEZONE = "America/Edmonton";

/** e.g. "Aug 31, 2026 at 4:40 PM" in Calgary time */
export function formatAppDateTime(value?: number | Date | string | null): string {
  if (value == null) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
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
