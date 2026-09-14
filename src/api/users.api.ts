import { apiClient } from "./client.ts";
import type { User, UserRole } from "@/types/index.ts";

export const usersApi = {
  getCurrentUser: async () => {
    const res = await apiClient.get<User>("/users/me");
    return res.data;
  },
  updateProfile: async (data: { name?: string; phone?: string; licenseUrl?: string }) => {
    const res = await apiClient.patch<User>("/users/me/profile", data);
    return res.data;
  },
  listUsers: async () => {
    const res = await apiClient.get<User[]>("/users");
    return res.data;
  },
  listSubAdmins: async () => {
    const res = await apiClient.get<User[]>("/users/sub-admins");
    return res.data;
  },
  createSubAdmin: async (data: { name: string; email: string; password: string }) => {
    const res = await apiClient.post<User>("/users/sub-admins", data);
    return res.data;
  },
  updateSubAdmin: async (
    userId: string,
    data: { name?: string; email?: string; password?: string },
  ) => {
    const res = await apiClient.patch<User>(`/users/sub-admins/${userId}`, data);
    return res.data;
  },
  createCustomer: async (data: { name: string; email: string; password: string; phone?: string }) => {
    const res = await apiClient.post<User>("/users/customers", data);
    return res.data;
  },
  deleteSubAdmin: async (userId: string) => {
    await apiClient.delete(`/users/sub-admins/${userId}`);
  },
  setRole: async (userId: string, role: UserRole) => {
    const res = await apiClient.patch<User>(`/users/${userId}/role`, { role });
    return res.data;
  },
};
