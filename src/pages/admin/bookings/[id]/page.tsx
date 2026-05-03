import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { motion } from "motion/react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  ArrowLeft, MapPin, Calendar, Car, Receipt, Package,
  LogIn, LogOut, Gauge, Fuel, FileText, Camera,
  User, Mail, Phone, Clock, AlertCircle, CheckCircle,
  XCircle, Info
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-primary/20 text-primary border-primary/30",
  checked_in: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  checked_out: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4" />,
  confirmed: <CheckCircle className="h-4 w-4" />,
  checked_in: <LogIn className="h-4 w-4" />,
  checked_out: <LogOut className="h-4 w-4" />,
  completed: <CheckCircle className="h-4 w-4" />,
  cancelled: <XCircle className="h-4 w-4" />,
};

const FUEL_LABELS: Record<string, string> = {
  empty: "Empty", quarter: "1/4 Tank", half: "1/2 Tank",
  three_quarter: "3/4 Tank", full: "Full Tank",
};

const CAR_IMAGES: Record<string, string> = {
  economy: "https://images.unsplash.com/photo-1690278289651-895463644114?w=800&q=80",
  sedan: "https://images.unsplash.com/photo-1679891647402-330589ea9309?w=800&q=80",
  suv: "https://images.unsplash.com/photo-1742869246328-847a516cd30a?w=800&q=80",
  luxury: "https://images.unsplash.com/photo-1650716748498-a2ce13ed0f2d?w=800&q=80",
  sports: "https://images.unsplash.com/photo-1683916138305-98a86efc9fc9?w=800&q=80",
  compact: "https://images.unsplash.com/photo-1647708790575-05985b7f670c?w=800&q=80",
  van: "https://images.unsplash.com/photo-1701918190763-3851cf361f96?w=800&q=80",
};

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="p-1.5 bg-primary/10 rounded-lg text-primary">{icon}</div>
      <h2 className="font-semibold text-base">{title}</h2>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2.5 border-b border-border/30 last:border-0">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

