import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  CarFront, CheckCircle, LogIn, LogOut, User, MapPin, Calendar,
  Gauge, Fuel, FileText, Camera, Upload, X, Phone, Mail,
  ChevronDown, ChevronUp, Clock
} from "lucide-react";

type FuelLevel = "empty" | "quarter" | "half" | "three_quarter" | "full";

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-primary/20 text-primary border-primary/30",
  checked_in: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  checked_out: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

const FUEL_LABELS: Record<string, string> = {
  empty: "Empty", quarter: "1/4 Tank", half: "1/2 Tank",
  three_quarter: "3/4 Tank", full: "Full Tank",
};

const CAR_IMAGES: Record<string, string> = {
  economy: "https://images.unsplash.com/photo-1690278289651-895463644114?w=400&q=80",
  sedan: "https://images.unsplash.com/photo-1679891647402-330589ea9309?w=400&q=80",
  suv: "https://images.unsplash.com/photo-1742869246328-847a516cd30a?w=400&q=80",
  luxury: "https://images.unsplash.com/photo-1650716748498-a2ce13ed0f2d?w=400&q=80",
  sports: "https://images.unsplash.com/photo-1683916138305-98a86efc9fc9?w=400&q=80",
  compact: "https://images.unsplash.com/photo-1647708790575-05985b7f670c?w=400&q=80",
  van: "https://images.unsplash.com/photo-1701918190763-3851cf361f96?w=400&q=80",
};

// ─── Booking Row ────────────────────────────────────────────────────────────

type BookingRowType = {
  _id: Id<"bookings">;
  carId: Id<"cars">;
  userId: Id<"users">;
  pickupLocationId: Id<"locations">;
  dropoffLocationId: Id<"locations">;
  pickupDate: string;
  pickupTime?: string;
  returnDate: string;
  returnTime?: string;
  status: string;
  totalAmount: number;
  _creationTime: number;
};

