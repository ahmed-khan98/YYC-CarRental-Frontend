import {
  apiClient,
  clearStoredToken,
  getStoredRefreshToken,
  getStoredToken,
  refreshAccessToken,
  setStoredRefreshToken,
  setStoredToken,
} from "./client.ts";
import type { AuthResponse, User } from "@/types/index.ts";

export const authApi = {
  register: async (data: { name: string; email: string; password: string }) => {
    const res = await apiClient.post<AuthResponse>("/auth/register", data);
    return res.data;
  },
  login: async (data: { email: string; password: string }) => {
    const res = await apiClient.post<AuthResponse>("/auth/login", data);
    return res.data;
  },
  refresh: async () => {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token");
    }
    const token = await refreshAccessToken();
    if (!token) {
      throw new Error("Refresh failed");
    }
    const res = await apiClient.get<User>("/auth/me");
    return { token, refreshToken: getStoredRefreshToken()!, user: res.data };
  },
  logout: async () => {
    await apiClient.post("/auth/logout");
  },
  me: async () => {
    const res = await apiClient.get<User>("/auth/me");
    return res.data;
  },
};

export { clearStoredToken, getStoredToken, setStoredRefreshToken, setStoredToken };
