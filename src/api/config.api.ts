import { apiClient } from "./client.ts";
import type { AppConfig } from "@/config/appConfig.ts";

export const configApi = {
  get: async () => {
    const res = await apiClient.get<AppConfig>("/config");
    return res.data;
  },
  update: async (data: { preAuthorizedAmount: number }) => {
    const res = await apiClient.patch<AppConfig>("/config", data);
    return res.data;
  },
};
