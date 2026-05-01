import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarCheck } from "lucide-react";

const STATUS_OPTIONS = ["pending", "confirmed", "checked_in", "checked_out", "completed", "cancelled"] as const;
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-primary/20 text-primary border-primary/30",
  checked_in: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  checked_out: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function AdminBookingsPage() {
  const bookings = useQuery(api.bookings.adminList, {});
  const updateStatus = useMutation(api.bookings.updateStatus);
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = (bookings ?? [])
    .filter((b) => statusFilter === "all" || b.status === statusFilter)
    .sort((a, b) => b._creationTime - a._creationTime);

  const handleStatusChange = async (bookingId: Id<"bookings">, status: typeof STATUS_OPTIONS[number]) => {
    try {
      await updateStatus({ bookingId, status });
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Bookings</h2>
          <p className="text-muted-foreground text-sm">{filtered.length} booking{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {bookings === undefined ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <CalendarCheck className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No bookings found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => (
            <Card key={booking._id} className="border-border/50 bg-card/60">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">#{booking._id.slice(-8)}</span>
                      <Badge className={`text-xs border capitalize ${STATUS_COLORS[booking.status] ?? ""}`}>
                        {booking.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Pickup:</span>{" "}
                      {format(new Date(booking.pickupDate), "MMM d, yyyy")}
                      {" — "}
                      {format(new Date(booking.returnDate), "MMM d, yyyy")}
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Total:</span>{" "}
                      <span className="text-primary font-semibold">${booking.totalAmount}</span>
                    </p>
                  </div>
                  <div className="shrink-0">
                    <Select
                      value={booking.status}
                      onValueChange={(v) => handleStatusChange(booking._id, v as typeof STATUS_OPTIONS[number])}
                    >
                      <SelectTrigger className="w-40 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace("_", " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
