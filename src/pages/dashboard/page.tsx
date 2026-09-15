import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { carsApi } from "@/api/cars.api.ts";
import { locationsApi } from "@/api/locations.api.ts";
import { bookingsApi } from "@/api/bookings.api.ts";
import { inspectionsApi } from "@/api/inspections.api.ts";
import { getApiErrorMessage } from "@/api/client.ts";
import type { Booking, Car, Location } from "@/types/index.ts";
import Navbar from "@/components/navbar.tsx";
import Footer from "@/components/footer.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { AdminDataTable, type AdminTableColumn } from "@/components/admin-data-table.tsx";
import { BookingDropoffCell, BookingPickupCell } from "@/components/booking-schedule-cell.tsx";
import { Authenticated, Unauthenticated, AuthLoading } from "@/components/auth-gate.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { useAuth } from "@/hooks/use-auth.ts";
import { toast } from "sonner";
import { motion } from "motion/react";
import { format } from "date-fns";
import { Car as CarIcon, DollarSign, XCircle, CheckCircle, Clock, ChevronDown, ChevronUp, Gauge, Fuel, FileText, Camera, LogIn, LogOut, Eye } from "lucide-react";
import { CancelBookingDialog } from "@/components/cancel-booking-dialog.tsx";
import { InspectionMediaGallery } from "@/components/inspection-media.tsx";
import { useNavigate } from "react-router-dom";
import { Hint } from "@/components/ui/tooltip.tsx";
import { carPrimaryImage, inspectionMediaUrls, resolveMediaUrl } from "@/lib/mediaUrl.ts";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-primary/20 text-primary border-primary/30",
  checked_in: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  checked_out: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

const CAR_IMAGES: Record<string, string> = {
  economy: "https://images.unsplash.com/photo-1690278289651-895463644114?w=200&q=80",
  sedan: "https://images.unsplash.com/photo-1679891647402-330589ea9309?w=200&q=80",
  suv: "https://images.unsplash.com/photo-1742869246328-847a516cd30a?w=200&q=80",
  luxury: "https://images.unsplash.com/photo-1650716748498-a2ce13ed0f2d?w=200&q=80",
  sports: "https://images.unsplash.com/photo-1683916138305-98a86efc9fc9?w=200&q=80",
  compact: "https://images.unsplash.com/photo-1647708790575-05985b7f670c?w=200&q=80",
  van: "https://images.unsplash.com/photo-1701918190763-3851cf361f96?w=200&q=80",
};

