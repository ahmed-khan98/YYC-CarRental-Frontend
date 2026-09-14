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

export function getPostLoginPath(role?: string, redirect?: string | null) {
  return resolvePostLoginPath(role, redirect);
}
