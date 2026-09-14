import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { bookingsApi } from "@/api/bookings.api.ts";
import { inspectionsApi } from "@/api/inspections.api.ts";
import { motion } from "motion/react";
import { format } from "date-fns";
import { formatRentalDays } from "@/lib/rentalPricing.ts";
import { calculateServiceCharge, formatServiceRateLabel } from "@/lib/serviceCharge.ts";
import { formatDateAtTime } from "@/lib/timeFormat.ts";
import { BookingActorValue } from "@/components/booking-actor-value.tsx";
import { AdminEditBookingDialog } from "@/components/admin-edit-booking-dialog.tsx";
import { BookingBillPanel } from "@/components/booking-bill-panel.tsx";
import { AdminManualChargesPanel } from "@/components/admin-manual-charges-panel.tsx";
import { AdminSecurityDepositPanel } from "@/components/admin-security-deposit-panel.tsx";
import { AdminInvoicesPanel } from "@/components/admin-invoices-panel.tsx";
import { computeBillSummary } from "@/lib/billing.ts";
import { CancelledAmountDueBanner } from "@/components/cancelled-amount-due.tsx";
import { InspectionHistoryGrid, pickLatestInspection } from "@/components/inspection-history-grid.tsx";
import { BookingStatusStepper } from "@/components/booking-status-stepper.tsx";
import {
  AdminCheckInOutActions,
} from "@/components/check-in-out.tsx";
import { isExtraDriverService } from "@/lib/extraDriver.ts";
import { formatDisplayName } from "@/lib/displayName.ts";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  BookingDetailCard,
  BookingDetailCardContent,
  BookingDetailCardHeader,
  BookingVehicleCard,
  InfoRow,
  SectionTitle,
} from "@/components/booking-detail-ui.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  ArrowLeft, MapPin, Calendar, Car, Package,
  LogIn, LogOut, User, Mail, Phone, Clock, AlertCircle, CheckCircle,
  XCircle, Info, Pencil
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

