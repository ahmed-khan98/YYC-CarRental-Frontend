import { apiClient } from "./client.ts";
import type { Car, CarCategory } from "@/types/index.ts";
import { resolveListResult, type ListPageParams, type Paginated } from "@/lib/pagination.ts";

type CarListFilters = {
  category?: string;
  locationId?: string;
  availableOnly?: boolean;
  includeDeactivated?: boolean;
};

type CarListParams = CarListFilters & ListPageParams;

export const carsApi = {
  list: async (params?: CarListParams): Promise<Car[] | Paginated<Car>> => {
    const res = await apiClient.get<Car[] | Paginated<Car>>("/cars", {
      params: {
        ...params,
        includeDeactivated: params?.includeDeactivated ? true : undefined,
      },
    });
    return resolveListResult<Car>(res.data, params);
  },
  listAvailable: async (params: {
    pickupDate: string;
    returnDate: string;
    pickupTime?: string;
    returnTime?: string;
  }) => {
    const res = await apiClient.get<Car[]>("/cars/available", { params });
    return res.data;
  },
  get: async (carId: string) => {
    const res = await apiClient.get<Car>(`/cars/${carId}`);
    return res.data;
  },
  create: async (data: Omit<Car, "_id" | "_creationTime">) => {
    const res = await apiClient.post<Car>("/cars", data);
    return res.data;
  },
  update: async (carId: string, data: Partial<Car>) => {
    const res = await apiClient.patch<Car>(`/cars/${carId}`, data);
    return res.data;
  },
  remove: async (carId: string) => {
    await apiClient.delete(`/cars/${carId}`);
  },
};

export type { CarCategory };
