import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { bookingsApi } from "@/api/bookings.api.ts";
import { inspectionsApi } from "@/api/inspections.api.ts";
import { Authenticated, Unauthenticated, AuthLoading } from "@/components/auth-gate.tsx";
import Navbar from "@/components/navbar.tsx";
import Footer from "@/components/footer.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import {
  BookingDetailCard,
  BookingDetailCardContent,
  BookingDetailCardHeader,
  BookingVehicleCard,
  InfoRow,
  SectionTitle,
} from "@/components/booking-detail-ui.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { motion } from "motion/react";
import { format } from "date-fns";
import { formatRentalDays } from "@/lib/rentalPricing.ts";
import { computeBillSummary } from "@/lib/billing.ts";
import { CancelledAmountDueBanner } from "@/components/cancelled-amount-due.tsx";
import { BookingBillPanel } from "@/components/booking-bill-panel.tsx";
import { calculateServiceCharge, formatServiceRateLabel } from "@/lib/serviceCharge.ts";
import { isExtraDriverService } from "@/lib/extraDriver.ts";
import { formatTime12h } from "@/lib/timeFormat.ts";
import { BookingStatusStepper } from "@/components/booking-status-stepper.tsx";
import { InspectionHistoryGrid, pickLatestInspection } from "@/components/inspection-history-grid.tsx";
import {
  ArrowLeft, MapPin, Calendar, Clock, Car, Package,
  LogIn, LogOut, CheckCircle,
  XCircle, AlertCircle, Info
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

const CAR_IMAGES: Record<string, string> = {
  economy: "https://images.unsplash.com/photo-1690278289651-895463644114?w=800&q=80",
  sedan: "https://images.unsplash.com/photo-1679891647402-330589ea9309?w=800&q=80",
  suv: "https://images.unsplash.com/photo-1742869246328-847a516cd30a?w=800&q=80",
  luxury: "https://images.unsplash.com/photo-1650716748498-a2ce13ed0f2d?w=800&q=80",
  sports: "https://images.unsplash.com/photo-1683916138305-98a86efc9fc9?w=800&q=80",
  compact: "https://images.unsplash.com/photo-1647708790575-05985b7f670c?w=800&q=80",
  van: "https://images.unsplash.com/photo-1701918190763-3851cf361f96?w=800&q=80",
};

function BookingDetailInner({ bookingId }: { bookingId: string }) {
  const navigate = useNavigate();
  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["bookings", bookingId, "detail"],
    queryFn: () => bookingsApi.getDetailById(bookingId),
  });
  const { data: inspections, isLoading: inspectionsLoading } = useQuery({
    queryKey: ["inspections", bookingId],
    queryFn: () => inspectionsApi.listByBooking(bookingId),
  });

  if (detailLoading || inspectionsLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Booking not found or you don't have access.</p>
        <Button onClick={() => navigate("/dashboard")} className="cursor-pointer">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  const {
    booking,
    car,
    pickupLocation,
    dropoffLocation,
    services,
    days,
    baseAmount,
    servicesAmount,
    extraMileageCharge = 0,
    extraMileageKm,
    billEntries = [],
    billSummary,
  } = detail;
  const resolvedBillSummary = billSummary ?? computeBillSummary(billEntries);

  const carImg = car?.resolvedImageUrls?.[0] ?? (car ? CAR_IMAGES[car.category] : undefined);

  const checkIn = pickLatestInspection(inspections, "check_in");
  const checkOut = pickLatestInspection(inspections, "check_out");
  const hasExtraDriver = services.some(isExtraDriverService);
  const extraDriverNames = booking.extraDriverNames ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-5 sm:mb-6"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="cursor-pointer -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
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
        className="space-y-6 md:space-y-4"
      >
        {car && (
          <BookingVehicleCard car={car} imageUrl={carImg} />
        )}

        {booking.status !== "cancelled" && (
          <BookingStatusStepper status={booking.status} />
        )}

        {booking.status === "cancelled" && (
          <div className={`rounded-xl border px-4 py-3 text-sm flex items-start gap-2 ${
            booking.cancelledBy === "admin"
              ? "bg-destructive/10 border-destructive/30 text-destructive"
              : "bg-muted/40 border-border/50 text-muted-foreground"
          }`}>
            <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              {booking.cancelledBy === "admin" && booking.cancellationReason
                ? <><strong>Cancelled by admin:</strong> {booking.cancellationReason}</>
                : booking.cancelledBy === "user"
                ? <>
                    You cancelled this booking.
                    {booking.cancellationPolicy === "one_day_fee" && " 1-day cancellation fee applies."}
                    {booking.cancellationPolicy === "non_refundable" && " Full booking amount applies (within 72 hours of pick-up)."}
                  </>
                : "This booking was cancelled."}
            </div>
          </div>
        )}

        {booking.status === "cancelled" && (
          <CancelledAmountDueBanner
            booking={booking}
            balanceDue={resolvedBillSummary.totalUnpaid}
            variant="customer"
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-4">
          <BookingDetailCard>
            <BookingDetailCardHeader>
              <SectionTitle icon={<Info className="h-4 w-4" />} title="Booking Details" />
            </BookingDetailCardHeader>
            <BookingDetailCardContent>
              <InfoRow label="Booking ID" value={
                <span className="font-mono text-xs text-muted-foreground">{booking._id.slice(-8).toUpperCase()}</span>
              } />
              <InfoRow label="Created" value={format(new Date(booking._creationTime), "MMM d, yyyy 'at' h:mm a")} />
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
                    {booking.pickupTime && (
                      <span className="text-muted-foreground"> {formatTime12h(booking.pickupTime)}</span>
                    )}
                  </span>
                }
              />
              <InfoRow
                label="Drop-off"
                value={
                  <span className="flex items-center gap-1 justify-end">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {format(new Date(booking.returnDate), "MMM d, yyyy")}
                    {booking.returnTime && (
                      <span className="text-muted-foreground"> {formatTime12h(booking.returnTime)}</span>
                    )}
                  </span>
                }
              />
              <InfoRow label="Duration" value={formatRentalDays(days)} />
              {booking.notes && (
                <InfoRow label="Notes" value={<span className="text-muted-foreground">{booking.notes}</span>} />
              )}
            </BookingDetailCardContent>
          </BookingDetailCard>

          <div className="space-y-3">
            <BookingBillPanel
              billEntries={billEntries}
              billSummary={resolvedBillSummary}
              days={days}
              baseAmount={baseAmount}
              servicesAmount={servicesAmount}
              serviceLines={services.map((svc) => ({
                name: svc.quantity && svc.quantity > 1 ? `${svc.name} × ${svc.quantity}` : svc.name,
                amount: calculateServiceCharge(svc, days, svc.quantity ?? 1),
              }))}
              extraMileageCharge={extraMileageCharge}
              extraMileageKm={extraMileageKm ?? booking.extraMileageKm}
              chargePerExtraKm={car?.chargePerExtraKm ?? booking.bookedChargePerExtraKm}
              dailyRate={car?.dailyRate ?? booking.bookedDailyRate ?? 0}
              isCancelled={booking.status === "cancelled"}
            />
            <div className="rounded-xl border border-border/50 bg-card/60 px-4 py-3 shadow-sm">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Payment Status</span>
                <Badge variant="outline" className="capitalize text-xs">
                  {booking.paymentStatus ?? "pending"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {services.length > 0 && (
          <BookingDetailCard>
            <BookingDetailCardHeader>
              <SectionTitle icon={<Package className="h-4 w-4" />} title="Add-on Services" />
            </BookingDetailCardHeader>
            <BookingDetailCardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {services.map((svc) => (
                  <div key={svc._id} className="flex items-center justify-between bg-muted/30 rounded-xl px-4 py-3 border border-border/30">
                    <div>
                      <p className="text-sm font-medium">{svc.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {svc.category}
                        {(svc.quantity ?? 1) > 1 ? ` · Qty ${svc.quantity}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-primary">{formatServiceRateLabel(svc)}</p>
                      <p className="text-xs text-muted-foreground">
                        ${calculateServiceCharge(svc, days, svc.quantity ?? 1).toFixed(2)} total
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {hasExtraDriver && extraDriverNames.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border/40 space-y-2">
                  <p className="text-sm font-medium">Additional Drivers</p>
                  {extraDriverNames.map((name, index) => (
                    <div
                      key={`${name}-${index}`}
                      className="rounded-lg border border-border/30 bg-muted/20 px-3 py-2 text-sm"
                    >
                      Driver {index + 1}: <span className="font-medium">{name}</span>
                    </div>
                  ))}
                </div>
              )}
            </BookingDetailCardContent>
          </BookingDetailCard>
        )}

        {(booking.checkInVisibleToUser || booking.checkOutVisibleToUser) &&
          ((booking.checkInVisibleToUser && checkIn) || (booking.checkOutVisibleToUser && checkOut)) && (
          <BookingDetailCard>
            <BookingDetailCardHeader>
              <SectionTitle icon={<Car className="h-4 w-4" />} title="Check-in / Check-out History" />
            </BookingDetailCardHeader>
            <BookingDetailCardContent>
              <InspectionHistoryGrid
                checkIn={booking.checkInVisibleToUser ? checkIn : null}
                checkOut={booking.checkOutVisibleToUser ? checkOut : null}
                showCheckIn={Boolean(booking.checkInVisibleToUser)}
                showCheckOut={Boolean(booking.checkOutVisibleToUser)}
              />
            </BookingDetailCardContent>
          </BookingDetailCard>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={() => navigate("/dashboard")} className="cursor-pointer flex-1 sm:flex-none">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
          {car && (
            <Button variant="secondary" onClick={() => navigate(`/cars/${car._id}`)} className="cursor-pointer">
              <Car className="h-4 w-4 mr-2" /> View Car
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="pt-[4.5rem] flex-1">
        <AuthLoading>
          <div className="mx-auto max-w-3xl px-4 py-8 space-y-4">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-56 w-full rounded-2xl" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-48 w-full rounded-2xl" />
              <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
          </div>
        </AuthLoading>
        <Unauthenticated>
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="border-border/50 text-center py-12 px-8">
              <CardContent>
                <h3 className="text-lg font-semibold mb-2">Sign in to view booking details</h3>
                <SignInButton />
              </CardContent>
            </Card>
          </div>
        </Unauthenticated>
        <Authenticated>
          <BookingDetailInner bookingId={id} />
        </Authenticated>
      </div>
      <Footer />
    </div>
  );
}
