import { useMemo } from "react";
import type { AdditionalService } from "@/types/index.ts";
import { computeBookingQuote, type BookingQuote } from "@/lib/bookingQuote.ts";

type UseBookingQuoteParams = {
  dailyRate: number;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  services: AdditionalService[];
  selectedServiceIds: readonly string[];
  serviceQuantities?: Readonly<Record<string, number>>;
};

export function useBookingQuote(params: UseBookingQuoteParams): BookingQuote {
  const {
    dailyRate,
    pickupDate,
    pickupTime,
    returnDate,
    returnTime,
    services,
    selectedServiceIds,
    serviceQuantities,
  } = params;

  const selectedKey = selectedServiceIds.join("|");
  const quantitiesKey = JSON.stringify(serviceQuantities ?? {});

  return useMemo(
    () =>
      computeBookingQuote({
        dailyRate,
        pickupDate,
        pickupTime,
        returnDate,
        returnTime,
        services,
        selectedServiceIds,
        serviceQuantities,
      }),
    [
      dailyRate,
      pickupDate,
      pickupTime,
      returnDate,
      returnTime,
      services,
      selectedKey,
      quantitiesKey,
    ],
  );
}
