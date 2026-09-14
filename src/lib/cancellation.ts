import { combineDateAndTime, calculateGrandTotal, formatMoney } from "@/lib/rentalPricing.ts";
import type { Booking } from "@/types/index.ts";

export const CANCELLATION_NOTICE_HOURS = 72;
const MS_PER_HOUR = 60 * 60 * 1000;

export type CancellationPolicyType = "one_day_fee" | "non_refundable" | "past_pickup";

export function getHoursUntilPickup(
  booking: Pick<Booking, "pickupDate" | "pickupTime">,
  now = new Date(),
) {
  const pickup = combineDateAndTime(booking.pickupDate, booking.pickupTime ?? "00:00");
  return (pickup.getTime() - now.getTime()) / MS_PER_HOUR;
}

export function resolveCancellationPolicy(
  booking: Pick<Booking, "pickupDate" | "pickupTime">,
  now = new Date(),
): { type: CancellationPolicyType; hoursUntilPickup: number } {
  const hoursUntilPickup = getHoursUntilPickup(booking, now);
  if (hoursUntilPickup < 0) {
    return { type: "past_pickup", hoursUntilPickup };
  }
  if (hoursUntilPickup >= CANCELLATION_NOTICE_HOURS) {
    return { type: "one_day_fee", hoursUntilPickup };
  }
  return { type: "non_refundable", hoursUntilPickup };
}

export function describeCancellationPolicy(
  policy: { type: CancellationPolicyType },
  dailyRate?: number,
) {
  if (policy.type === "one_day_fee") {
    const feeLabel =
      dailyRate != null
        ? formatMoney(calculateGrandTotal(dailyRate))
        : "1 day rental fee (incl. tax)";
    return `72+ hours before pick-up: a ${feeLabel} cancellation fee will be due. No payment is taken at booking.`;
  }
  if (policy.type === "non_refundable") {
    return "Within 72 hours of pick-up: the full booking amount will be due (non-refundable).";
  }
  return "Pick-up time has passed — cancellation is no longer available.";
}

export const CANCELLATION_POLICY_SUMMARY =
  "No payment at booking. 72+ hours before pick-up: 1 day fee due. Within 72 hours: full amount due.";
