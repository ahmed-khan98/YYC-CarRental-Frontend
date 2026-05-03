import { useState, useMemo } from "react";
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
import { CalendarCheck, Plus, MapPin, Clock, Car, User, SlidersHorizontal, X } from "lucide-react";

const STATUS_OPTIONS = ["pending", "confirmed", "checked_in", "checked_out", "completed", "cancelled"] as const;
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-primary/20 text-primary border-primary/30",
  checked_in: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  checked_out: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};
const CATEGORIES = ["economy", "compact", "sedan", "suv", "luxury", "sports", "van"] as const;

const TIME_OPTIONS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00",
];
const today = format(new Date(), "yyyy-MM-dd");
const tomorrow = format(new Date(Date.now() + 86400000), "yyyy-MM-dd");

const CAR_IMAGES: Record<string, string> = {
  economy: "https://images.unsplash.com/photo-1690278289651-895463644114?w=200&q=70",
  sedan: "https://images.unsplash.com/photo-1679891647402-330589ea9309?w=200&q=70",
  suv: "https://images.unsplash.com/photo-1742869246328-847a516cd30a?w=200&q=70",
  luxury: "https://images.unsplash.com/photo-1650716748498-a2ce13ed0f2d?w=200&q=70",
  sports: "https://images.unsplash.com/photo-1683916138305-98a86efc9fc9?w=200&q=70",
  compact: "https://images.unsplash.com/photo-1647708790575-05985b7f670c?w=200&q=70",
  van: "https://images.unsplash.com/photo-1701918190763-3851cf361f96?w=200&q=70",
};

