import { isValidRentalPeriod } from "@/lib/rentalPricing.ts";

export type BookingFormValidationInput = {
  pickupLocationId: string;
  dropoffLocationId: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  hasExtraDriver: boolean;
  extraDriverNames: string[];
};

export function validateBookingForm(input: BookingFormValidationInput): string | null {
  if (!input.pickupLocationId) return "Please select a pickup location";
  if (!input.dropoffLocationId) return "Please select a drop-off location";
  if (!input.pickupDate || !input.returnDate) return "Please select dates";
  if (!isValidRentalPeriod(input.pickupDate, input.pickupTime, input.returnDate, input.returnTime)) {
    return "Drop-off must be after pickup date and time";
  }
  if (input.hasExtraDriver) {
    const missingName = input.extraDriverNames.findIndex((name) => !name.trim());
    if (missingName !== -1) {
      return `Please enter the full name for additional driver ${missingName + 1}`;
    }
  }
  return null;
}
