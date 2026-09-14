import { apiClient } from "./client.ts";
import type { Location } from "@/types/index.ts";

export const locationsApi = {
  list: async (activeOnly?: boolean) => {
    const res = await apiClient.get<Location[]>("/locations", {
      params: activeOnly ? { activeOnly: true } : undefined,
    });
    return res.data;
  },
  get: async (locationId: string) => {
    const res = await apiClient.get<Location>(`/locations/${locationId}`);
    return res.data;
  },
  create: async (data: { name: string; address: string; city: string; phone?: string }) => {
    const res = await apiClient.post<Location>("/locations", data);
    return res.data;
  },
  update: async (locationId: string, data: Partial<Location>) => {
    const res = await apiClient.patch<Location>(`/locations/${locationId}`, data);
    return res.data;
  },
  remove: async (locationId: string) => {
    await apiClient.delete(`/locations/${locationId}`);
  },
};
