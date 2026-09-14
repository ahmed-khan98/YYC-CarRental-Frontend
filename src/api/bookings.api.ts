import { API_BASE, apiClient, getStoredToken } from "./client.ts";
import type { Booking, BookingDetail, BookingStatus, BillEntry, BillEntryResponse, BillEntryType, BillEntryStatus, BillPaidVia, BillSummary } from "@/types/index.ts";
import type { CancellationPolicyType } from "@/lib/cancellation.ts";

export interface CancellationPreview {
  type: CancellationPolicyType;
  hoursUntilPickup: number;
  canCancel: boolean;
  feeSubtotal?: number;
  feeTotal?: number;
  amountDue?: number;
  refundAmount?: number;
  message: string;
}

export interface CancelBookingResult extends Booking {
  cancellationSummary?: {
    policy: "one_day_fee" | "non_refundable";
    feeSubtotal: number;
    feeTotal: number;
    amountDue: number;
    refundAmount: number;
    message: string;
  };
  billEntries?: BillEntry[];
  billSummary?: BillSummary;
}

export interface CarBookingCalendarItem extends Booking {
  customerName: string;
  customerEmail?: string | null;
}

export const bookingsApi = {
  create: async (data: {
    carId: string;
    pickupLocationId: string;
    dropoffLocationId: string;
    pickupDate: string;
    pickupTime?: string;
    returnDate: string;
    returnTime?: string;
  additionalServiceIds?: string[];
  licenseUrl?: string;
    extraDriverCount?: number;
    extraDriverNames?: string[];
    serviceQuantities?: Array<{ serviceId: string; quantity: number }>;
    notes?: string;
  }) => {
    const res = await apiClient.post<Booking>("/bookings", data);
    return res.data;
  },
  adminCreate: async (data: {
    userId: string;
    carId: string;
    pickupLocationId: string;
    dropoffLocationId: string;
    pickupDate: string;
    pickupTime?: string;
    returnDate: string;
    returnTime?: string;
    additionalServiceIds?: string[];
    serviceQuantities?: Array<{ serviceId: string; quantity: number }>;
    extraDriverCount?: number;
    extraDriverNames?: string[];
    notes?: string;
  }) => {
    const res = await apiClient.post<Booking>("/bookings/admin", data);
    return res.data;
  },
  adminUpdate: async (
    bookingId: string,
    data: {
      carId?: string;
      pickupLocationId?: string;
      dropoffLocationId?: string;
      pickupDate?: string;
      pickupTime?: string;
      returnDate?: string;
      returnTime?: string;
      additionalServiceIds?: string[];
      serviceQuantities?: Array<{ serviceId: string; quantity: number }>;
      extraDriverCount?: number;
      extraDriverNames?: string[];
      notes?: string;
      paymentStatus?: "pending" | "paid" | "refunded";
      status?: BookingStatus;
    },
  ) => {
    const res = await apiClient.patch<Booking>(`/bookings/${bookingId}/admin`, data);
    return res.data;
  },
  myBookings: async () => {
    const res = await apiClient.get<Booking[]>("/bookings/my");
    return res.data;
  },
  adminList: async (status?: string) => {
    const res = await apiClient.get<Booking[]>("/bookings/admin", { params: { status } });
    return res.data;
  },
  adminListByCar: async (carId: string) => {
    const res = await apiClient.get<CarBookingCalendarItem[]>(`/bookings/admin/car/${carId}`);
    return res.data;
  },
  getById: async (bookingId: string) => {
    const res = await apiClient.get<Booking>(`/bookings/${bookingId}`);
    return res.data;
  },
  getDetailById: async (bookingId: string) => {
    const res = await apiClient.get<BookingDetail>(`/bookings/${bookingId}/detail`);
    return res.data;
  },
  getUnavailableCarIds: async (
    pickupDate: string,
    returnDate: string,
    pickupTime?: string,
    returnTime?: string,
  ) => {
    const res = await apiClient.get<string[]>("/bookings/unavailable", {
      params: { pickupDate, returnDate, pickupTime, returnTime },
    });
    return res.data;
  },
  updateStatus: async (
    bookingId: string,
    data: { status: BookingStatus; cancellationReason?: string },
  ) => {
    const res = await apiClient.patch<Booking>(`/bookings/${bookingId}/status`, data);
    return res.data;
  },
  getCancellationPreview: async (bookingId: string) => {
    const res = await apiClient.get<CancellationPreview>(`/bookings/${bookingId}/cancellation-preview`);
    return res.data;
  },
  cancel: async (bookingId: string, reason?: string) => {
    const res = await apiClient.post<CancelBookingResult>(`/bookings/${bookingId}/cancel`, { reason });
    return res.data;
  },
  updateCheckInOutVisibility: async (
    bookingId: string,
    data: { checkInVisibleToUser?: boolean; checkOutVisibleToUser?: boolean },
  ) => {
    const res = await apiClient.patch<Booking>(`/bookings/${bookingId}/check-in-out-visibility`, data);
    return res.data;
  },
  addBillEntry: async (
    bookingId: string,
    data: {
      title: string;
      description?: string;
      amount: number;
      entryType: BillEntryType;
      paidVia: BillPaidVia;
      attachment?: File | null;
      status?: BillEntryStatus;
      /** @deprecated use status */
      paid?: boolean;
    },
  ) => {
    const payload = new FormData();
    payload.append("title", data.title);
    if (data.description) payload.append("description", data.description);
    payload.append("amount", String(data.amount));
    payload.append("entryType", data.entryType);
    payload.append("paidVia", data.paidVia);
    if (data.status) payload.append("status", data.status);
    if (data.paid != null) payload.append("paid", String(data.paid));
    if (data.attachment) payload.append("attachment", data.attachment);
    const res = await apiClient.post<BillEntryResponse>(`/bookings/${bookingId}/bill-entries`, payload);
    return res.data;
  },
  updateBillEntry: async (
    bookingId: string,
    entryId: string,
    data: {
      title?: string;
      description?: string;
      amount?: number;
      status?: BillEntryStatus;
      paid?: boolean;
      paidVia?: BillPaidVia;
    },
  ) => {
    const res = await apiClient.patch<BillEntryResponse>(
      `/bookings/${bookingId}/bill-entries/${entryId}`,
      data,
    );
    return res.data;
  },
  refundSecurityDeposit: async (bookingId: string) => {
    const res = await apiClient.post<BillEntryResponse>(`/bookings/${bookingId}/security-deposit/refund`);
    return res.data;
  },
  deleteBillEntry: async (bookingId: string, entryId: string) => {
    const res = await apiClient.delete<BillEntryResponse>(
      `/bookings/${bookingId}/bill-entries/${entryId}`,
    );
    return res.data;
  },
  getFullInvoicePdfUrl: (bookingId: string) => {
    return `${API_BASE}/bookings/${bookingId}/invoice-pdf`;
  },
  downloadFullInvoicePdf: async (bookingId: string, filename?: string) => {
    const token = getStoredToken();
    const response = await fetch(bookingsApi.getFullInvoicePdfUrl(bookingId), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error("Failed to download full invoice PDF");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const disposition = response.headers.get("Content-Disposition");
    const headerName = disposition?.match(/filename="([^"]+)"/)?.[1];
    link.download = headerName ?? filename ?? `invoice-${bookingId.slice(-8)}-ALL.pdf`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },
  getBillEntryInvoicePdfUrl: (bookingId: string, entryId: string) => {
    return `${API_BASE}/bookings/${bookingId}/bill-entries/${entryId}/invoice-pdf`;
  },
  openBillEntryInvoicePdf: async (bookingId: string, entryId: string) => {
    const token = getStoredToken();
    const response = await fetch(bookingsApi.getBillEntryInvoicePdfUrl(bookingId, entryId), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error("Failed to load invoice PDF");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },
  downloadBillEntryInvoicePdf: async (bookingId: string, entryId: string, filename?: string) => {
    const token = getStoredToken();
    const response = await fetch(bookingsApi.getBillEntryInvoicePdfUrl(bookingId, entryId), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error("Failed to download invoice PDF");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const disposition = response.headers.get("Content-Disposition");
    const headerName = disposition?.match(/filename="([^"]+)"/)?.[1];
    link.download = headerName ?? filename ?? `invoice-${entryId.slice(-8)}.pdf`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },
};
