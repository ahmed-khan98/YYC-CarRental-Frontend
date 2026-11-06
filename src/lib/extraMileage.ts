import type { BillEntry } from "@/types/index.ts";

export type ExtraMileageBilling = {
  totalDrivenKm: number;
  allowedMileageKm: number;
  extraMileageKm: number;
  extraMileageCharge: number;
};

/** Same formula checkout uses: Math.round(dailyMileageLimit × rentalDays). */
export function calculateAllowedMileageKm(
  dailyMileageLimit?: number | null,
  rentalDays = 0,
): number {
  const limitPerDay = Number(dailyMileageLimit) || 0;
  return limitPerDay > 0 ? Math.round(limitPerDay * rentalDays) : 0;
}

export function formatAllowedMileageLabel(
  dailyMileageLimit?: number | null,
  rentalDays = 0,
): string | null {
  const limitPerDay = Number(dailyMileageLimit) || 0;
  if (limitPerDay <= 0) return null;
  const allowedMileageKm = calculateAllowedMileageKm(limitPerDay, rentalDays);
  return `${allowedMileageKm.toLocaleString()} km (${limitPerDay} km/day × ${rentalDays} days)`;
}

/** Driven / allowed / extra KM using the checkout allowance formula (no billing rate). */
export function calculateCheckoutMileageSummary({
  checkInMileage,
  checkOutMileage,
  dailyMileageLimit,
  rentalDays,
}: {
  checkInMileage: number;
  checkOutMileage: number;
  dailyMileageLimit?: number | null;
  rentalDays: number;
}): {
  totalDrivenKm: number;
  allowedMileageKm: number;
  extraMileageKm: number;
  hasDailyLimit: boolean;
} {
  const totalDrivenKm = Math.max(0, checkOutMileage - checkInMileage);
  const limitPerDay = Number(dailyMileageLimit) || 0;
  const allowedMileageKm = calculateAllowedMileageKm(limitPerDay, rentalDays);
  const hasDailyLimit = limitPerDay > 0 && rentalDays > 0;
  const extraMileageKm = hasDailyLimit
    ? Math.max(0, Math.round(totalDrivenKm - allowedMileageKm))
    : 0;

  return { totalDrivenKm, allowedMileageKm, extraMileageKm, hasDailyLimit };
}

export function calculateExtraMileageBilling({
  checkInMileage,
  checkOutMileage,
  dailyMileageLimit,
  chargePerExtraKm,
  rentalDays,
}: {
  checkInMileage: number;
  checkOutMileage: number;
  dailyMileageLimit?: number | null;
  chargePerExtraKm?: number | null;
  rentalDays: number;
}): ExtraMileageBilling {
  const { totalDrivenKm, allowedMileageKm, extraMileageKm: overageKm } =
    calculateCheckoutMileageSummary({
      checkInMileage,
      checkOutMileage,
      dailyMileageLimit,
      rentalDays,
    });
  const limitPerDay = Number(dailyMileageLimit) || 0;
  const rate = Number(chargePerExtraKm) || 0;

  if (limitPerDay <= 0 || rate <= 0 || rentalDays <= 0) {
    return {
      totalDrivenKm,
      allowedMileageKm,
      extraMileageKm: 0,
      extraMileageCharge: 0,
    };
  }

  const extraMileageKm = overageKm;
  const extraMileageCharge = Math.round(extraMileageKm * rate * 100) / 100;

  return {
    totalDrivenKm: Math.round(totalDrivenKm),
    allowedMileageKm,
    extraMileageKm,
    extraMileageCharge,
  };
}

export function isExtraMileageCharge(entry: Pick<BillEntry, "entryType" | "systemKey" | "title">) {
  return (
    entry.entryType === "charge" &&
    (entry.systemKey === "extra_mileage" || /extra\s*mileage|excess\s*km/i.test(entry.title ?? ""))
  );
}

export function formatUnitRate(amount: number) {
  if (Number.isInteger(amount)) return String(amount);
  return amount.toFixed(2).replace(/\.?0+$/, "");
}

export function extraMileageLabel(km: number, chargePerKm: number) {
  return `Extra Mileage (${km} × $${formatUnitRate(chargePerKm)})`;
}
