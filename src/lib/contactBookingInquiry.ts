import { formatBookingDate, formatDateAtTime } from "@/lib/timeFormat.ts";

export type ContactBookingInquiry = {
  carName: string;
  pickupDate: string;
  pickupTime: string;
  pickupLocationId: string;
  dropoffDate: string;
  dropoffTime: string;
  dropoffLocationId: string;
};

export function readContactBookingInquiry(search: URLSearchParams): ContactBookingInquiry {
  return {
    carName: search.get("carName")?.trim() ?? "",
    pickupDate: search.get("pickupDate")?.trim() ?? "",
    pickupTime: search.get("pickupTime")?.trim() ?? "",
    pickupLocationId: search.get("pickupLocation")?.trim() ?? "",
    dropoffDate: search.get("dropoffDate")?.trim() ?? "",
    dropoffTime: search.get("dropoffTime")?.trim() ?? "",
    dropoffLocationId: search.get("dropoffLocation")?.trim() ?? "",
  };
}

export function hasContactBookingInquiry(inquiry: ContactBookingInquiry): boolean {
  return Boolean(
    inquiry.carName ||
      inquiry.pickupDate ||
      inquiry.pickupLocationId ||
      inquiry.dropoffDate ||
      inquiry.dropoffLocationId,
  );
}

export type ContactInquiryLine =
  | { type: "text"; text: string }
  | { type: "field"; label: string; value: string };

export function contactBookingInquiryLines(
  inquiry: ContactBookingInquiry,
  locationNames: Map<string, string> | Record<string, string> = {},
): ContactInquiryLine[] {
  const nameOf = (id: string) => {
    if (!id) return "";
    if (locationNames instanceof Map) return locationNames.get(id) ?? "";
    return locationNames[id] ?? "";
  };

  const pickupWhen = inquiry.pickupDate
    ? formatDateAtTime(formatBookingDate(inquiry.pickupDate), inquiry.pickupTime || undefined)
    : "";
  const dropoffWhen = inquiry.dropoffDate
    ? formatDateAtTime(formatBookingDate(inquiry.dropoffDate), inquiry.dropoffTime || undefined)
    : "";

  const fields: ContactInquiryLine[] = [];
  if (inquiry.carName) fields.push({ type: "field", label: "Car", value: inquiry.carName });
  if (pickupWhen) fields.push({ type: "field", label: "Pickup date", value: pickupWhen });
  if (nameOf(inquiry.pickupLocationId)) {
    fields.push({ type: "field", label: "Pickup location", value: nameOf(inquiry.pickupLocationId) });
  }
  if (dropoffWhen) fields.push({ type: "field", label: "Drop-off date", value: dropoffWhen });
  if (nameOf(inquiry.dropoffLocationId)) {
    fields.push({ type: "field", label: "Drop-off location", value: nameOf(inquiry.dropoffLocationId) });
  }

  if (fields.length === 0) return [];
  return [
    { type: "text", text: "I would like to request a booking." },
    ...fields,
  ];
}

export function formatContactBookingInquiryMessage(
  inquiry: ContactBookingInquiry,
  locationNames: Map<string, string> | Record<string, string> = {},
): string {
  const lines = contactBookingInquiryLines(inquiry, locationNames);
  if (lines.length === 0) return "";
  return lines
    .map((line, index) => {
      if (line.type === "text") return index === 0 ? `${line.text}\n` : line.text;
      return `${line.label}: ${line.value}`;
    })
    .join("\n");
}
