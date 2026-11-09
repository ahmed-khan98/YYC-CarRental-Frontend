import type { Booking, VehicleInspection } from "@/types/index.ts";
import { asBookingYmd, formatBookingDate } from "@/lib/timeFormat.ts";
import { todayYmd } from "@/lib/bookingWindow.ts";

export type DateGroupItem =
  | { kind: "booking"; booking: Booking; sortTime: number }
  | { kind: "check_in"; inspection: VehicleInspection; booking: Booking; sortTime: number }
  | { kind: "check_out"; inspection: VehicleInspection; booking: Booking; sortTime: number };

export type DateGroup = {
  dateKey: string;
  label: string;
  items: DateGroupItem[];
};

export function buildBookingDateGroups(
  bookings: Booking[],
  inspections: VehicleInspection[],
): DateGroup[] {
  const groupsMap = new Map<string, DateGroupItem[]>();
  const bookingMap = new Map(bookings.map((b) => [b._id, b]));
  const bookingIds = new Set(bookings.map((b) => b._id));

  const addItem = (dateKey: string, item: DateGroupItem) => {
    const list = groupsMap.get(dateKey) ?? [];
    list.push(item);
    groupsMap.set(dateKey, list);
  };

  for (const booking of bookings) {
    const dateKey = asBookingYmd(booking.pickupDate);
    if (!dateKey) continue;
    addItem(dateKey, {
      kind: "booking",
      booking,
      sortTime: new Date(`${dateKey}T00:00:00`).getTime(),
    });
  }

  for (const inspection of inspections) {
    if (!bookingIds.has(inspection.bookingId)) continue;
    const booking = bookingMap.get(inspection.bookingId);
    if (!booking) continue;

    const dateKey = todayYmd(new Date(inspection._creationTime));
    addItem(dateKey, {
      kind: inspection.type,
      inspection,
      booking,
      sortTime: inspection._creationTime,
    });
  }

  return Array.from(groupsMap.entries())
    .map(([dateKey, items]) => ({
      dateKey,
      label: formatBookingDate(dateKey, "long"),
      items: [...items].sort((a, b) => a.sortTime - b.sortTime),
    }))
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey));
}

export function dateGroupItemKey(item: DateGroupItem): string {
  if (item.kind === "booking") {
    return `booking-${item.booking._id}-${item.sortTime}`;
  }
  return `inspection-${item.inspection._id}`;
}
