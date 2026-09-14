import {
  format,
  parseISO,
  startOfDay,
} from "date-fns";
import type { Booking, VehicleInspection } from "@/types/index.ts";

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
    const dateKey = format(startOfDay(parseISO(booking.pickupDate)), "yyyy-MM-dd");
    addItem(dateKey, {
      kind: "booking",
      booking,
      sortTime: parseISO(booking.pickupDate).getTime(),
    });
  }

  for (const inspection of inspections) {
    if (!bookingIds.has(inspection.bookingId)) continue;
    const booking = bookingMap.get(inspection.bookingId);
    if (!booking) continue;

    const dateKey = format(new Date(inspection._creationTime), "yyyy-MM-dd");
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
      label: format(parseISO(dateKey), "d MMMM yyyy"),
      items: [...items].sort((a, b) => a.sortTime - b.sortTime),
    }))
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey));
}
