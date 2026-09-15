import { formatActorDisplayName } from "@/lib/displayName.ts";
import { roleLabel, type UserRole } from "@/lib/roles.ts";

export interface BookingActor {
  userId: string;
  name?: string | null;
  role: UserRole;
}

export function actorFromFields(
  userId?: string | null,
  name?: string | null,
  role?: UserRole | null,
): BookingActor | null {
  if (!userId && !name && !role) return null;
  return {
    userId: userId ?? "",
    name: name ?? null,
    role: role ?? "customer",
  };
}

export function actorFromBillEntry(entry?: {
  createdBy?: BookingActor | null;
  createdByUserId?: string;
  createdByName?: string | null;
  createdByRole?: UserRole;
} | null): BookingActor | null {
  if (!entry) return null;
  if (entry.createdBy?.role || entry.createdBy?.name || entry.createdBy?.userId) {
    return entry.createdBy;
  }
  return actorFromFields(entry.createdByUserId, entry.createdByName, entry.createdByRole);
}

export function formatBookingActor(actor?: BookingActor | null) {
  if (!actor?.role && !actor?.name) return "—";
  const label = actor.role ? roleLabel(actor.role) : "";
  const name = formatActorDisplayName(actor.name, actor.role, "");
  if (name && label) return `${label} · ${name}`;
  if (name) return name;
  return label || "—";
}
