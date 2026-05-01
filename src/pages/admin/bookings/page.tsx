import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog.tsx";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarCheck, Plus } from "lucide-react";

const STATUS_OPTIONS = ["pending", "confirmed", "checked_in", "checked_out", "completed", "cancelled"] as const;
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-primary/20 text-primary border-primary/30",
  checked_in: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  checked_out: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

const TIME_OPTIONS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00",
];

export default function AdminBookingsPage() {
  const bookings = useQuery(api.bookings.adminList, {});
  const updateStatus = useMutation(api.bookings.updateStatus);
  const adminCreate = useMutation(api.bookings.adminCreate);

  const users = useQuery(api.users.listUsers, {});
  const cars = useQuery(api.cars.list, {});
  const locations = useQuery(api.locations.list, { activeOnly: true });
  const services = useQuery(api.services.list, { activeOnly: true });

  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);

  // New booking form state
  const today = format(new Date(), "yyyy-MM-dd");
  const tomorrow = format(new Date(Date.now() + 86400000), "yyyy-MM-dd");
  const [nbUserId, setNbUserId] = useState("");
  const [nbCarId, setNbCarId] = useState("");
  const [nbPickupLocationId, setNbPickupLocationId] = useState("");
  const [nbDropoffLocationId, setNbDropoffLocationId] = useState("");
  const [nbPickupDate, setNbPickupDate] = useState(today);
  const [nbPickupTime, setNbPickupTime] = useState("10:00");
  const [nbReturnDate, setNbReturnDate] = useState(tomorrow);
  const [nbReturnTime, setNbReturnTime] = useState("10:00");
  const [nbSelectedServices, setNbSelectedServices] = useState<string[]>([]);
  const [nbNotes, setNbNotes] = useState("");
  const [nbLoading, setNbLoading] = useState(false);

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

  const toggleService = (id: string) => {
    setNbSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleCreateBooking = async () => {
    if (!nbUserId) { toast.error("Please select a customer"); return; }
    if (!nbCarId) { toast.error("Please select a car"); return; }
    if (!nbPickupLocationId) { toast.error("Please select pickup location"); return; }
    if (!nbDropoffLocationId) { toast.error("Please select drop-off location"); return; }
    if (new Date(nbReturnDate) <= new Date(nbPickupDate)) { toast.error("Return date must be after pickup date"); return; }

    setNbLoading(true);
    try {
      await adminCreate({
        userId: nbUserId as Id<"users">,
        carId: nbCarId as Id<"cars">,
        pickupLocationId: nbPickupLocationId as Id<"locations">,
        dropoffLocationId: nbDropoffLocationId as Id<"locations">,
        pickupDate: new Date(nbPickupDate).toISOString(),
        pickupTime: nbPickupTime,
        returnDate: new Date(nbReturnDate).toISOString(),
        returnTime: nbReturnTime,
        additionalServiceIds: nbSelectedServices as Id<"additionalServices">[],
        notes: nbNotes || undefined,
      });
      toast.success("Booking created successfully");
      setCreateOpen(false);
      // Reset form
      setNbUserId(""); setNbCarId(""); setNbPickupLocationId(""); setNbDropoffLocationId("");
      setNbPickupDate(today); setNbPickupTime("10:00"); setNbReturnDate(tomorrow); setNbReturnTime("10:00");
      setNbSelectedServices([]); setNbNotes("");
    } catch (err) {
      toast.error("Failed to create booking");
    } finally {
      setNbLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Bookings</h2>
          <p className="text-muted-foreground text-sm">{filtered.length} booking{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-3">
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
          <Button onClick={() => setCreateOpen(true)} className="cursor-pointer flex items-center gap-2">
            <Plus className="h-4 w-4" /> Create Booking
          </Button>
        </div>
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
                      {format(new Date(booking.pickupDate), "MMM d, yyyy")}{booking.pickupTime ? ` at ${booking.pickupTime}` : ""}
                      {" — "}
                      {format(new Date(booking.returnDate), "MMM d, yyyy")}{booking.returnTime ? ` at ${booking.returnTime}` : ""}
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

      {/* Create Booking Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Booking for Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Customer */}
            <div className="space-y-1.5">
              <Label className="text-xs">Customer</Label>
              <Select value={nbUserId} onValueChange={setNbUserId}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  {(users ?? []).map((u) => (
                    <SelectItem key={u._id} value={u._id}>
                      {u.name ?? "Unknown"} — {u.email ?? "No email"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Car */}
            <div className="space-y-1.5">
              <Label className="text-xs">Car</Label>
              <Select value={nbCarId} onValueChange={setNbCarId}>
                <SelectTrigger><SelectValue placeholder="Select car" /></SelectTrigger>
                <SelectContent>
                  {(cars ?? []).map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.year} {c.make} {c.model} — ${c.dailyRate}/day {!c.isAvailable ? "(unavailable)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Locations */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Pickup Location</Label>
                <Select value={nbPickupLocationId} onValueChange={setNbPickupLocationId}>
                  <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                  <SelectContent>
                    {(locations ?? []).map((loc) => (
                      <SelectItem key={loc._id} value={loc._id}>{loc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Drop-off Location</Label>
                <Select value={nbDropoffLocationId} onValueChange={setNbDropoffLocationId}>
                  <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                  <SelectContent>
                    {(locations ?? []).map((loc) => (
                      <SelectItem key={loc._id} value={loc._id}>{loc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dates & Times */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Pickup Date</Label>
                <Input type="date" min={today} value={nbPickupDate} onChange={(e) => setNbPickupDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Pickup Time</Label>
                <Select value={nbPickupTime} onValueChange={setNbPickupTime}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Drop-off Date</Label>
                <Input type="date" min={nbPickupDate} value={nbReturnDate} onChange={(e) => setNbReturnDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Drop-off Time</Label>
                <Select value={nbReturnTime} onValueChange={setNbReturnTime}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Additional Services */}
            {(services ?? []).length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs">Additional Services (optional)</Label>
                <div className="space-y-2">
                  {(services ?? []).map((svc) => (
                    <div
                      key={svc._id}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        nbSelectedServices.includes(svc._id) ? "border-primary/50 bg-primary/5" : "border-border/50"
                      }`}
                      onClick={() => toggleService(svc._id)}
                    >
                      <Checkbox checked={nbSelectedServices.includes(svc._id)} onCheckedChange={() => toggleService(svc._id)} />
                      <span className="flex-1 text-sm">{svc.name}</span>
                      <span className="text-xs text-primary">+${svc.dailyRate}/day</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs">Notes (optional)</Label>
              <textarea
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                rows={2}
                placeholder="Special requests or notes..."
                value={nbNotes}
                onChange={(e) => setNbNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setCreateOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleCreateBooking} disabled={nbLoading} className="cursor-pointer">
              {nbLoading ? "Creating..." : "Create Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
