import type { Booking } from "@/types/index.ts";
import { calculateRentalDays, formatRentalDays } from "@/lib/rentalPricing.ts";
import { formatDropoffDateTime, formatPickupDateTime } from "@/lib/timeFormat.ts";

type ScheduleCellProps = {
  booking: Booking;
  locationName?: string | null;
  compact?: boolean;
};

export function BookingPickupCell({ booking, locationName, compact }: ScheduleCellProps) {
  return (
    <div className="leading-snug whitespace-normal">
      <div className={compact ? "text-[13px] font-medium" : "text-xs sm:text-sm"}>{formatPickupDateTime(booking)}</div>
      {locationName && (
        <div className={compact ? "text-[10px] text-muted-foreground mt-0.5" : "text-xs text-muted-foreground mt-0.5"}>
          {locationName}
        </div>
      )}
    </div>
  );
}

export function BookingDropoffCell({ booking, locationName, compact }: ScheduleCellProps) {
  return (
    <div className="leading-snug whitespace-normal">
      <div className={compact ? "text-[13px] font-medium" : "text-xs sm:text-sm"}>{formatDropoffDateTime(booking)}</div>
      {locationName && (
        <div className={compact ? "text-[10px] text-muted-foreground mt-0.5" : "text-xs text-muted-foreground mt-0.5"}>
          {locationName}
        </div>
      )}
    </div>
  );
}

export function BookingDurationCell({ booking }: { booking: Booking }) {
  const days = calculateRentalDays(
    booking.pickupDate,
    booking.pickupTime ?? "00:00",
    booking.returnDate,
    booking.returnTime ?? "00:00",
  );

  return (
    <span className="text-xs sm:text-sm whitespace-nowrap">
      {days > 0 ? formatRentalDays(days) : "—"}
    </span>
  );
}
