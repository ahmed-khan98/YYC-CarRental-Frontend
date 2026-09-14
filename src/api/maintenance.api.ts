import { apiClient } from "./client.ts";
import type { Maintenance, MaintenanceStatus } from "@/types/index.ts";

export const maintenanceApi = {
  listByCar: async (carId: string) => {
    const res = await apiClient.get<Maintenance[]>(`/maintenance/car/${carId}`);
    return res.data;
  },
  listByStatus: async (status: MaintenanceStatus) => {
    const res = await apiClient.get<Maintenance[]>("/maintenance", { params: { status } });
    return res.data;
  },
  create: async (data: {
    carId: string;
    type: string;
    description: string;
    scheduledDate: string;
    cost?: number;
    notes?: string;
  }) => {
    const res = await apiClient.post<Maintenance>("/maintenance", data);
    return res.data;
  },
  update: async (
    maintenanceId: string,
    data: Partial<{
      status: MaintenanceStatus;
      completedDate: string;
      cost: number;
      notes: string;
    }>,
  ) => {
    const res = await apiClient.patch<Maintenance>(`/maintenance/${maintenanceId}`, data);
    return res.data;
  },
};