function InspectionHistory({ bookingId }: { bookingId: string }) {
  const { data: inspections } = useQuery({
    queryKey: ["inspections", bookingId],
    queryFn: () => inspectionsApi.listByBooking(bookingId),
  });

  if (!inspections || inspections.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Inspection History</p>
      {inspections.map((insp) => (
        <div key={insp._id} className="bg-muted/30 rounded-lg p-3 border border-border/40 space-y-2">
          <div className="flex items-center gap-2">
            {insp.type === "check_in" ? (
              <LogIn className="h-3.5 w-3.5 text-primary shrink-0" />
            ) : (
              <LogOut className="h-3.5 w-3.5 text-blue-400 shrink-0" />
            )}
            <span className="text-xs font-semibold">{insp.type === "check_in" ? "Check-In" : "Check-Out"}</span>
            <span className="text-xs text-muted-foreground ml-auto">
              {format(new Date(insp._creationTime), "MMM d, yyyy h:mm a")}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Gauge className="h-3 w-3 shrink-0" />
              <span>Mileage: <span className="text-foreground">{insp.mileage.toLocaleString()} km</span></span>
            </div>
            <div className="flex items-center gap-1">
              <Fuel className="h-3 w-3 shrink-0" />
              <span>Fuel: <span className="text-foreground capitalize">{insp.fuelLevel.replace("_", " ")}</span></span>
            </div>
            {insp.notes && (
              <div className="col-span-2 flex items-start gap-1">
                <FileText className="h-3 w-3 shrink-0 mt-0.5" />
                <span>Notes: <span className="text-foreground">{insp.notes}</span></span>
              </div>
            )}
          </div>
          {inspectionMediaUrls(insp).length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Camera className="h-3 w-3" />
                <span>Photos & videos ({inspectionMediaUrls(insp).length})</span>
              </div>
              <InspectionMediaGallery
                urls={inspectionMediaUrls(insp)}
                altPrefix="Inspection"
                thumbClassName="h-14 w-20 object-cover rounded hover:opacity-80 transition-opacity"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function RentalHistoryTable({
  bookings,
  carsMap,
  locationsMap,
  isLoading,
}: {
  bookings: Booking[];
  carsMap: Map<string, Car>;
  locationsMap: Map<string, Location>;
  isLoading?: boolean;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);

  const cancel = useMutation({
    mutationFn: (bookingId: string) => bookingsApi.cancel(bookingId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success(result.cancellationSummary?.message ?? "Booking cancelled");
    },
  });

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    try {
      await cancel.mutateAsync(cancelTarget._id);
      setCancelTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const columns: AdminTableColumn<Booking>[] = useMemo(() => [
    {
      id: "vehicle",
      header: "Vehicle",
      className: "whitespace-normal",
      headClassName: "whitespace-normal",
      cell: (booking) => {
        const car = carsMap.get(booking.carId);
        const carImg = carPrimaryImage(car, car ? CAR_IMAGES[car.category] : undefined);
        return (
          <div className="flex items-center gap-2">
            {carImg ? (
              <img src={resolveMediaUrl(carImg)} alt={car ? `${car.make} ${car.model}` : "Car"} className="w-14 h-10 object-cover rounded-md shrink-0 border border-border/30" />
            ) : (
              <div className="w-14 h-10 bg-muted rounded-md shrink-0 flex items-center justify-center border border-border/30">
                <CarIcon className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <span className="text-sm font-medium truncate">
              {car ? `${car.year} ${car.make} ${car.model}` : "—"}
            </span>
          </div>
        );
      },
    },
    {
      id: "pickup",
      header: "Pickup",
      className: "whitespace-normal",
      headClassName: "whitespace-normal",
      cell: (booking) => (
        <BookingPickupCell
          booking={booking}
          locationName={locationsMap.get(booking.pickupLocationId)?.name}
        />
      ),
    },
    {
      id: "dropoff",
      header: "Drop-off",
      className: "whitespace-normal",
      headClassName: "whitespace-normal",
      cell: (booking) => (
        <BookingDropoffCell
          booking={booking}
          locationName={locationsMap.get(booking.dropoffLocationId)?.name}
        />
      ),
    },
    {
      id: "total",
      header: "Total",
      className: "whitespace-normal",
      headClassName: "whitespace-normal",
      cell: (booking) => <span className="font-semibold text-primary text-sm">${booking.totalAmount}</span>,
    },
    {
      id: "status",
      header: "Status",
      className: "whitespace-normal",
      headClassName: "whitespace-normal",
      cell: (booking) => (
        <Badge className={`text-[10px] border capitalize ${STATUS_COLORS[booking.status] ?? ""}`}>
          {booking.status.replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      className: "text-right whitespace-normal w-0",
      headClassName: "text-right whitespace-normal w-0",
      cell: (booking) => {
        const canViewInspections = booking.checkInVisibleToUser || booking.checkOutVisibleToUser;
        const canCancel = booking.status === "pending" || booking.status === "confirmed";
        return (
          <div className="flex items-center justify-end gap-1">
            <Hint label="View booking">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                aria-label="View booking"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/bookings/${booking._id}`);
                }}
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
            </Hint>
            {canCancel && (
              <Hint label="Cancel booking">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10"
                  aria-label="Cancel booking"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCancelTarget(booking);
                  }}
                >
                  <XCircle className="h-3.5 w-3.5" />
                </Button>
              </Hint>
            )}
            {canViewInspections && (
              <Hint label={expandedId === booking._id ? "Hide inspections" : "Show inspections"}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer"
                  aria-label={expandedId === booking._id ? "Hide inspections" : "Show inspections"}
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedId(expandedId === booking._id ? null : booking._id);
                  }}
                >
                  {expandedId === booking._id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </Hint>
            )}
          </div>
        );
      },
    },
  ], [carsMap, locationsMap, expandedId, navigate]);

  return (
    <>
      <AdminDataTable
      columns={columns}
      data={bookings}
      getRowKey={(b) => b._id}
      isLoading={isLoading}
      className="min-w-0 border-0 bg-transparent -mx-5 px-5 sm:mx-0 sm:px-0 [&_[data-slot=table-cell]]:px-3 [&_[data-slot=table-head]]:px-3"
      tableClassName="min-w-[720px]"
      emptyIcon={CarIcon}
      emptyMessage="No bookings yet. Find your perfect ride!"
      expandedKey={expandedId}
      onRowClick={(booking) => {
        const canViewInspections = booking.checkInVisibleToUser || booking.checkOutVisibleToUser;
        if (canViewInspections) {
          setExpandedId(expandedId === booking._id ? null : booking._id);
        }
      }}
      renderExpandedRow={(booking) => (
        <div className="p-4 space-y-3">
          {booking.status === "cancelled" && booking.cancelledBy === "admin" && booking.cancellationReason && (
            <div className="text-xs bg-destructive/10 text-destructive border border-destructive/20 rounded px-2 py-1.5">
              Cancelled by admin: {booking.cancellationReason}
            </div>
          )}
          {booking.status === "cancelled" && booking.cancelledBy === "user" && (
            <div className="text-xs bg-muted/50 text-muted-foreground border border-border/50 rounded px-2 py-1.5">
              You cancelled this booking.
            </div>
          )}
          <InspectionHistory bookingId={booking._id} />
        </div>
      )}
    />
      <CancelBookingDialog
        booking={cancelTarget}
        open={cancelTarget != null}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
        onConfirm={handleConfirmCancel}
        loading={cancel.isPending}
      />
    </>
  );
}

function DashboardInner() {
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["bookings"],
    queryFn: () => bookingsApi.myBookings(),
  });
  const { data: cars } = useQuery({
    queryKey: ["cars"],
    queryFn: () => carsApi.list(),
  });
  const { data: locations } = useQuery({
    queryKey: ["locations"],
    queryFn: () => locationsApi.list(),
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  const carsMap = useMemo(() => new Map((cars ?? []).map((c) => [c._id, c])), [cars]);
  const locationsMap = useMemo(() => new Map((locations ?? []).map((l) => [l._id, l])), [locations]);

  const sortedBookings = useMemo(
    () => (bookings ?? []).slice().sort((a, b) => b._creationTime - a._creationTime),
    [bookings],
  );

  const stats = {
    total: bookings?.length ?? 0,
    active: bookings?.filter((b) => ["confirmed", "checked_in"].includes(b.status)).length ?? 0,
    completed: bookings?.filter((b) => b.status === "completed").length ?? 0,
    spent: bookings?.filter((b) => b.status !== "cancelled").reduce((s, b) => s + b.totalAmount, 0) ?? 0,
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {user?.name ?? "Driver"}</p>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { icon: CarIcon, label: "Total Bookings", value: stats.total },
          { icon: CheckCircle, label: "Active", value: stats.active },
          { icon: Clock, label: "Completed", value: stats.completed },
          { icon: DollarSign, label: "Total Spent", value: `$${stats.spent}` },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <Card className="border-border/50 bg-card/60 text-center p-4">
              <CardContent className="p-0">
                <stat.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                <div className="text-xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="min-w-0 border-border/50 bg-card/30 py-0 gap-0">
        <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-5">
          <CardTitle className="text-lg">Rental History</CardTitle>
          <Button size="sm" onClick={() => navigate("/cars")} className="cursor-pointer">Book New Car</Button>
        </CardHeader>
        <CardContent className="min-w-0 px-5 pb-5 pt-0">
          {!bookingsLoading && sortedBookings.length === 0 ? (
            <div className="text-center py-10 rounded-xl border border-border/50">
              <CarIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No bookings yet. Find your perfect ride!</p>
              <Button className="mt-4 cursor-pointer" onClick={() => navigate("/cars")}>Browse Cars</Button>
            </div>
          ) : (
            <RentalHistoryTable
              bookings={sortedBookings}
              carsMap={carsMap}
              locationsMap={locationsMap}
              isLoading={bookingsLoading}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="pt-16 flex-1">
        <AuthLoading>
          <div className="mx-auto max-w-5xl px-4 py-8">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          </div>
        </AuthLoading>
        <Unauthenticated>
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="border-border/50 text-center py-12 px-8">
              <CardContent>
                <h3 className="text-lg font-semibold mb-2">Sign in to view your dashboard</h3>
                <p className="text-muted-foreground text-sm mb-4">Track your bookings and rental history.</p>
                <SignInButton />
              </CardContent>
            </Card>
          </div>
        </Unauthenticated>
        <Authenticated>
          <DashboardInner />
        </Authenticated>
      </div>
      <Footer />
    </div>
  );
}
