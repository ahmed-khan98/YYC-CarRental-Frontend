import type { Booking, ServiceCategory } from "@/types/index.ts";
import type { ExtraDriverCheckInDetail } from "@/types/index.ts";

export type { ExtraDriverCheckInDetail };

/** Detects the additional-driver add-on by category or service name. */
export function isExtraDriverService(service: {
  name?: string;
  category?: ServiceCategory | string;
}) {
  const name = service.name?.toLowerCase() ?? "";
  return service.category === "driver" || name.includes("extra driver") || name.includes("additional driver");
}

export function getBookingExtraDriverCount(
  booking: Pick<Booking, "extraDriverCount" | "extraDriverNames" | "serviceSnapshots">,
): number {
  const count = Number(booking.extraDriverCount) || 0;
  if (count > 0) return count;

  const snapshot = booking.serviceSnapshots?.find(isExtraDriverService);
  if (snapshot?.quantity && snapshot.quantity > 0) return snapshot.quantity;

  const names = booking.extraDriverNames ?? [];
  return names.filter((name) => name?.trim()).length;
}

export function bookingHasExtraDrivers(
  booking: Pick<Booking, "extraDriverCount" | "extraDriverNames" | "serviceSnapshots">,
): boolean {
  return getBookingExtraDriverCount(booking) > 0;
}

export function buildExtraDriverCheckInForms(
  booking: Pick<Booking, "extraDriverNames">,
  count: number,
): ExtraDriverCheckInDetail[] {
  return Array.from({ length: count }, (_, index) => ({
    fullName: booking.extraDriverNames?.[index]?.trim() ?? "",
    licenseNumber: "",
    licenseExpiryDate: "",
    countryOfIssue: "",
  }));
}

function extraDriverHasLicenseImage(
  driver: ExtraDriverCheckInDetail,
  image?: { file?: File | null } | null,
): boolean {
  if (image?.file instanceof File) return true;
  const url = driver.licenseImageUrl?.trim() ?? "";
  return /^https?:\/\//i.test(url);
}

export function validateExtraDriverCheckInDetails(
  expectedCount: number,
  extraDrivers: ExtraDriverCheckInDetail[],
  licenseImages: Array<{ file?: File | null } | null | undefined> = [],
): string | null {
  if (expectedCount < 1) return null;

  if (extraDrivers.length !== expectedCount) {
    return `License details are required for all ${expectedCount} additional driver(s)`;
  }

  for (let i = 0; i < extraDrivers.length; i++) {
    const driver = extraDrivers[i];
    if (!driver.fullName.trim()) return `Driver ${i + 1}: full name is required`;
    if (!driver.licenseNumber.trim()) return `Driver ${i + 1}: license number is required`;
    if (!driver.licenseExpiryDate.trim()) return `Driver ${i + 1}: license expiry date is required`;
    if (!driver.countryOfIssue.trim()) return `Driver ${i + 1}: country of issue is required`;
    if (!extraDriverHasLicenseImage(driver, licenseImages[i])) {
      return `Driver ${i + 1}: license image is required`;
    }
  }

  return null;
}
