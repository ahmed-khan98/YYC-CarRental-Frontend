function isStaffRole(role?: string) {
  return role === "admin" || role === "sub_admin";
}

const REDIRECT_PARAM = "redirect";

export function isSafeRedirect(path: string): boolean {
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  if (path.startsWith("/auth")) return false;
  return true;
}

export function buildLoginPath(returnTo?: string) {
  if (!returnTo || !isSafeRedirect(returnTo)) {
    return "/auth/login";
  }
  return `/auth/login?${REDIRECT_PARAM}=${encodeURIComponent(returnTo)}`;
}

export function getRedirectFromSearch(searchParams: URLSearchParams): string | null {
  const raw = searchParams.get(REDIRECT_PARAM);
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw);
    return isSafeRedirect(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

export function resolvePostLoginPath(role?: string, redirect?: string | null) {
  if (isStaffRole(role)) {
    return "/admin";
  }

  const safe = redirect && isSafeRedirect(redirect) ? redirect : null;
  if (safe) {
    if (safe.startsWith("/admin")) return "/";
    return safe;
  }

  return "/";
}
