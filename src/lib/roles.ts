import { resolvePostLoginPath } from "@/lib/authRedirect.ts";

export type UserRole = "admin" | "sub_admin" | "customer";

export function isStaffRole(role?: string) {
  return role === "admin" || role === "sub_admin";
}

export function isFullAdminRole(role?: string) {
  return role === "admin";
}

/** Destructive CRUD deletes (cars, locations, services, charges, team). */
export function canDeleteRecords(role?: string) {
  return isFullAdminRole(role);
}

export function roleLabel(role?: UserRole) {
  if (role === "admin") return "Admin";
  if (role === "sub_admin") return "Sub-Admin";
  return "Customer";
}

export function roleBadgeClass(role?: string) {
  if (role === "admin") return "bg-primary/20 text-primary border-primary/30 text-xs";
  if (role === "sub_admin") return "bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs";
  return "bg-secondary text-secondary-foreground text-xs";
}

export function getPostLoginPath(role?: string, redirect?: string | null) {
  return resolvePostLoginPath(role, redirect);
}
