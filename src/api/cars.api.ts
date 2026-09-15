import { apiClient } from "./client.ts";
import type { Car, CarCategory } from "@/types/index.ts";

export const carsApi = {
  list: async (params?: {
    category?: string;
    locationId?: string;
    availableOnly?: boolean;
  }) => {
    const res = await apiClient.get<Car[]>("/cars", { params });
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