export default function AdminBookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["bookings", id, "detail"],
    queryFn: () => bookingsApi.getDetailById(id!),
    enabled: !!id,
  });
  const { data: inspections, isLoading: inspectionsLoading } = useQuery({
    queryKey: ["inspections", id],
    queryFn: () => inspectionsApi.listByBooking(id!),
    enabled: !!id,
  });

  if (!id) {
    navigate("/admin/bookings");
    return null;
  }

  if (detailLoading || inspectionsLoading) {
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
    user: customer,
    createdBy,
    updatedBy,
    checkInPerformedBy,
    checkOutPerformedBy,
    billEntries = [],
    billSummary,
    securityDeposit,
  } = detail;
  const resolvedBillSummary = billSummary ?? computeBillSummary(billEntries);

  const carImg = car?.resolvedImageUrls?.[0] ?? (car ? CAR_IMAGES[car.category] : undefined);
  const checkIn = pickLatestInspection(inspections, "check_in");
  const checkOut = pickLatestInspection(inspections, "check_out");
  const hasExtraDriver = services.some(isExtraDriverService);
  const extraDriverNames = booking.extraDriverNames ?? [];

  return (
    <div className="p-4 sm:p-6 max-w-6xl pb-16 md:pb-12 overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 mb-4 sm:mb-3"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/bookings")}
            className="cursor-pointer -ml-2 shrink-0"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Bookings
          </Button>
          <span className="text-muted-foreground text-sm font-mono truncate">
            #{booking._id.slice(-8).toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto shrink-0">
          {booking.status !== "cancelled" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
              className="cursor-pointer h-8"
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit Booking
            </Button>
          )}
          <Badge className={`text-xs border flex items-center gap-1.5 capitalize h-8 px-2.5 ${STATUS_COLORS[booking.status] ?? ""}`}>
            {STATUS_ICONS[booking.status]}
            {booking.status.replace(/_/g, " ")}
          </Badge>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="space-y-6 md:space-y-5"
      >
        {car && (
          <BookingVehicleCard
            car={car}
            imageUrl={carImg}
          />
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
            {booking.cancelledBy === "admin" && booking.cancellationReason
              ? <span><strong>Cancelled by admin:</strong> {booking.cancellationReason}</span>
              : booking.cancelledBy === "user"
              ? <span>
                  Cancelled by customer.
                  {booking.cancellationPolicy === "one_day_fee" && " 1-day cancellation fee applies."}
                  {booking.cancellationPolicy === "non_refundable" && " Full booking amount applies (within 72 hours of pick-up)."}
                </span>
              : <span>This booking was cancelled.</span>}
          </div>
        )}

        {booking.status === "cancelled" && (
          <CancelledAmountDueBanner
            booking={booking}
            balanceDue={resolvedBillSummary.totalUnpaid}
          />
        )}

        {/* Row 1: Customer + Booking Details + Billing (sticky on desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-4 items-start">
          <BookingDetailCard>
            <BookingDetailCardHeader>
              <SectionTitle icon={<User className="h-4 w-4" />} title="Customer Information" />
            </BookingDetailCardHeader>
            <BookingDetailCardContent>
              <InfoRow label="Full Name" value={formatDisplayName(customer?.name)} />
              <InfoRow
                label="Email"
                value={
                  <span className="flex items-center gap-1 justify-end">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {customer?.email ?? "—"}
                  </span>
                }
              />
              <InfoRow
                label="Phone"
                value={
                  <span className="flex items-center gap-1 justify-end">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {customer?.phone ?? "—"}
                  </span>
                }
              />
            </BookingDetailCardContent>
          </BookingDetailCard>

          <BookingDetailCard>
            <BookingDetailCardHeader>
              <SectionTitle icon={<Info className="h-4 w-4" />} title="Booking Details" />
            </BookingDetailCardHeader>
            <BookingDetailCardContent>
              <InfoRow
                label="Created by"
                value={<BookingActorValue actor={createdBy} timestamp={booking._creationTime} />}
              />
              {updatedBy && (
                <InfoRow
                  label="Updated by"
                  value={<BookingActorValue actor={updatedBy} timestamp={booking._updatedTime} />}
                />
              )}
              {checkInPerformedBy && (
                <InfoRow
                  label="Checked in by"
                  value={
                    <BookingActorValue
                      actor={checkInPerformedBy}
                      timestamp={checkIn?._creationTime}
                    />
                  }
                />
              )}
              {checkOutPerformedBy && (
                <InfoRow
                  label="Checked out by"
                  value={
                    <BookingActorValue
                      actor={checkOutPerformedBy}
                      timestamp={checkOut?._creationTime}
                    />
                  }
                />
              )}
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
                    {formatDateAtTime(format(new Date(booking.pickupDate), "MMM d, yyyy"), booking.pickupTime)}
                  </span>
                }
              />
              <InfoRow
                label="Drop-off"
                value={
                  <span className="flex items-center gap-1 justify-end">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {formatDateAtTime(format(new Date(booking.returnDate), "MMM d, yyyy"), booking.returnTime)}
                  </span>
                }
              />
              <InfoRow label="Duration" value={formatRentalDays(days)} />
              {booking.notes && (
                <InfoRow label="Notes" value={<span className="text-muted-foreground">{booking.notes}</span>} />
              )}
            </BookingDetailCardContent>
          </BookingDetailCard>

          <div className="lg:sticky lg:top-6 self-start w-full">
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
          </div>
        </div>

        {/* Add-on Services */}
        <BookingDetailCard>
          <BookingDetailCardHeader>
            <SectionTitle icon={<Package className="h-4 w-4" />} title="Add-on Services" />
          </BookingDetailCardHeader>
          <BookingDetailCardContent>
            {services.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-3">
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
                  <div className="mt-4 pt-4 border-t border-border/40">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium">
                        Additional Drivers ({booking.extraDriverCount ?? extraDriverNames.length})
                      </p>
                    </div>
                    <div className="space-y-2">
                      {extraDriverNames.map((name, index) => (
                        <div
                          key={`${name}-${index}`}
                          className="rounded-lg border border-border/30 bg-muted/20 px-3 py-2 text-sm"
                        >
                          Driver {index + 1}: <span className="font-medium">{name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-2">No add-on services on this booking.</p>
            )}
          </BookingDetailCardContent>
        </BookingDetailCard>

        <AdminSecurityDepositPanel bookingId={booking._id} deposit={securityDeposit} />
        <AdminInvoicesPanel bookingId={booking._id} billEntries={billEntries} />
        <AdminManualChargesPanel
          bookingId={booking._id}
          billEntries={billEntries}
          securityDeposit={securityDeposit}
        />

        {(checkIn || checkOut || booking.status === "confirmed" || booking.status === "checked_in") && (
          <BookingDetailCard>
            <BookingDetailCardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <SectionTitle icon={<Car className="h-4 w-4" />} title="Check-in / Check-out History" />
                <AdminCheckInOutActions booking={booking} />
              </div>
            </BookingDetailCardHeader>
            <BookingDetailCardContent>
              <InspectionHistoryGrid checkIn={checkIn} checkOut={checkOut} booking={booking} />
            </BookingDetailCardContent>
          </BookingDetailCard>
        )}
      </motion.div>

      {editOpen && (
        <AdminEditBookingDialog
          booking={{ ...booking, billEntries: booking.billEntries ?? billEntries }}
          customer={customer}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["bookings", id, "detail"] });
            queryClient.invalidateQueries({ queryKey: ["inspections", id] });
          }}
        />
      )}
    </div>
  );
}
