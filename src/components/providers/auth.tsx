import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  authApi,
  clearStoredToken,
  getStoredToken,
  setStoredRefreshToken,
  setStoredToken,
} from "@/api/auth.api.ts";
import {
  AUTH_SESSION_EXPIRED_EVENT,
  REFRESH_KEY,
  TOKEN_KEY,
  getStoredUser,
  isTransientApiError,
  isUnauthorizedError,
  refreshAccessToken,
  setStoredUser,
} from "@/api/client.ts";
import type { User } from "@/types/index.ts";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function rememberUser(next: User) {
  setStoredUser(next);
  return next;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() =>
    getStoredToken() ? getStoredUser() : null,
  );
  const [sessionAlive, setSessionAlive] = useState(() => !!getStoredToken());
  const [isLoading, setIsLoading] = useState(() => !!getStoredToken() && !getStoredUser());

  const applyUser = useCallback((next: User) => {
    setSessionAlive(true);
    setUser(rememberUser(next));
  }, []);

  const clearSession = useCallback(() => {
    clearStoredToken();
    setSessionAlive(false);
    setUser(null);
  }, []);

  const keepExistingSession = useCallback(() => {
    setUser((prev) => prev ?? getStoredUser());
  }, []);

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setSessionAlive(false);
      setUser(null);
      return;
    }

    setSessionAlive(true);

    const loadMe = async () => {
      const delays = [0, 700, 1400];
      let lastError: unknown;
      for (const delay of delays) {
        if (delay) {
          await new Promise((resolve) => window.setTimeout(resolve, delay));
        }
        try {
          return await authApi.me();
        } catch (err) {
          lastError = err;
          if (isUnauthorizedError(err)) break;
        }
      }
      throw lastError;
    };

    try {
      applyUser(await loadMe());
    } catch (err) {
      if (isTransientApiError(err) || !isUnauthorizedError(err)) {
        keepExistingSession();
        return;
      }

      try {
        const newToken = await refreshAccessToken();
        if (!newToken) {
          clearSession();
          return;
        }
        applyUser(await authApi.me());
      } catch (retryErr) {
        if (isTransientApiError(retryErr) || !isUnauthorizedError(retryErr)) {
          keepExistingSession();
          return;
        }
        clearSession();
      }
    }
  }, [applyUser, clearSession, keepExistingSession]);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  useEffect(() => {
    const onSessionExpired = () => {
      setSessionAlive(false);
      setUser(null);
    };
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, onSessionExpired);
    return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, onSessionExpired);
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === TOKEN_KEY || event.key === REFRESH_KEY) {
        refreshUser();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await authApi.login({ email, password });
      setStoredToken(data.token);
      setStoredRefreshToken(data.refreshToken);
      applyUser(data.user);
      return data.user;
    },
    [applyUser],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const data = await authApi.register({ name, email, password });
      setStoredToken(data.token);
      setStoredRefreshToken(data.refreshToken);
      applyUser(data.user);
      return data.user;
    },
    [applyUser],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore logout errors — still clear local session
    }
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: sessionAlive,
      isLoading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, sessionAlive, isLoading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
