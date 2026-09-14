import type { ReactNode } from "react";
import { useAuthContext } from "@/components/providers/auth.tsx";

export function AuthLoading({ children }: { children: ReactNode }) {
  const { isLoading } = useAuthContext();
  if (!isLoading) return null;
  return <>{children}</>;
}

export function Authenticated({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthContext();
  if (isLoading || !isAuthenticated) return null;
  return <>{children}</>;
}

export function Unauthenticated({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthContext();
  if (isLoading || isAuthenticated) return null;
  return <>{children}</>;
}
