import type { QueryClient } from "@tanstack/react-query";

export type LicenseImageDraft = {
  file: File | null;
  previewUrl: string;
};

export const EMPTY_LICENSE_IMAGE: LicenseImageDraft = { file: null, previewUrl: "" };

export function revokeLicensePreview(image: LicenseImageDraft) {
  if (image.previewUrl.startsWith("blob:")) URL.revokeObjectURL(image.previewUrl);
}

export function clampPaidAmount(raw: string, maxAmount: number) {
  if (raw.trim() === "") return "";
  const amount = Number(raw);
  if (!Number.isFinite(amount)) return raw;
  if (amount < 0) return "0";
  const cap = Math.round(Number(maxAmount || 0) * 100) / 100;
  if (cap > 0 && amount > cap) return String(cap);
  return raw;
}

export function formatDefaultPaidAmount(amount: number) {
  const rounded = Math.round(Number(amount || 0) * 100) / 100;
  if (rounded <= 0) return "";
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

export function invalidateAfterInspectionChange(
  queryClient: QueryClient,
  bookingId: string,
  carId?: string,
) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["inspections", bookingId] }),
    queryClient.invalidateQueries({ queryKey: ["inspections", "check-in-out"] }),
    queryClient.invalidateQueries({ queryKey: ["bookings", bookingId, "detail"] }),
    queryClient.invalidateQueries({ queryKey: ["bookings"], exact: true }),
    queryClient.invalidateQueries({ queryKey: ["bookings", "admin"] }),
    queryClient.invalidateQueries({ queryKey: ["bookings", "admin", "overview"] }),
    carId ? queryClient.invalidateQueries({ queryKey: ["cars", carId] }) : Promise.resolve(),
  ]);
}

export async function withUploadWakeLock<T>(run: () => Promise<T>): Promise<T> {
  let lock: WakeLockSentinel | null = null;
  try {
    lock = (await navigator.wakeLock?.request("screen")) ?? null;
  } catch {
    // Older phones may not support keeping the screen awake.
  }
  try {
    return await run();
  } finally {
    await lock?.release().catch(() => {});
  }
}