export default function AdminBookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const detail = useQuery(
    api.bookings.getDetailById,
    id ? { bookingId: id as Id<"bookings"> } : "skip"
  );
  const inspections = useQuery(
    api.inspections.listByBooking,
    id ? { bookingId: id as Id<"bookings"> } : "skip"
  );
  const allUsers = useQuery(api.users.listUsers, {});

  if (!id) {
    navigate("/admin/bookings");
    return null;
  }

  if (detail === undefined || inspections === undefined) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-56 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Booking not found.</p>
        <Button onClick={() => navigate("/admin/bookings")} className="cursor-pointer">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Bookings
        </Button>
      </div>
    );
  }

  const { booking, car, pickupLocation, dropoffLocation, services, days, baseAmount, servicesAmount } = detail;
  const taxRate = 0.1;
  const taxAmount = (baseAmount + servicesAmount) * taxRate;
  const totalWithTax = baseAmount + servicesAmount + taxAmount;

  const carImg = car?.resolvedImageUrls?.[0] ?? (car ? CAR_IMAGES[car.category] : undefined);
  const checkIn = inspections?.find((i) => i.type === "check_in");
  const checkOut = inspections?.find((i) => i.type === "check_out");

  // Find full user profile from admin listUsers (includes phone)
  const customer = allUsers?.find((u) => u._id === booking.userId);

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-6"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/bookings")}
          className="cursor-pointer -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Bookings
        </Button>
        <span className="text-muted-foreground text-sm font-mono">#{booking._id.slice(-8).toUpperCase()}</span>
        <div className="flex-1" />
        <Badge className={`text-xs border flex items-center gap-1.5 capitalize ${STATUS_COLORS[booking.status] ?? ""}`}>
          {STATUS_ICONS[booking.status]}
          {booking.status.replace(/_/g, " ")}
        </Badge>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="space-y-4"
      >
        {/* Car Hero */}
        <Card className="border-border/50 bg-card/60 overflow-hidden pt-0">
          {carImg && (
            <div className="relative h-48 sm:h-56 w-full overflow-hidden">
              <img src={carImg} alt={car ? `${car.make} ${car.model}` : "Car"} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h1 className="text-xl sm:text-2xl font-bold text-white drop-shadow">
                  {car ? `${car.year} ${car.make} ${car.model}` : "Vehicle"}
                </h1>
                {car && (
                  <p className="text-sm text-white/70 capitalize mt-0.5">
                    {car.category} · {car.transmission} · {car.seats} seats · <span className="text-primary font-medium">${car.dailyRate}/day</span>
                  </p>
                )}
              </div>
            </div>
          )}
          {/* Extra car images */}
          {car?.resolvedImageUrls && car.resolvedImageUrls.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto">
              {car.resolvedImageUrls.slice(1).map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  <img src={url} alt={`Car photo ${i + 2}`} className="h-16 w-24 object-cover rounded-lg shrink-0 hover:opacity-80 transition-opacity cursor-pointer border border-border/30" />
                </a>
              ))}
            </div>
          )}
        </Card>

        {/* Cancellation notice */}
        {booking.status === "cancelled" && (
          <div className={`rounded-xl border px-4 py-3 text-sm flex items-start gap-2 ${
            booking.cancelledBy === "admin"
              ? "bg-destructive/10 border-destructive/30 text-destructive"
              : "bg-muted/40 border-border/50 text-muted-foreground"
          }`}>
            <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
            {booking.cancelledBy === "admin" && booking.cancellationReason
              ? <span><strong>Cancelled by admin:</strong> {booking.cancellationReason}</span>
              : booking.cancelledBy === "user"
              ? <span>Cancelled by customer.</span>
              : <span>This booking was cancelled.</span>}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer Info */}
          <Card className="border-border/50 bg-card/60">
            <CardHeader className="pb-2 pt-5 px-5">
              <SectionTitle icon={<User className="h-4 w-4" />} title="Customer Information" />
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0">
              {customer ? (
                <>
                  <InfoRow label="Full Name" value={customer.name ?? "—"} />
                  <InfoRow
                    label="Email"
                    value={
                      <span className="flex items-center gap-1 justify-end">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {customer.email ?? "—"}
                      </span>
                    }
                  />
                  <InfoRow
                    label="Phone"
                    value={
                      <span className="flex items-center gap-1 justify-end">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {customer.phone ?? "—"}
                      </span>
                    }
                  />
                </>
              ) : (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Booking Details */}
          <Card className="border-border/50 bg-card/60">
            <CardHeader className="pb-2 pt-5 px-5">
              <SectionTitle icon={<Info className="h-4 w-4" />} title="Booking Details" />
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0">
              <InfoRow label="Created" value={format(new Date(booking._creationTime), "MMM d, yyyy")} />
              <InfoRow
                label="Pickup Location"
                value={
                  <span className="flex items-center gap-1 justify-end">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    {pickupLocation?.name ?? "—"}
                  </span>
                }
              />
              <InfoRow
                label="Drop-off Location"
                value={
                  <span className="flex items-center gap-1 justify-end">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {dropoffLocation?.name ?? "—"}
                  </span>
                }
              />
              <InfoRow
                label="Pickup"
                value={
                  <span className="flex items-center gap-1 justify-end">
                    <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                    {format(new Date(booking.pickupDate), "MMM d, yyyy")}
                    {booking.pickupTime && <span className="text-muted-foreground"> {booking.pickupTime}</span>}
                  </span>
                }
              />
              <InfoRow
                label="Drop-off"
                value={
                  <span className="flex items-center gap-1 justify-end">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {format(new Date(booking.returnDate), "MMM d, yyyy")}
                    {booking.returnTime && <span className="text-muted-foreground"> {booking.returnTime}</span>}
                  </span>
                }
              />
              <InfoRow label="Duration" value={`${days} day${days !== 1 ? "s" : ""}`} />
              {booking.notes && (
                <InfoRow label="Notes" value={<span className="text-muted-foreground">{booking.notes}</span>} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Billing */}
        <Card className="border-border/50 bg-card/60">
          <CardHeader className="pb-2 pt-5 px-5">
            <SectionTitle icon={<Receipt className="h-4 w-4" />} title="Billing Summary" />
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <div className="max-w-sm space-y-0">
              <InfoRow
                label={`Base Rate (${days}d × $${car?.dailyRate ?? 0}/day)`}
                value={`$${baseAmount.toFixed(2)}`}
              />
              {services.length > 0 && (
                <InfoRow
                  label={`Add-on Services (${days}d)`}
                  value={`$${servicesAmount.toFixed(2)}`}
                />
              )}
              <InfoRow label="Tax (10%)" value={`$${taxAmount.toFixed(2)}`} />
              <div className="flex justify-between items-center pt-3 mt-1">
                <span className="font-semibold text-base">Total</span>
                <span className="font-bold text-lg text-primary">${totalWithTax.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Services */}
        {services.length > 0 && (
          <Card className="border-border/50 bg-card/60">
            <CardHeader className="pb-2 pt-5 px-5">
              <SectionTitle icon={<Package className="h-4 w-4" />} title="Add-on Services" />
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {services.map((svc) => (
                  <div key={svc._id} className="flex items-center justify-between bg-muted/30 rounded-xl px-4 py-3 border border-border/30">
                    <div>
                      <p className="text-sm font-medium">{svc.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{svc.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-primary">${svc.dailyRate}/day</p>
                      <p className="text-xs text-muted-foreground">${(svc.dailyRate * days).toFixed(2)} total</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Check-in / Check-out History */}
        {inspections && inspections.length > 0 && (
          <Card className="border-border/50 bg-card/60">
            <CardHeader className="pb-2 pt-5 px-5">
              <SectionTitle icon={<Car className="h-4 w-4" />} title="Check-in / Check-out History" />
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0 space-y-4">
              {[checkIn, checkOut].filter(Boolean).map((insp) => {
                if (!insp) return null;
                const isCheckIn = insp.type === "check_in";
                return (
                  <div key={insp._id} className="rounded-xl border border-border/40 bg-muted/20 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${isCheckIn ? "bg-primary/10 text-primary" : "bg-blue-500/10 text-blue-400"}`}>
                        {isCheckIn ? <LogIn className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{isCheckIn ? "Check-In (Pickup)" : "Check-Out (Return)"}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(insp._creationTime), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-background/50 rounded-lg px-3 py-2.5 border border-border/30">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                          <Gauge className="h-3 w-3" /> Mileage
                        </div>
                        <p className="text-sm font-semibold">{insp.mileage.toLocaleString()} km</p>
                      </div>
                      <div className="bg-background/50 rounded-lg px-3 py-2.5 border border-border/30">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                          <Fuel className="h-3 w-3" /> Fuel Level
                        </div>
                        <p className="text-sm font-semibold">{FUEL_LABELS[insp.fuelLevel] ?? insp.fuelLevel}</p>
                      </div>
                    </div>
                    {insp.notes && (
                      <div className="flex items-start gap-2 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{insp.notes}</span>
                      </div>
                    )}
                    {insp.resolvedImageUrls && insp.resolvedImageUrls.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Camera className="h-3.5 w-3.5" />
                          <span>Condition Photos ({insp.resolvedImageUrls.length})</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {insp.resolvedImageUrls.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                              <img
                                src={url}
                                alt={`Photo ${i + 1}`}
                                className="h-20 w-28 object-cover rounded-lg hover:opacity-80 transition-opacity border border-border/30 cursor-pointer"
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Vehicle Specs */}
        {car && (
          <Card className="border-border/50 bg-card/60">
            <CardHeader className="pb-2 pt-5 px-5">
              <SectionTitle icon={<Car className="h-4 w-4" />} title="Vehicle Specifications" />
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Make", value: car.make },
                  { label: "Model", value: car.model },
                  { label: "Year", value: car.year },
                  { label: "Category", value: car.category },
                  { label: "Transmission", value: car.transmission },
                  { label: "Seats", value: `${car.seats} seats` },
                  { label: "Fuel Type", value: car.fuelType },
                  { label: "Daily Rate", value: `$${car.dailyRate}/day` },
                ].map((spec) => (
                  <div key={spec.label} className="bg-muted/30 rounded-lg px-3 py-2.5 border border-border/30">
                    <p className="text-xs text-muted-foreground mb-0.5">{spec.label}</p>
                    <p className="text-sm font-medium capitalize">{spec.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
