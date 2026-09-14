import type { AdditionalService } from "@/types/index.ts";
import {
  calculateGrandTotal,
  calculateRentalDays,
  calculateTaxAmount,
  formatMoney,
  formatRentalDays,
  isValidRentalPeriod,
} from "@/lib/rentalPricing.ts";
import {
  calculateServiceCharge,
  formatServiceChargeBreakdown,
  formatServiceRateLabel,
} from "@/lib/serviceCharge.ts";
import { isExtraDriverService } from "@/lib/extraDriver.ts";

export type BookingQuoteServiceLine = {
  id: string;
  name: string;
  breakdown: string;
  amount: number;
};

export type BookingQuote = {
  days: number;
  isValid: boolean;
  durationLabel: string;
  carRateLabel: string;
  carTotal: number;
  serviceLines: BookingQuoteServiceLine[];
  servicesTotal: number;
  subtotal: number;
  taxAmount: number;
  total: number;
};

const EMPTY_QUOTE: BookingQuote = {
  days: 0,
  isValid: false,
  durationLabel: "—",
  carRateLabel: "Select dates to calculate rent",
  carTotal: 0,
  serviceLines: [],
  servicesTotal: 0,
  subtotal: 0,
  taxAmount: 0,
  total: 0,
};

export function computeBookingQuote(input: {
  dailyRate: number;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  services: AdditionalService[];
  selectedServiceIds: readonly string[];
  serviceQuantities?: Readonly<Record<string, number>>;
}): BookingQuote {
  const {
    dailyRate,
    pickupDate,
    pickupTime,
    returnDate,
    returnTime,
    services,
    selectedServiceIds,
    serviceQuantities = {},
  } = input;

  if (!pickupDate || !returnDate) return EMPTY_QUOTE;

  const isValid = isValidRentalPeriod(pickupDate, pickupTime, returnDate, returnTime);
  const days = isValid ? calculateRentalDays(pickupDate, pickupTime, returnDate, returnTime) : 0;

  if (days <= 0) {
    return {
      ...EMPTY_QUOTE,
      isValid,
      serviceLines: buildServiceLines(services, selectedServiceIds, 0, serviceQuantities),
    };
  }

  const selectedSet = new Set(selectedServiceIds);
  const serviceLines = services
    .filter((service) => selectedSet.has(service._id))
    .map((service) => {
      const quantity = serviceQuantities[service._id] ?? 1;
      const unitLabel = isExtraDriverService(service) ? "drivers" : "items";
      return {
        id: service._id,
        name: service.name,
        breakdown: formatServiceChargeBreakdown(service, days, quantity, unitLabel),
        amount: calculateServiceCharge(service, days, quantity),
      };
    });

  const carTotal = dailyRate * days;
  const servicesTotal = serviceLines.reduce((sum, line) => sum + line.amount, 0);
  const subtotal = carTotal + servicesTotal;
  const taxAmount = calculateTaxAmount(subtotal);
  const total = calculateGrandTotal(subtotal);

  return {
    days,
    isValid,
    durationLabel: formatRentalDays(days),
    carRateLabel: `${formatMoney(dailyRate)} × ${formatRentalDays(days)}`,
    carTotal,
    serviceLines,
    servicesTotal,
    subtotal,
    taxAmount,
    total,
  };
}

function buildServiceLines(
  services: AdditionalService[],
  selectedServiceIds: readonly string[],
  days: number,
  serviceQuantities: Readonly<Record<string, number>> = {},
) {
  const selectedSet = new Set(selectedServiceIds);
  return services
    .filter((service) => selectedSet.has(service._id))
    .map((service) => {
      const quantity = serviceQuantities[service._id] ?? 1;
      const unitLabel = isExtraDriverService(service) ? "drivers" : "items";
      return {
        id: service._id,
        name: service.name,
        breakdown:
          days > 0
            ? formatServiceChargeBreakdown(service, days, quantity, unitLabel)
            : formatServiceRateLabel(service),
        amount: days > 0 ? calculateServiceCharge(service, days, quantity) : 0,
      };
    });
}

export { formatServiceRateLabel };
