import { calendarDateKey } from "@/lib/licenseExpiry.ts";

export const MIN_DRIVER_AGE = 18;
export const DRIVER_AGE_ERROR = "Driver must be at least 18 years old";

function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function asOfDateKey(asOf?: string | Date | null): string {
  if (asOf instanceof Date || typeof asOf === "string") {
    return calendarDateKey(asOf) || localDateKey();
  }
  return localDateKey();
}

export function maxDriverDateOfBirth(asOf?: string | Date | null): string {
  const [year, month, day] = asOfDateKey(asOf).split("-").map(Number);
  return localDateKey(new Date(year - MIN_DRIVER_AGE, month - 1, day));
}

export function isDriverAtLeast18(
  dateOfBirth: string | Date | null | undefined,
  asOf?: string | Date | null,
): boolean {
  const dob = calendarDateKey(dateOfBirth);
  if (!dob) return false;
  return dob <= maxDriverDateOfBirth(asOf);
}
