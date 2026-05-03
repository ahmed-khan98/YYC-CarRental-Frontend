import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { format } from "date-fns";
import {
  CarFront, LogIn, LogOut, User, MapPin, Calendar,
  Gauge, Fuel, FileText, Camera, Phone, Mail, Clock,
  ChevronDown, ChevronUp, Eye
} from "lucide-react";

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

function BookingDetailRow({ booking }: { booking: BookingRowType }) {
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
          {car === undefined ? (
            <Skeleton className="w-16 h-11 rounded-lg shrink-0" />
          ) : carImg ? (
            <img src={carImg} alt="Car" className="w-16 h-11 object-cover rounded-lg shrink-0" />
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

          <div className="flex items-center gap-2 shrink-0">
            <Badge className={`text-xs border capitalize ${STATUS_COLORS[booking.status] ?? ""}`}>
              {booking.status.replace(/_/g, " ")}
            </Badge>
            <button className="text-muted-foreground hover:text-foreground cursor-pointer p-1">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Expanded view-only details */}
        {expanded && (
          <div className="border-t border-border/40 p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Customer info */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Customer
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
                  <CarFront className="h-3.5 w-3.5" /> Vehicle
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
                  <Calendar className="h-3.5 w-3.5" /> Booking
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

            {/* Check-in / Check-out records — view only */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5" /> Inspection Records
              </p>
              {!inspections ? (
                <Skeleton className="h-20 w-full rounded-xl" />
              ) : inspections.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">No inspection records yet.</p>
              ) : (
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
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminCheckInOutPage() {
  const bookings = useQuery(api.bookings.adminList, {});

  const checkedInBookings = (bookings ?? []).filter((b) => b.status === "checked_in") as BookingRowType[];
  const confirmedBookings = (bookings ?? []).filter((b) => b.status === "confirmed") as BookingRowType[];
  const completedRecently = (bookings ?? [])
    .filter((b) => b.status === "completed")
    .sort((a, b) => b._creationTime - a._creationTime)
    .slice(0, 10) as BookingRowType[];

  const stats = [
    { label: "Awaiting Check-in", value: confirmedBookings.length, color: "text-primary" },
    { label: "Currently Out", value: checkedInBookings.length, color: "text-blue-400" },
    { label: "Completed (recent)", value: completedRecently.length, color: "text-green-400" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Check In / Check Out</h2>
          <p className="text-muted-foreground text-sm flex items-center gap-1.5 mt-0.5">
            <Eye className="h-3.5 w-3.5" /> View-only — check-in/out actions are performed by customers
          </p>
        </div>
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

      {/* Awaiting Check-in */}
      {confirmedBookings.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Awaiting Check-in</h3>
          {confirmedBookings.map((b) => <BookingDetailRow key={b._id} booking={b} />)}
        </div>
      )}

      {/* Currently Checked In */}
      {checkedInBookings.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Currently Out</h3>
          {checkedInBookings.map((b) => <BookingDetailRow key={b._id} booking={b} />)}
        </div>
      )}

      {/* Recently Completed */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Recently Completed</h3>
        {bookings === undefined ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
        ) : completedRecently.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground text-sm">No completed rentals yet</p>
            </CardContent>
          </Card>
        ) : (
          completedRecently.map((b) => <BookingDetailRow key={b._id} booking={b} />)
        )}
      </div>
    </div>
  );
}
