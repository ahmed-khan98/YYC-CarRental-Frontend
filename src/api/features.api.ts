import { apiClient } from "./client.ts";
import { pageQuery, resolveListResult, type ListPageParams, type Paginated } from "@/lib/pagination.ts";
import type { CarFeature } from "@/types/index.ts";

type FeatureListParams = { activeOnly?: boolean } & ListPageParams;

export const featuresApi = {
  list: async (
    activeOnlyOrParams?: boolean | FeatureListParams,
  ): Promise<CarFeature[] | Paginated<CarFeature>> => {
    const params: FeatureListParams =
      typeof activeOnlyOrParams === "boolean"
        ? { activeOnly: activeOnlyOrParams }
        : activeOnlyOrParams ?? {};
    const res = await apiClient.get<CarFeature[] | Paginated<CarFeature>>("/features", {
      params: {
        ...(params.activeOnly ? { activeOnly: true } : {}),
        ...pageQuery(params),
      },
    });
    return resolveListResult<CarFeature>(res.data, params);
  },
  create: async (data: { name: string }) => {
    const res = await apiClient.post<CarFeature>("/features", data);
    return res.data;
  },
  update: async (featureId: string, data: Partial<Pick<CarFeature, "name">>) => {
    const res = await apiClient.patch<CarFeature>(`/features/${featureId}`, data);
    return res.data;
  },
  remove: async (featureId: string) => {
    await apiClient.delete(`/features/${featureId}`);
  },
};
