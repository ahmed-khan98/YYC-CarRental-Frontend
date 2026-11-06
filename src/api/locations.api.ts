import { apiClient } from "./client.ts";
import { pageQuery, resolveListResult, type ListPageParams, type Paginated } from "@/lib/pagination.ts";
import type { Location } from "@/types/index.ts";

type LocationListParams = { activeOnly?: boolean } & ListPageParams;

export const locationsApi = {
  list: async (
    activeOnlyOrParams?: boolean | LocationListParams,
  ): Promise<Location[] | Paginated<Location>> => {
    const params: LocationListParams =
      typeof activeOnlyOrParams === "boolean"
        ? { activeOnly: activeOnlyOrParams }
        : activeOnlyOrParams ?? {};
    const res = await apiClient.get<Location[] | Paginated<Location>>("/locations", {
      params: {
        ...(params.activeOnly ? { activeOnly: true } : {}),
        ...pageQuery(params),
      },
    });
    return resolveListResult<Location>(res.data, params);
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
  // Temporary: hard delete commented out — delete button calls deactivate
  // remove: async (locationId: string) => {
  //   await apiClient.delete(`/locations/${locationId}`);
  // },
  deactivate: async (locationId: string) => {
    const res = await apiClient.patch<Location>(`/locations/${locationId}/deactivate`);
    return res.data;
  },
};
