import { apiClient } from "./client.ts";
import { pageQuery, resolveListResult, type ListPageParams, type Paginated } from "@/lib/pagination.ts";
import type { AdditionalService, ServiceCategory, ServiceChargeType } from "@/types/index.ts";

type ServiceListParams = { activeOnly?: boolean } & ListPageParams;

export const servicesApi = {
  list: async (
    activeOnlyOrParams?: boolean | ServiceListParams,
  ): Promise<AdditionalService[] | Paginated<AdditionalService>> => {
    const params: ServiceListParams =
      typeof activeOnlyOrParams === "boolean"
        ? { activeOnly: activeOnlyOrParams }
        : activeOnlyOrParams ?? {};
    const res = await apiClient.get<AdditionalService[] | Paginated<AdditionalService>>("/services", {
      params: {
        ...(params.activeOnly ? { activeOnly: true } : {}),
        ...pageQuery(params),
      },
    });
    return resolveListResult<AdditionalService>(res.data, params);
  },
  create: async (data: {
    name: string;
    description?: string;
    dailyRate: number;
    chargeType: ServiceChargeType;
    category: ServiceCategory;
    allowQuantity?: boolean;
  }) => {
    const res = await apiClient.post<AdditionalService>("/services", data);
    return res.data;
  },
  update: async (serviceId: string, data: Partial<AdditionalService>) => {
    const res = await apiClient.patch<AdditionalService>(`/services/${serviceId}`, data);
    return res.data;
  },
  // Temporary: hard delete commented out — delete button calls deactivate
  // remove: async (serviceId: string) => {
  //   await apiClient.delete(`/services/${serviceId}`);
  // },
  deactivate: async (serviceId: string) => {
    const res = await apiClient.patch<AdditionalService>(`/services/${serviceId}/deactivate`);
    return res.data;
  },
};
