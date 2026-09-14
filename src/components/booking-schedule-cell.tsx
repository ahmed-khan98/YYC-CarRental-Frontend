import { format } from "date-fns";
import type { Booking } from "@/types/index.ts";
import { calculateRentalDays, formatRentalDays } from "@/lib/rentalPricing.ts";
import { formatTime12h } from "@/lib/timeFormat.ts";

function formatPickupDateTime(booking: Booking) {
  const date = format(new Date(booking.pickupDate), "MMM d, yyyy");
  const time = booking.pickupTime ? ` ${formatTime12h(booking.pickupTime)}` : "";
  return `${date}${time}`;
}

function formatDropoffDateTime(booking: Booking) {
  const date = format(new Date(booking.returnDate), "MMM d, yyyy");
  const time = booking.returnTime ? ` ${formatTime12h(booking.returnTime)}` : "";
  return `${date}${time}`;
}

type ScheduleCellProps = {
  booking: Booking;
  locationName?: string | null;
};

export function BookingPickupCell({ booking, locationName }: ScheduleCellProps) {
  return (
    <div className="leading-snug whitespace-normal">
      <div className="text-xs sm:text-sm">{formatPickupDateTime(booking)}</div>
      {locationName && (
        <div className="text-xs text-muted-foreground mt-0.5">{locationName}</div>
      )}
    </div>
  );
}

export function BookingDropoffCell({ booking, locationName }: ScheduleCellProps) {
  return (
    <div className="leading-snug whitespace-normal">
      <div className="text-xs sm:text-sm">{formatDropoffDateTime(booking)}</div>
      {locationName && (
        <div className="text-xs text-muted-foreground mt-0.5">{locationName}</div>
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
