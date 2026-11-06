import type { ReactNode } from "react";
import type { Booking } from "@/types/index.ts";
import { calculateCheckoutMileageSummary } from "@/lib/extraMileage.ts";
import { calculateRentalDays } from "@/lib/rentalPricing.ts";
import { bookingVehicle } from "@/lib/displayName.ts";
import { CirclePlus, Gauge, Route } from "lucide-react";

export function MileageStatTile({
  icon,
  label,
  value,
  emphasize,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="bg-background/50 rounded-lg px-2.5 py-2 border border-border/30">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
        {icon} {label}
      </div>
      <p className={`text-sm font-semibold ${emphasize ? "text-primary" : ""}`}>{value}</p>
    </div>
  );
}

export function resolveCheckoutMileageSummary({
  checkInMileage,
  checkOutMileage,
  dailyMileageLimit,
  rentalDays,
  booking,
}: {
  checkInMileage?: number | null;
  checkOutMileage?: number | null;
  dailyMileageLimit?: number | null;
  rentalDays?: number;
  booking?: Booking | null;
}) {
  if (checkInMileage == null || checkOutMileage == null) return null;
  const limit =
    dailyMileageLimit ??
    bookingVehicle(booking)?.dailyMileageLimit ??
    booking?.bookedDailyMileageLimit ??
    null;
  const days =
    rentalDays ??
    (booking
      ? calculateRentalDays(
          booking.pickupDate,
          booking.pickupTime ?? "10:00",
          booking.returnDate,
          booking.returnTime ?? "10:00",
        )
      : undefined);
  if (days == null) return null;
  return calculateCheckoutMileageSummary({
    checkInMileage,
    checkOutMileage,
    dailyMileageLimit: limit,
    rentalDays: days,
  });
}

export function CheckoutMileageStats({
  checkInMileage,
  checkOutMileage,
  dailyMileageLimit,
  rentalDays,
  booking,
  variant = "tiles",
}: {
  checkInMileage?: number | null;
  checkOutMileage?: number | null;
  dailyMileageLimit?: number | null;
  rentalDays?: number;
  booking?: Booking | null;
  variant?: "tiles" | "inline";
}) {
  const summary = resolveCheckoutMileageSummary({
    checkInMileage,
    checkOutMileage,
    dailyMileageLimit,
    rentalDays,
    booking,
  });
  if (!summary) return null;

  const allowedValue = summary.hasDailyLimit
    ? `${summary.allowedMileageKm.toLocaleString()} km`
    : "Unlimited";
  const totalValue = `${summary.totalDrivenKm.toLocaleString()} km`;
  const extraValue = summary.hasDailyLimit
    ? `${summary.extraMileageKm.toLocaleString()} km`
    : "—";

  if (variant === "inline") {
    return (
      <>
        <div className="flex items-center gap-1">
          <Route className="h-3 w-3 shrink-0" />
          <span>
            Allowed: <span className="text-foreground">{allowedValue}</span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Gauge className="h-3 w-3 shrink-0" />
          <span>
            Total mileage: <span className="text-foreground">{totalValue}</span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <CirclePlus className="h-3 w-3 shrink-0" />
          <span>
            Extra:{" "}
            <span className={summary.extraMileageKm > 0 ? "text-primary font-semibold" : "text-foreground"}>
              {extraValue}
            </span>
          </span>
        </div>
      </>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1.5">
      <MileageStatTile icon={<Route className="h-3 w-3" />} label="Allowed" value={allowedValue} />
      <MileageStatTile icon={<Gauge className="h-3 w-3" />} label="Total mileage" value={totalValue} />
      <MileageStatTile
        icon={<CirclePlus className="h-3 w-3" />}
        label="Extra"
        value={extraValue}
        emphasize={summary.extraMileageKm > 0}
      />
    </div>
  );
}
