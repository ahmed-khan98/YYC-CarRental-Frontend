import type { AdditionalService, Booking } from "@/types/index.ts";
import { isExtraDriverService } from "@/lib/extraDriver.ts";
import { getServiceQuantity, serviceAllowsQuantity } from "@/lib/serviceQuantity.ts";

export type BookingServicesFormState = {
  additionalServiceIds: string[];
  serviceQuantities: Record<string, number>;
  extraDriverNames: string[];
};

function resizeNameList(current: string[], nextCount: number) {
  if (current.length === nextCount) return current;
  if (current.length < nextCount) {
    return [...current, ...Array.from({ length: nextCount - current.length }, () => "")];
  }
  return current.slice(0, nextCount);
}

export function emptyServicesFormState(): BookingServicesFormState {
  return {
    additionalServiceIds: [],
    serviceQuantities: {},
    extraDriverNames: [""],
  };
}

export function bookingToServicesFormState(booking: Booking): BookingServicesFormState {
  const additionalServiceIds = booking.additionalServiceIds ?? [];
  const serviceQuantities: Record<string, number> = {};
  for (const id of additionalServiceIds) {
    serviceQuantities[id] = getServiceQuantity(booking.serviceQuantities, id, 1);
  }
  const extraDriverNames = booking.extraDriverNames?.length
    ? [...booking.extraDriverNames]
    : [""];
  return { additionalServiceIds, serviceQuantities, extraDriverNames };
}

export function toggleBookingService(
  state: BookingServicesFormState,
  serviceId: string,
  services: AdditionalService[],
): BookingServicesFormState {
  const service = services.find((item) => item._id === serviceId);
  const extraDriverService = services.find(isExtraDriverService);
  const removing = state.additionalServiceIds.includes(serviceId);

  if (removing) {
    const serviceQuantities = { ...state.serviceQuantities };
    delete serviceQuantities[serviceId];
    return {
      additionalServiceIds: state.additionalServiceIds.filter((id) => id !== serviceId),
      serviceQuantities,
      extraDriverNames: extraDriverService?._id === serviceId ? [""] : state.extraDriverNames,
    };
  }

  const serviceQuantities = { ...state.serviceQuantities };
  if (service && serviceAllowsQuantity(service)) {
    serviceQuantities[serviceId] = 1;
  }

  return {
    additionalServiceIds: [...state.additionalServiceIds, serviceId],
    serviceQuantities,
    extraDriverNames: extraDriverService?._id === serviceId ? [""] : state.extraDriverNames,
  };
}

export function setBookingServiceQuantity(
  state: BookingServicesFormState,
  serviceId: string,
  count: number,
  services: AdditionalService[],
): BookingServicesFormState {
  const nextCount = Math.max(1, count);
  const extraDriverService = services.find(isExtraDriverService);
  return {
    ...state,
    serviceQuantities: { ...state.serviceQuantities, [serviceId]: nextCount },
    extraDriverNames:
      extraDriverService?._id === serviceId
        ? resizeNameList(state.extraDriverNames, nextCount)
        : state.extraDriverNames,
  };
}

export function setBookingExtraDriverName(
  state: BookingServicesFormState,
  index: number,
  name: string,
): BookingServicesFormState {
  const extraDriverNames = [...state.extraDriverNames];
  extraDriverNames[index] = name;
  return { ...state, extraDriverNames };
}

export function buildServicesPayload(
  state: BookingServicesFormState,
  services: AdditionalService[],
) {
  const extraDriverService = services.find(isExtraDriverService);
  const hasExtraDriver = extraDriverService
    ? state.additionalServiceIds.includes(extraDriverService._id)
    : false;
  const extraDriverCount =
    hasExtraDriver && extraDriverService
      ? state.serviceQuantities[extraDriverService._id] ?? 1
      : undefined;

  return {
    additionalServiceIds: state.additionalServiceIds,
    serviceQuantities: state.additionalServiceIds.map((serviceId) => ({
      serviceId,
      quantity: state.serviceQuantities[serviceId] ?? 1,
    })),
    extraDriverCount,
    extraDriverNames: hasExtraDriver
      ? state.extraDriverNames.map((name) => name.trim())
      : undefined,
  };
}

export function validateBookingExtraDrivers(
  state: BookingServicesFormState,
  services: AdditionalService[],
): string | null {
  const extraDriverService = services.find(isExtraDriverService);
  if (!extraDriverService || !state.additionalServiceIds.includes(extraDriverService._id)) {
    return null;
  }
  const missingIndex = state.extraDriverNames.findIndex((name) => !name.trim());
  if (missingIndex !== -1) {
    return `Please enter the full name for additional driver ${missingIndex + 1}`;
  }
  return null;
}