export default function AdminBookingsPage() {
  const bookings = useQuery(api.bookings.adminList, {});
  const updateStatus = useMutation(api.bookings.updateStatus);
  const adminCreate = useMutation(api.bookings.adminCreate);
  const cancelBooking = useMutation(api.bookings.cancel);

  const users = useQuery(api.users.listUsers, {});
  const cars = useQuery(api.cars.list, {});
  const locations = useQuery(api.locations.list, { activeOnly: true });
  const services = useQuery(api.services.list, { activeOnly: true });

  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [carFilter, setCarFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelBookingId, setCancelBookingId] = useState<Id<"bookings"> | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  // New booking form state
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

  // Build lookup maps
  const carsMap = useMemo(() => {
    const m = new Map<string, typeof cars extends (infer T)[] | undefined ? T : never>();
    (cars ?? []).forEach((c) => { if (c) m.set(c._id, c); });
    return m;
  }, [cars]);

  const usersMap = useMemo(() => {
    const m = new Map<string, typeof users extends (infer T)[] | undefined ? T : never>();
    (users ?? []).forEach((u) => { if (u) m.set(u._id, u); });
    return m;
  }, [users]);

  const locationsMap = useMemo(() => {
    const m = new Map<string, typeof locations extends (infer T)[] | undefined ? T : never>();
    (locations ?? []).forEach((l) => { if (l) m.set(l._id, l); });
    return m;
  }, [locations]);

  const filtered = useMemo(() => {
    return (bookings ?? [])
      .filter((b) => {
        if (statusFilter !== "all" && b.status !== statusFilter) return false;
        if (startDateFilter && new Date(b.pickupDate) < new Date(startDateFilter)) return false;
        if (endDateFilter && new Date(b.pickupDate) > new Date(endDateFilter)) return false;
        if (carFilter !== "all" && b.carId !== carFilter) return false;
        if (categoryFilter !== "all") {
          const car = carsMap.get(b.carId);
          if (!car || car.category !== categoryFilter) return false;
        }
        return true;
      })
      .sort((a, b) => b._creationTime - a._creationTime);
  }, [bookings, statusFilter, startDateFilter, endDateFilter, carFilter, categoryFilter, carsMap]);

  const hasFilters = statusFilter !== "all" || categoryFilter !== "all" || startDateFilter || endDateFilter || carFilter !== "all";

  const handleStatusChange = async (bookingId: Id<"bookings">, status: typeof STATUS_OPTIONS[number]) => {
    try {
      await updateStatus({ bookingId, status });
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const openCancel = (id: Id<"bookings">) => {
    setCancelBookingId(id);
    setCancelReason("");
    setCancelOpen(true);
  };

  const handleAdminCancel = async () => {
    if (!cancelBookingId) return;
    if (!cancelReason.trim()) { toast.error("Please provide a cancellation reason"); return; }
    setCancelLoading(true);
    try {
      await cancelBooking({ bookingId: cancelBookingId, reason: cancelReason });
      toast.success("Booking cancelled");
      setCancelOpen(false);
    } catch {
      toast.error("Failed to cancel booking");
    } finally {
      setCancelLoading(false);
    }
  };

  const toggleService = (id: string) => {
    setNbSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleCreateBooking = async () => {
    if (!nbUserId || !nbCarId || !nbPickupLocationId || !nbDropoffLocationId) {
      toast.error("Please fill all required fields"); return;
    }
    if (new Date(nbReturnDate) <= new Date(nbPickupDate)) {
      toast.error("Return date must be after pickup date"); return;
    }
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
      toast.success("Booking created");
      setCreateOpen(false);
      setNbUserId(""); setNbCarId(""); setNbPickupLocationId(""); setNbDropoffLocationId("");
      setNbPickupDate(today); setNbPickupTime("10:00"); setNbReturnDate(tomorrow); setNbReturnTime("10:00");
      setNbSelectedServices([]); setNbNotes("");
    } catch {
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
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {hasFilters && <Badge className="h-4 w-4 p-0 flex items-center justify-center text-[10px]">!</Badge>}
          </Button>
          <Button onClick={() => setCreateOpen(true)} className="cursor-pointer flex items-center gap-2">
            <Plus className="h-4 w-4" /> Create Booking
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-4 rounded-xl bg-card border border-border/50 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Filters</h3>
            {hasFilters && (
              <button
                onClick={() => { setStatusFilter("all"); setCategoryFilter("all"); setStartDateFilter(""); setEndDateFilter(""); setCarFilter("all"); }}
                className="text-xs text-primary flex items-center gap-1 cursor-pointer hover:underline"
              >
                <X className="h-3 w-3" /> Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Vehicle Type</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="text-xs capitalize">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Car</Label>
              <Select value={carFilter} onValueChange={setCarFilter}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cars</SelectItem>
                  {(cars ?? []).map((c) => <SelectItem key={c._id} value={c._id} className="text-xs">{c.make} {c.model}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Start Date</Label>
              <Input type="date" value={startDateFilter} onChange={(e) => setStartDateFilter(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End Date</Label>
              <Input type="date" value={endDateFilter} onChange={(e) => setEndDateFilter(e.target.value)} className="h-8 text-xs" />
            </div>
          </div>
        </div>
      )}

      {/* Bookings List */}
      {bookings === undefined ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <CalendarCheck className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No bookings found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => {
            const car = carsMap.get(booking.carId);
            const customer = usersMap.get(booking.userId);
            const pickupLoc = locationsMap.get(booking.pickupLocationId);
            const dropoffLoc = locationsMap.get(booking.dropoffLocationId);
            const carImg = (car?.resolvedImageUrls?.[0]) ?? car?.imageUrl ?? (car ? CAR_IMAGES[car.category] : undefined);

            return (
              <Card key={booking._id} className="border-border/50 bg-card/60">
                <CardContent className="p-4">
                  <div className="flex gap-4 flex-wrap">
                    {/* Car Image */}
                    {carImg && (
                      <img
                        src={carImg}
                        alt={car ? `${car.make} ${car.model}` : "Car"}
                        className="w-24 h-16 object-cover rounded-lg shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Top row: car + status + actions */}
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs text-muted-foreground">#{booking._id.slice(-8)}</span>
                            <Badge className={`text-xs border capitalize ${STATUS_COLORS[booking.status] ?? ""}`}>
                              {booking.status.replace("_", " ")}
                            </Badge>
                          </div>
                          {car && (
                            <div className="flex items-center gap-2 mt-1">
                              <Car className="h-3 w-3 text-primary" />
                              <span className="text-sm font-semibold">{car.year} {car.make} {car.model}</span>
                              <span className="text-xs text-muted-foreground">${car.dailyRate}/day</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Select
                            value={booking.status}
                            onValueChange={(v) => handleStatusChange(booking._id, v as typeof STATUS_OPTIONS[number])}
                          >
                            <SelectTrigger className="w-36 h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((s) => (
                                <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace("_", " ")}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {booking.status !== "cancelled" && booking.status !== "completed" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-destructive hover:text-destructive cursor-pointer"
                              onClick={() => openCancel(booking._id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Details grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-primary shrink-0" />
                          <span>Pickup: <span className="text-foreground">{pickupLoc?.name ?? "—"}</span></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-primary shrink-0" />
                          <span>{format(new Date(booking.pickupDate), "MMM d, yyyy")}{booking.pickupTime ? ` at ${booking.pickupTime}` : ""}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-primary shrink-0" />
                          <span>Drop-off: <span className="text-foreground">{dropoffLoc?.name ?? "—"}</span></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-primary shrink-0" />
                          <span>{format(new Date(booking.returnDate), "MMM d, yyyy")}{booking.returnTime ? ` at ${booking.returnTime}` : ""}</span>
                        </div>
                        {customer && (
                          <div className="flex items-center gap-1.5">
                            <User className="h-3 w-3 text-primary shrink-0" />
                            <span>{customer.name ?? "Unknown"} · {customer.email ?? "—"}{customer.phone ? ` · ${customer.phone}` : ""}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <span>Total: <span className="text-primary font-semibold">${booking.totalAmount}</span></span>
                        </div>
                      </div>

                      {/* Cancellation reason */}
                      {booking.cancellationReason && (
                        <div className="text-xs bg-destructive/10 text-destructive border border-destructive/20 rounded px-2 py-1">
                          Cancellation reason: {booking.cancellationReason}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Admin Cancel Dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">As admin, you must provide a reason for cancellation. This will be visible to the customer.</p>
            <div className="space-y-1.5">
              <Label className="text-xs">Cancellation Reason *</Label>
              <textarea
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                rows={3}
                placeholder="e.g. Car requires unexpected maintenance..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setCancelOpen(false)} className="cursor-pointer">Back</Button>
            <Button variant="destructive" onClick={handleAdminCancel} disabled={cancelLoading} className="cursor-pointer">
              {cancelLoading ? "Cancelling..." : "Cancel Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Booking Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Booking for Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Customer</Label>
              <Select value={nbUserId} onValueChange={setNbUserId}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  {(users ?? []).map((u) => (
                    <SelectItem key={u._id} value={u._id}>{u.name ?? "Unknown"} — {u.email ?? "No email"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Car</Label>
              <Select value={nbCarId} onValueChange={setNbCarId}>
                <SelectTrigger><SelectValue placeholder="Select car" /></SelectTrigger>
                <SelectContent>
                  {(cars ?? []).map((c) => (
                    <SelectItem key={c._id} value={c._id}>{c.year} {c.make} {c.model} — ${c.dailyRate}/day</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Pickup Location</Label>
                <Select value={nbPickupLocationId} onValueChange={setNbPickupLocationId}>
                  <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                  <SelectContent>
                    {(locations ?? []).map((loc) => <SelectItem key={loc._id} value={loc._id}>{loc.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Drop-off Location</Label>
                <Select value={nbDropoffLocationId} onValueChange={setNbDropoffLocationId}>
                  <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                  <SelectContent>
                    {(locations ?? []).map((loc) => <SelectItem key={loc._id} value={loc._id}>{loc.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Pickup Date</Label>
                <Input type="date" min={today} value={nbPickupDate} onChange={(e) => setNbPickupDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Pickup Time</Label>
                <Select value={nbPickupTime} onValueChange={setNbPickupTime}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIME_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
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
                  <SelectContent>{TIME_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {(services ?? []).length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs">Additional Services</Label>
                <div className="space-y-2">
                  {(services ?? []).map((svc) => (
                    <div key={svc._id} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer ${nbSelectedServices.includes(svc._id) ? "border-primary/50 bg-primary/5" : "border-border/50"}`} onClick={() => toggleService(svc._id)}>
                      <Checkbox checked={nbSelectedServices.includes(svc._id)} onCheckedChange={() => toggleService(svc._id)} />
                      <span className="flex-1 text-sm">{svc.name}</span>
                      <span className="text-xs text-primary">+${svc.dailyRate}/day</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <textarea className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" rows={2} placeholder="Special notes..." value={nbNotes} onChange={(e) => setNbNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setCreateOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleCreateBooking} disabled={nbLoading} className="cursor-pointer">{nbLoading ? "Creating..." : "Create Booking"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
