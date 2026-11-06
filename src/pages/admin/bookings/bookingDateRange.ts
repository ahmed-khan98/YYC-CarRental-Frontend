export type DatePreset = "today" | "week" | "month" | "custom";

export const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "custom", label: "Custom" },
];

export function formatInputDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function rangeForPreset(preset: Exclude<DatePreset, "custom">): { start: string; end: string } {
  const now = new Date();
  if (preset === "today") {
    const key = formatInputDate(now);
    return { start: key, end: key };
  }
  if (preset === "week") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start: formatInputDate(start), end: formatInputDate(end) };
  }
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: formatInputDate(start), end: formatInputDate(end) };
}

export function pickupDateKey(value: string): string {
  const raw = String(value ?? "");
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return formatInputDate(d);
}

export function orderedDateRange(start: string, end: string): { from: string; to: string } {
  if (start && end && start > end) return { from: end, to: start };
  return { from: start, to: end };
}
