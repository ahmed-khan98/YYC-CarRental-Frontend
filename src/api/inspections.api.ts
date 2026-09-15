import { openPdfAfterFetch } from "@/lib/openPdf.ts";
import { API_BASE, apiClient, getStoredToken } from "./client.ts";
import type { Booking, ExtraDriverCheckInDetail, FuelLevel, InspectionType, MainDriverCheckInDetail, VehicleInspection } from "@/types/index.ts";
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
      let message = "Failed to load agreement PDF";
      try {
        const data = (await response.json()) as { message?: string };
        if (data?.message) message = data.message;
      } catch {
        // keep default when the body is not JSON
      }
      throw new Error(message);
    }
    const blob = await response.blob();
    const header = await blob.slice(0, 5).text();
    if (!header.startsWith("%PDF")) {
      throw new Error("Failed to load agreement PDF");
    }
    const filename = `${draft.mode === "check_out" ? "check-out" : "check-in"}-agreement-${bookingId}.pdf`;
    return new File([blob], filename, { type: "application/pdf" });
  },
  getSignedPdfUrl: (inspectionId: string) => {
    return `${API_BASE}/inspections/signed-pdf/${inspectionId}`;
  },
  openSignedPdf: async (inspectionId: string) => {
    await openPdfAfterFetch(async () => {
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
      return response.blob();
    }, `agreement-${inspectionId}.pdf`);
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
  checkInOutBoard: async () => {
    const res = await apiClient.get<Booking[]>("/inspections/check-in-out");
    return res.data;
  },
  getById: async (inspectionId: string) => {
    const res = await apiClient.get<VehicleInspection>(`/inspections/${inspectionId}`);
    return res.data;
  },
};
