import type { AdditionalService, BillEntry, Booking, Car } from "@/types/index.ts";
import { computeBookingQuote, type BookingQuote } from "@/lib/bookingQuote.ts";
import {
  calculateGrandTotal,
  calculateRentalDays,
  calculateTaxAmount,
} from "@/lib/rentalPricing.ts";
import { calculateServiceCharge } from "@/lib/serviceCharge.ts";
import { getServiceQuantity } from "@/lib/serviceQuantity.ts";

type EditFormPricing = {
  carId: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  additionalServiceIds: string[];
  serviceQuantities: Record<string, number>;
};

export type AdminEditBookingQuote = BookingQuote & {
  previousTotal: number;
  delta: number;
  extraMileageCharge: number;
};

function isTripCharge(entry: BillEntry) {
  if (entry.entryType !== "charge" || entry.status === "refund") return false;
  return entry.source === "system" || entry.systemKey === "extra_mileage";
}

/** Rental + additional services + extra mileage, excluding standalone fees like cancellation. */
export function resolveBookingTripTotal(booking: Booking) {
  const tripCharges = (booking.billEntries ?? []).filter(isTripCharge);
  if (tripCharges.length > 0) {
    const subtotal = tripCharges.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    return calculateGrandTotal(subtotal);
  }

  const days = calculateRentalDays(
    booking.pickupDate,
    booking.pickupTime ?? "10:00",
    booking.returnDate,
    booking.returnTime ?? "10:00",
  );
  const rental = (booking.bookedDailyRate ?? 0) * (days || 0);
  const services = (booking.serviceSnapshots ?? []).reduce(
    (sum, snapshot) =>
      sum +
      calculateServiceCharge(
        {
          dailyRate: snapshot.dailyRate,
          chargeType: snapshot.chargeType,
        },
        days || 0,
        snapshot.quantity ?? 1,
      ),
    0,
  );
  const extraMileageCharge = booking.extraMileageCharge ?? 0;
  const snapshotSubtotal = rental + services + extraMileageCharge;
  if (snapshotSubtotal > 0) return calculateGrandTotal(snapshotSubtotal);

  return booking.totalAmount ?? 0;
}

function servicesSelectionChanged(editForm: EditFormPricing, booking: Booking) {
  const originalIds = [...(booking.additionalServiceIds ?? [])].sort();
  const nextIds = [...editForm.additionalServiceIds].sort();
  if (originalIds.length !== nextIds.length) return true;
  if (originalIds.some((id, index) => id !== nextIds[index])) return true;

  for (const id of editForm.additionalServiceIds) {
    const previousQty = getServiceQuantity(booking.serviceQuantities, id, 1);
    const nextQty = editForm.serviceQuantities[id] ?? 1;
    if (previousQty !== nextQty) return true;
  }
  return false;
}

function buildQuoteServices(
  catalogServices: AdditionalService[],
  editForm: EditFormPricing,
  booking: Booking,
) {
  const snapshotMap = new Map(
    (booking.serviceSnapshots ?? []).map((snapshot) => [String(snapshot.serviceId), snapshot]),
  );

  return catalogServices.map((service) => {
    const snapshot = snapshotMap.get(service._id);
    if (snapshot && editForm.additionalServiceIds.includes(service._id)) {
      return {
        ...service,
        name: snapshot.name,
        dailyRate: snapshot.dailyRate,
        chargeType: snapshot.chargeType ?? service.chargeType,
      };
    }
    return service;
  });
}

export function computeAdminEditBookingQuote({
  editForm,
  booking,
  cars,
  services,
}: {
  editForm: EditFormPricing;
  booking: Booking;
  cars: Car[];
  services: AdditionalService[];
}): AdminEditBookingQuote {
  const car = cars.find((item) => item._id === editForm.carId);
  const carChanged = editForm.carId !== booking.carId;
  const servicesChanged = servicesSelectionChanged(editForm, booking);
  const useSnapshot =
    booking.bookedDailyRate != null && !carChanged && !servicesChanged;

  const dailyRate = useSnapshot ? (booking.bookedDailyRate ?? 0) : (car?.dailyRate ?? 0);
  const quoteServices = useSnapshot
    ? buildQuoteServices(services, editForm, booking)
    : services;

  const quote = computeBookingQuote({
    dailyRate,
    pickupDate: editForm.pickupDate,
    pickupTime: editForm.pickupTime || "10:00",
    returnDate: editForm.returnDate,
    returnTime: editForm.returnTime || "10:00",
    services: quoteServices,
    selectedServiceIds: editForm.additionalServiceIds,
    serviceQuantities: editForm.serviceQuantities,
  });

  const extraMileageCharge = booking.extraMileageCharge ?? 0;
  const subtotalWithMileage = quote.subtotal + extraMileageCharge;
  const taxAmount = calculateTaxAmount(subtotalWithMileage);
  const total = calculateGrandTotal(subtotalWithMileage);
  const previousTotal = resolveBookingTripTotal(booking);

  return {
    ...quote,
    subtotal: subtotalWithMileage,
    taxAmount,
    total,
    extraMileageCharge,
    previousTotal,
    delta: Math.round((total - previousTotal) * 100) / 100,
  };
}
