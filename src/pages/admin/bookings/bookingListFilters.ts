import type { Booking } from "@/types/index.ts";
import { pickupDateKey } from "./bookingDateRange.ts";

export type AdminBookingSortField = "pickupDate" | "status" | "created";
export type AdminBookingSortDir = "asc" | "desc";

export const STATUS_OPTIONS = ["pending", "confirmed", "checked_in", "checked_out", "completed", "cancelled"] as const;
export const PAYMENT_OPTIONS = ["pending", "paid", "refunded"] as const;

export const STATUS_ORDER: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  checked_in: 2,
  checked_out: 3,
  completed: 4,
  cancelled: 5,
};

export const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-primary/20 text-primary border-primary/30",
  checked_in: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  checked_out: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

export const PAYMENT_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-500 border-yellow-500/25",
  paid: "bg-green-500/15 text-green-500 border-green-500/25",
  refunded: "bg-muted text-muted-foreground border-border",
};

export function filterAndSortAdminBookings(
  bookings: Booking[] | undefined,
  {
    search,
    statusFilter,
    paymentFilter,
    pickupFrom,
    pickupTo,
    sortField,
    sortDir,
  }: {
    search: string;
    statusFilter: string;
    paymentFilter: string;
    pickupFrom: string;
    pickupTo: string;
    sortField: AdminBookingSortField;
    sortDir: AdminBookingSortDir;
  },
): Booking[] {
  const q = search.trim().toLowerCase();
  return (bookings ?? [])
    .filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (paymentFilter !== "all" && (b.paymentStatus ?? "pending") !== paymentFilter) return false;
      const pickupKey = pickupDateKey(b.pickupDate);
      if (pickupFrom && pickupKey && pickupKey < pickupFrom) return false;
      if (pickupTo && pickupKey && pickupKey > pickupTo) return false;
      if (q) {
        const name = b.user?.name?.toLowerCase() ?? "";
        const email = b.user?.email?.toLowerCase() ?? "";
        const idMatch =
          b._id.toLowerCase().includes(q) ||
          b._id.slice(-8).toLowerCase().includes(q);
        if (!idMatch && !name.includes(q) && !email.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === "pickupDate") {
        cmp = String(a.pickupDate ?? "").localeCompare(String(b.pickupDate ?? ""));
      } else if (sortField === "status") {
        cmp = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
      } else {
        cmp = a._creationTime - b._creationTime;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
}
