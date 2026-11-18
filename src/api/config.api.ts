import { apiClient } from "./client.ts";
import type { AppConfig, PublicAppConfig } from "@/config/appConfig.ts";

export const configApi = {
  get: async () => {
    const res = await apiClient.get<AppConfig>("/config");
    return res.data;
  },
  getPublic: async () => {
    const res = await apiClient.get<PublicAppConfig>("/config/public");
    return res.data;
  },
  update: async (data: { preAuthorizedAmount?: number; userBookingEnabled?: boolean }) => {
    const res = await apiClient.patch<AppConfig>("/config", data);
    return res.data;
  },
};
