import { apiClient } from "./client.ts";
import type { AdditionalService, ServiceCategory, ServiceChargeType } from "@/types/index.ts";

export const servicesApi = {
  list: async (activeOnly?: boolean) => {
    const res = await apiClient.get<AdditionalService[]>("/services", {
      params: activeOnly ? { activeOnly: true } : undefined,
    });
    return res.data;
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
  remove: async (serviceId: string) => {
    await apiClient.delete(`/services/${serviceId}`);
  },
};
