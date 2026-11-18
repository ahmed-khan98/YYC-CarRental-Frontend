import { useQuery } from "@tanstack/react-query";
import { configApi } from "@/api/config.api.ts";

export function userBookingHref(enabled: boolean | null, carId: string, search = "") {
  if (enabled === false) return search ? `/contact?${search}` : "/contact";
  return search ? `/book/${carId}?${search}` : `/book/${carId}`;
}

export function useUserBookingEnabled() {
  const query = useQuery({
    queryKey: ["config", "public"],
    queryFn: configApi.getPublic,
    staleTime: 30_000,
  });

  return {
    isLoading: query.isLoading,
    isError: query.isError,
    allowed: query.isSuccess ? query.data.userBookingEnabled === true : null,
  };
}
