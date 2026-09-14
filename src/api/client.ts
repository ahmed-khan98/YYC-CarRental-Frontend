import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { AuthResponse, User } from "@/types/index.ts";

export const TOKEN_KEY = "yyc_token";
export const REFRESH_KEY = "yyc_refresh_token";
export const USER_KEY = "yyc_user";
export const AUTH_SESSION_EXPIRED_EVENT = "yyc:session-expired";

export const API_BASE = String(
  import.meta.env.VITE_API_BASE_URL || "https://api.yyccarrental.com/api/v1",
).replace(/\/$/, "");

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string | null> | null = null;

function isAuthBypassUrl(url: string) {
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/register") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/logout")
  );
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function setStoredRefreshToken(refreshToken: string) {
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function notifySessionExpired() {
  clearStoredToken();
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_EXPIRED_EVENT));
}

export function isNetworkError(error: unknown) {
  return axios.isAxiosError(error) && !error.response;
}

export function isTransientApiError(error: unknown) {
  if (!axios.isAxiosError(error)) return false;
  if (!error.response) return true;
  return error.response.status >= 500;
}

export function isUnauthorizedError(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await axios.post<AuthResponse | { success: boolean; statusCode: number; data: AuthResponse }>(
      `${API_BASE}/auth/refresh`,
      { refreshToken },
    );
    const payload = (isApiResponse(res.data) ? res.data.data : res.data) as AuthResponse;
    setStoredToken(payload.token);
    if (payload.refreshToken) {
      setStoredRefreshToken(payload.refreshToken);
    }
    return payload.token;
  } catch (error) {
    if (isTransientApiError(error)) {
      throw error;
    }
    return null;
  }
}

function getRefreshPromise() {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export const apiClient = axios.create({
  baseURL: API_BASE,
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function isApiResponse(payload: unknown): payload is {
  success: boolean;
  statusCode: number;
  data: unknown;
  message?: string;
} {
  return (
    !!payload &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    "success" in payload &&
    "statusCode" in payload &&
    "data" in payload &&
    typeof (payload as { success: unknown }).success === "boolean" &&
    typeof (payload as { statusCode: unknown }).statusCode === "number"
  );
}

apiClient.interceptors.response.use(
  (response) => {
    if (isApiResponse(response.data)) {
      response.data = response.data.data as typeof response.data;
    }
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined;
    const url = config?.url ?? "";

    if (!error.response || !config || error.response.status !== 401 || config._retry || isAuthBypassUrl(url)) {
      return Promise.reject(error);
    }

    config._retry = true;
    try {
      const newToken = await getRefreshPromise();
      if (newToken) {
        config.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(config);
      }
    } catch {
      return Promise.reject(error);
    }

    notifySessionExpired();
    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.code === "ERR_NETWORK" || !error.response) {
      return "Cannot reach the API server. Start the backend with: npm run dev (YYC-CAR-RENTAL-BACKEND)";
    }
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message ?? error.message;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}
