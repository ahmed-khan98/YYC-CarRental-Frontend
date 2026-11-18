import { apiClient } from "./client.ts";

export type PublicStats = {
  cars: number;
  customers: number;
  locations: number;
  rating?: number | null;
  reviewCount?: number | null;
  reviewsUrl?: string | null;
};

export const statsApi = {
  getPublic: async () => {
    const res = await apiClient.get<PublicStats>("/stats/public");
    return res.data;
  },
};
