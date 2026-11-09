import type { Booking, BookingStatus } from "@/types/index.ts";
import {
  bookingToServicesFormState,
  type BookingServicesFormState,
} from "@/lib/bookingServicesState.ts";
import { asBookingYmd } from "@/lib/timeFormat.ts";

export const ADMIN_EDIT_STATUS_OPTIONS = ["pending", "confirmed", "completed", "cancelled"] as const;
export const ADMIN_BOOKING_STATUS_OPTIONS = ["pending", "confirmed", "checked_in", "checked_out", "completed", "cancelled"] as const;
export const ADMIN_EDIT_PAYMENT_OPTIONS = ["pending", "paid", "refunded"] as const;

export const ADMIN_EDIT_TIME_OPTIONS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00",
];

export type AdminEditBookingForm = {
  carId: string;
  pickupLocationId: string;
  dropoffLocationId: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  notes: string;
  paymentStatus: "pending" | "paid" | "refunded";
  status: BookingStatus;
} & BookingServicesFormState;

export function toDateInput(value: string) {
  return asBookingYmd(value) || String(value ?? "").slice(0, 10);
}

export function bookingToEditForm(booking: Booking): AdminEditBookingForm {
  return {
    carId: booking.carId,
    pickupLocationId: booking.pickupLocationId,
    dropoffLocationId: booking.dropoffLocationId,
    pickupDate: toDateInput(booking.pickupDate),
    pickupTime: booking.pickupTime ?? "10:00",
    returnDate: toDateInput(booking.returnDate),
    returnTime: booking.returnTime ?? "10:00",
    notes: booking.notes ?? "",
    paymentStatus: booking.paymentStatus ?? "pending",
    status: booking.status,
    ...bookingToServicesFormState(booking),
  };
}