function BookingDetailRow({ booking, onAction }: { booking: BookingRowType; onAction: (b: BookingRowType, t: "check_in" | "check_out") => void }) {
  const car = useQuery(api.cars.get, { carId: booking.carId });
  const allUsers = useQuery(api.users.listUsers, {});
  const pickupLocation = useQuery(api.locations.get, { locationId: booking.pickupLocationId });
  const dropoffLocation = useQuery(api.locations.get, { locationId: booking.dropoffLocationId });
  const inspections = useQuery(api.inspections.listByBooking, { bookingId: booking._id });
  const [expanded, setExpanded] = useState(false);

  const customer = allUsers?.find((u) => u._id === booking.userId);
  const carImg = car?.resolvedImageUrls?.[0] ?? car?.imageUrl ?? (car ? CAR_IMAGES[car.category] : undefined);

  const checkIn = inspections?.find((i) => i.type === "check_in");
  const checkOut = inspections?.find((i) => i.type === "check_out");

  return (
    <Card className="border-border/50 bg-card/50">
      <CardContent className="p-0">
        {/* Summary row */}
        <div
          className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/20 transition-colors rounded-xl"
          onClick={() => setExpanded(!expanded)}
        >
          {/* Car image */}
          {car === undefined ? (
            <Skeleton className="w-16 h-11 rounded-lg shrink-0" />
          ) : carImg ? (
            <img src={carImg} alt={car ? `${car.make} ${car.model}` : "Car"} className="w-16 h-11 object-cover rounded-lg shrink-0" />
          ) : (
            <div className="w-16 h-11 bg-muted rounded-lg shrink-0 flex items-center justify-center">
              <CarFront className="h-5 w-5 text-muted-foreground" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">
              {car ? `${car.year} ${car.make} ${car.model}` : <Skeleton className="h-4 w-32 inline-block" />}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {customer?.name ?? "Loading..."} · {format(new Date(booking.pickupDate), "MMM d")} – {format(new Date(booking.returnDate), "MMM d, yyyy")}
            </p>
          </div>

          <Badge className={`text-xs border capitalize shrink-0 ${STATUS_COLORS[booking.status] ?? ""}`}>
            {booking.status.replace(/_/g, " ")}
          </Badge>

          <div className="flex items-center gap-1.5 shrink-0">
            {booking.status === "confirmed" && (
              <Button
                size="sm"
                className="h-7 text-xs cursor-pointer"
                onClick={(e) => { e.stopPropagation(); onAction(booking, "check_in"); }}
              >
                <LogIn className="h-3 w-3 mr-1" /> Check In
              </Button>
            )}
            {booking.status === "checked_in" && (
              <Button
                size="sm"
                variant="secondary"
                className="h-7 text-xs cursor-pointer"
                onClick={(e) => { e.stopPropagation(); onAction(booking, "check_out"); }}
              >
                <LogOut className="h-3 w-3 mr-1" /> Check Out
              </Button>
            )}
            <button className="text-muted-foreground hover:text-foreground cursor-pointer p-1">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="border-t border-border/40 p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* User info */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Customer Info
                </p>
                {customer ? (
                  <div className="bg-muted/30 rounded-xl p-3 border border-border/30 space-y-1.5">
                    <p className="text-sm font-medium">{customer.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Mail className="h-3 w-3 shrink-0" /> {customer.email ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Phone className="h-3 w-3 shrink-0" /> {customer.phone ?? "—"}
                    </p>
                  </div>
                ) : (
                  <Skeleton className="h-16 w-full rounded-xl" />
                )}
              </div>

              {/* Car info */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <CarFront className="h-3.5 w-3.5" /> Vehicle Info
                </p>
                {car ? (
                  <div className="bg-muted/30 rounded-xl p-3 border border-border/30 space-y-1.5">
                    <p className="text-sm font-medium">{car.year} {car.make} {car.model}</p>
                    <p className="text-xs text-muted-foreground capitalize">{car.category} · {car.transmission}</p>
                    <p className="text-xs text-primary font-semibold">${car.dailyRate}/day</p>
                  </div>
                ) : (
                  <Skeleton className="h-16 w-full rounded-xl" />
                )}
              </div>

              {/* Booking info */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Booking Info
                </p>
                <div className="bg-muted/30 rounded-xl p-3 border border-border/30 space-y-1.5 text-xs">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Pickup: <span className="text-foreground">{pickupLocation?.name ?? "—"}</span></span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <MapPin className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Drop-off: <span className="text-foreground">{dropoffLocation?.name ?? "—"}</span></span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Clock className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      {format(new Date(booking.pickupDate), "MMM d")}{booking.pickupTime ? ` ${booking.pickupTime}` : ""} → {format(new Date(booking.returnDate), "MMM d")}{booking.returnTime ? ` ${booking.returnTime}` : ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Check-in / Check-out records */}
            {inspections && inspections.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="h-3.5 w-3.5" /> Inspection History
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[checkIn, checkOut].filter(Boolean).map((insp) => {
                    if (!insp) return null;
                    const isCI = insp.type === "check_in";
                    return (
                      <div key={insp._id} className="rounded-xl border border-border/40 bg-background/40 p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded-lg ${isCI ? "bg-primary/10 text-primary" : "bg-blue-500/10 text-blue-400"}`}>
                            {isCI ? <LogIn className="h-3.5 w-3.5" /> : <LogOut className="h-3.5 w-3.5" />}
                          </div>
                          <div>
                            <p className="text-xs font-semibold">{isCI ? "Check-In" : "Check-Out"}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(insp._creationTime), "MMM d, yyyy h:mm a")}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Gauge className="h-3 w-3 shrink-0" />
                            <span><span className="text-foreground">{insp.mileage.toLocaleString()}</span> km</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Fuel className="h-3 w-3 shrink-0" />
                            <span className="text-foreground">{FUEL_LABELS[insp.fuelLevel] ?? insp.fuelLevel}</span>
                          </div>
                        </div>
                        {insp.notes && (
                          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <FileText className="h-3 w-3 shrink-0 mt-0.5" />
                            <span>{insp.notes}</span>
                          </div>
                        )}
                        {insp.resolvedImageUrls && insp.resolvedImageUrls.length > 0 && (
                          <div className="flex gap-1.5 flex-wrap">
                            {insp.resolvedImageUrls.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                <img src={url} alt={`Photo ${i + 1}`} className="h-14 w-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity border border-border/30" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Check-in/out Dialog ─────────────────────────────────────────────────────

function CheckInOutDialog({
  open, onClose, booking, type, cars,
}: {
  open: boolean;
  onClose: () => void;
  booking: BookingRowType | null;
  type: "check_in" | "check_out";
  cars: Array<{ _id: string; make: string; model: string; [key: string]: unknown }>;
}) {
  const generateUploadUrl = useMutation(api.inspections.generateUploadUrl);
  const createInspection = useMutation(api.inspections.create);
  const updateBooking = useMutation(api.bookings.updateStatus);
  const updateCar = useMutation(api.cars.update);

  const [mileage, setMileage] = useState("");
  const [fuelLevel, setFuelLevel] = useState<FuelLevel>("full");
  const [notes, setNotes] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 5);
    setImageFiles(files);
    setImagePreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const handleClose = () => {
    setMileage(""); setFuelLevel("full"); setNotes("");
    setImageFiles([]); setImagePreviews([]);
    onClose();
  };

  const handleSubmit = async () => {
    if (!booking || !mileage) { toast.error("Please fill all required fields"); return; }
    setLoading(true);
    try {
      const storageIds: Id<"_storage">[] = [];
      for (const file of imageFiles) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = await result.json() as { storageId: Id<"_storage"> };
        storageIds.push(storageId);
      }

      await createInspection({
        carId: booking.carId,
        bookingId: booking._id,
        type,
        mileage: Number(mileage),
        fuelLevel,
        notes: notes || undefined,
        imageStorageIds: storageIds.length > 0 ? storageIds : undefined,
      });

      const newStatus = type === "check_in" ? "checked_in" : "checked_out";
      await updateBooking({ bookingId: booking._id, status: newStatus });

      if (type === "check_out") {
        await updateCar({ carId: booking.carId, isAvailable: true, mileage: Number(mileage) });
      } else {
        await updateCar({ carId: booking.carId, isAvailable: false });
      }

      toast.success(`${type === "check_in" ? "Check-in" : "Check-out"} recorded successfully`);
      handleClose();
    } catch {
      toast.error("Failed to record inspection");
    } finally {
      setLoading(false);
    }
  };

  const car = booking ? cars.find((c) => c._id === booking.carId) : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === "check_in"
              ? <LogIn className="h-5 w-5 text-primary" />
              : <LogOut className="h-5 w-5 text-blue-400" />}
            {type === "check_in" ? "Vehicle Check-In" : "Vehicle Check-Out"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          {booking && car && (
            <div className="bg-muted/30 rounded-xl px-3 py-2 border border-border/30 text-sm">
              <span className="font-medium">{(car as { make: string; model: string }).make} {(car as { make: string; model: string }).model}</span>
              <span className="text-muted-foreground"> · #{booking._id.slice(-6).toUpperCase()}</span>
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs">Current Mileage (km) *</Label>
            <Input type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} placeholder="e.g. 45000" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Fuel Level</Label>
            <Select value={fuelLevel} onValueChange={(v) => setFuelLevel(v as FuelLevel)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["empty","quarter","half","three_quarter","full"] as const).map((f) => (
                  <SelectItem key={f} value={f}>{FUEL_LABELS[f]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Condition Photos (optional, up to 5)</Label>
            <div
              className="border-2 border-dashed border-border/50 rounded-xl p-3 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {imagePreviews.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {imagePreviews.map((src, i) => (
                    <img key={i} src={src} alt={`Car ${i + 1}`} className="w-full h-16 object-cover rounded" />
                  ))}
                </div>
              ) : (
                <div className="text-center py-2 text-muted-foreground">
                  <Upload className="h-4 w-4 mx-auto mb-1" />
                  <p className="text-xs">Upload photos</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
            {imagePreviews.length > 0 && (
              <button
                onClick={() => { setImageFiles([]); setImagePreviews([]); if (fileRef.current) fileRef.current.value = ""; }}
                className="text-xs text-muted-foreground hover:text-destructive cursor-pointer flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Clear photos
              </button>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <textarea
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any scratches, damage, or notes..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={handleClose} className="cursor-pointer">Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="cursor-pointer">
            {loading ? "Recording..." : `Record ${type === "check_in" ? "Check-In" : "Check-Out"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AdminCheckInOutPage() {
  const bookings = useQuery(api.bookings.adminList, {});
  const cars = useQuery(api.cars.list, {});

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"check_in" | "check_out">("check_in");
  const [selectedBooking, setSelectedBooking] = useState<BookingRowType | null>(null);

  const activeBookings = (bookings ?? []).filter((b) =>
    b.status === "confirmed" || b.status === "checked_in"
  ) as BookingRowType[];

  const checkedInBookings = activeBookings.filter((b) => b.status === "checked_in");
  const confirmedBookings = activeBookings.filter((b) => b.status === "confirmed");

  const openDialog = (booking: BookingRowType, type: "check_in" | "check_out") => {
    setSelectedBooking(booking);
    setDialogType(type);
    setDialogOpen(true);
  };

  const stats = [
    { label: "Awaiting Check-in", value: confirmedBookings.length, color: "text-primary" },
    { label: "Currently Checked In", value: checkedInBookings.length, color: "text-blue-400" },
    { label: "Total Active", value: activeBookings.length, color: "text-foreground" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Check In / Check Out</h2>
        <p className="text-muted-foreground text-sm">Track and manage vehicle handovers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-border/50 bg-card/40 text-center py-4">
            <CardContent className="p-0">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Rentals */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-base">Active Rentals</h3>
          <span className="text-xs text-muted-foreground">Click a row to expand full details</span>
        </div>

        {bookings === undefined ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
        ) : activeBookings.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="py-10 text-center">
              <CheckCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No active rentals at the moment</p>
            </CardContent>
          </Card>
        ) : (
          activeBookings.map((booking) => (
            <BookingDetailRow
              key={booking._id}
              booking={booking}
              onAction={openDialog}
            />
          ))
        )}
      </div>

      <CheckInOutDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        booking={selectedBooking}
        type={dialogType}
        cars={cars ?? []}
      />
    </div>
  );
}
