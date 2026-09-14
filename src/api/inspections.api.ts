import { API_BASE, apiClient, getStoredToken } from "./client.ts";
import type { ExtraDriverCheckInDetail, FuelLevel, InspectionType, MainDriverCheckInDetail, VehicleInspection } from "@/types/index.ts";
import type { ExtraMileageBilling } from "@/lib/extraMileage.ts";

export type InspectionCreateResult = VehicleInspection & {
  mileageBilling?: ExtraMileageBilling & { newTotalAmount?: number };
};

export const inspectionsApi = {
  create: async (data: {
    carId: string;
    bookingId: string;
    type: InspectionType;
    mileage: number;
    fuelLevel: FuelLevel;
    notes?: string;
    imageUrls?: string[];
    signatureDataUrl?: string;
    paymentEntry?: {
      amount: number;
      title?: string;
      description?: string;
    };
    chargeEntries?: {
      title: string;
      description?: string;
      amount: number;
    }[];
    extraDrivers?: ExtraDriverCheckInDetail[];
    mainDriver?: MainDriverCheckInDetail;
  }) => {
    const res = await apiClient.post<InspectionCreateResult>("/inspections", data);
    return res.data;
  },
  getCheckInTermsPdfUrl: (bookingId: string) => {
    return `${API_BASE}/inspections/terms-pdf/${bookingId}`;
  },
  fetchCheckInTermsPdf: async (
    bookingId: string,
    draft: {
      mode?: "check_in" | "check_out";
      mainDriver?: MainDriverCheckInDetail;
      mileage?: number;
      fuelLevel?: FuelLevel;
      notes?: string;
      extraDrivers?: ExtraDriverCheckInDetail[];
      paymentAmount?: number;
    },
    signal?: AbortSignal,
  ) => {
    const token = getStoredToken();
    const response = await fetch(inspectionsApi.getCheckInTermsPdfUrl(bookingId), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(draft),
      signal,
    });
    if (!response.ok) {
      throw new Error("Failed to load agreement PDF");
    }
    return response.blob();
  },
  getSignedPdfUrl: (inspectionId: string) => {
    return `${API_BASE}/inspections/signed-pdf/${inspectionId}`;
  },
  openSignedPdf: async (inspectionId: string) => {
    const token = getStoredToken();
    const response = await fetch(inspectionsApi.getSignedPdfUrl(inspectionId), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      let message = "Failed to load signed PDF";
      try {
        const data = (await response.json()) as { message?: string };
        if (data?.message) message = data.message;
      } catch {
        // keep default message when the body is not JSON
      }
      throw new Error(message);
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },
  listByBooking: async (bookingId: string) => {
    const res = await apiClient.get<VehicleInspection[]>(`/inspections/booking/${bookingId}`);
    return res.data;
  },
  listByCar: async (carId: string) => {
    const res = await apiClient.get<VehicleInspection[]>(`/inspections/car/${carId}`);
    return res.data;
  },
  adminList: async () => {
    const res = await apiClient.get<VehicleInspection[]>("/inspections/admin");
    return res.data;
  },
};
