import { apiClient } from "./client.ts";
import { pageQuery, resolveListResult, type ListPageParams, type Paginated } from "@/lib/pagination.ts";
import type { Maintenance, MaintenanceStatus } from "@/types/index.ts";

export const maintenanceApi = {
  listByCar: async (carId: string) => {
    const res = await apiClient.get<Maintenance[]>(`/maintenance/car/${carId}`);
    return res.data;
  },
  list: async (params?: ListPageParams): Promise<Maintenance[] | Paginated<Maintenance>> => {
    const res = await apiClient.get<Maintenance[] | Paginated<Maintenance>>("/maintenance", {
      params: pageQuery(params),
    });
    return resolveListResult<Maintenance>(res.data, params);
  },
  listByStatus: async (
    status: MaintenanceStatus,
    params?: ListPageParams,
  ): Promise<Maintenance[] | Paginated<Maintenance>> => {
    const res = await apiClient.get<Maintenance[] | Paginated<Maintenance>>("/maintenance", {
      params: { status, ...pageQuery(params) },
    });
    return resolveListResult<Maintenance>(res.data, params);
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
