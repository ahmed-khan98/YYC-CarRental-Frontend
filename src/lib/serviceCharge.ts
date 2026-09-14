import type { AdditionalService, ServiceChargeType } from "@/types/index.ts";
import { formatRentalDays } from "@/lib/rentalPricing.ts";

type ServiceLike = Pick<AdditionalService, "dailyRate" | "chargeType">;

export function calculateServiceCharge(service: ServiceLike, days: number, quantity = 1): number {
  const rate = service.dailyRate ?? 0;
  const chargeType: ServiceChargeType = service.chargeType ?? "per_day";
  const qty = Math.max(1, quantity);
  if (chargeType === "per_trip") return rate * qty;
  return rate * days * qty;
}

export function formatServiceRateLabel(service: ServiceLike): string {
  const rate = service.dailyRate ?? 0;
  return service.chargeType === "per_trip" ? `$${rate}/trip` : `$${rate}/day`;
}

export function formatServiceChargeBreakdown(
  service: ServiceLike,
  days: number,
  quantity = 1,
  unitLabel = "items",
): string {
  const rate = service.dailyRate ?? 0;
  const qty = Math.max(1, quantity);
  if (service.chargeType === "per_trip") {
    return qty > 1 ? `$${rate} × ${qty} ${unitLabel}` : `$${rate} × 1 trip`;
  }
  const daysLabel = formatRentalDays(days);
  return qty > 1 ? `$${rate} × ${daysLabel} × ${qty} ${unitLabel}` : `$${rate} × ${daysLabel}`;
}
