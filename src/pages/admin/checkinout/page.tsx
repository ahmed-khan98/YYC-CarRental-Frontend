import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { bookingsApi } from "@/api/bookings.api.ts";
import { carsApi } from "@/api/cars.api.ts";
import { locationsApi } from "@/api/locations.api.ts";
import { usersApi } from "@/api/users.api.ts";
import { inspectionsApi } from "@/api/inspections.api.ts";
import type { Booking, Car, Location, User } from "@/types/index.ts";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { AdminDataTable, type AdminTableColumn } from "@/components/admin-data-table.tsx";
import { formatDateWithTime } from "@/lib/timeFormat.ts";
import { formatCarName, formatDisplayName } from "@/lib/displayName.ts";
import { resolveMediaUrl } from "@/lib/mediaUrl.ts";
import { AdminCheckInOutActions } from "@/components/check-in-out.tsx";
import { InspectionHistoryGrid, pickLatestInspection } from "@/components/inspection-history-grid.tsx";
import {
  CarFront, User as UserIcon, MapPin, Calendar,
  Camera, Phone, Mail, Clock,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { Hint } from "@/components/ui/tooltip.tsx";

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-primary/20 text-primary border-primary/30",
  checked_in: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  checked_out: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
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

function BookingExpandedPanel({
  booking,
  car,
  customer,
  pickupLocation,
  dropoffLocation,
}: {
  booking: Booking;
  car?: Car;
  customer?: User;
  pickupLocation?: Location;
  dropoffLocation?: Location;
}) {
  const { data: inspections } = useQuery({
    queryKey: ["inspections", booking._id],
    queryFn: () => inspectionsApi.listByBooking(booking._id),
  });

  const checkIn = pickLatestInspection(inspections, "check_in");
  const checkOut = pickLatestInspection(inspections, "check_out");

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <UserIcon className="h-3.5 w-3.5" /> Customer
          </p>
          <div className="bg-muted/30 rounded-xl p-3 border border-border/30 space-y-1.5">
            <p className="text-sm font-medium">{formatDisplayName(customer?.name)}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Mail className="h-3 w-3 shrink-0" /> {customer?.email ?? "—"}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Phone className="h-3 w-3 shrink-0" /> {customer?.phone ?? "—"}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <CarFront className="h-3.5 w-3.5" /> Vehicle
          </p>
          <div className="bg-muted/30 rounded-xl p-3 border border-border/30 space-y-1.5">
            <p className="text-sm font-medium">
              {formatCarName(car)}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {car ? `${car.category} · ${car.transmission}` : "—"}
            </p>
            {car && <p className="text-xs text-primary font-semibold">${car.dailyRate}/day</p>}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Booking
          </p>
          <div className="bg-muted/30 rounded-xl p-3 border border-border/30 space-y-1.5 text-xs">
            <div className="flex items-start gap-1.5">
              <MapPin className="h-3 w-3 text-primary shrink-0 mt-0.5" />
              <span className="text-muted-foreground">
                Pickup: <span className="text-foreground">{pickupLocation?.name ?? "—"}</span>
              </span>
            </div>
            <div className="flex items-start gap-1.5">
              <MapPin className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
              <span className="text-muted-foreground">
                Drop-off: <span className="text-foreground">{dropoffLocation?.name ?? "—"}</span>
              </span>
            </div>
            <div className="flex items-start gap-1.5">
              <Clock className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
              <span className="text-muted-foreground">
                {formatDateWithTime(format(new Date(booking.pickupDate), "MMM d"), booking.pickupTime)} →{" "}
                {formatDateWithTime(format(new Date(booking.returnDate), "MMM d"), booking.returnTime)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Camera className="h-3.5 w-3.5" /> Inspection Records
          </p>
          <AdminCheckInOutActions booking={booking} />
        </div>
        {!inspections ? (
          <Skeleton className="h-20 w-full rounded-xl" />
        ) : (
          <InspectionHistoryGrid checkIn={checkIn} checkOut={checkOut} booking={booking} />
        )}
      </div>
    </div>
  );
}

function CheckInOutBookingTable({
  title,
  bookings,
  carsMap,
  usersMap,
  locationsMap,
  isLoading,
  emptyMessage,
}: {
  title: string;
  bookings: Booking[];
  carsMap: Map<string, Car>;
  usersMap: Map<string, User>;
  locationsMap: Map<string, Location>;
  isLoading?: boolean;
  emptyMessage?: string;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const columns: AdminTableColumn<Booking>[] = useMemo(() => [
    {
      id: "vehicle",
      header: "Vehicle",
      cell: (booking) => {
        const car = carsMap.get(booking.carId);
        const carImg = car?.resolvedImageUrls?.[0] ?? car?.imageUrl ?? (car ? CAR_IMAGES[car.category] : undefined);
        return (
          <div className="flex items-center gap-3 min-w-[160px]">
            {carImg ? (
              <img src={resolveMediaUrl(carImg)} alt="Car" className="w-14 h-10 object-cover rounded-md shrink-0" />
            ) : (
              <div className="w-14 h-10 bg-muted rounded-md shrink-0 flex items-center justify-center">
                <CarFront className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <span className="text-sm font-medium truncate">
              {formatCarName(car)}
            </span>
          </div>
        );
      },
    },
    {
      id: "customer",
      header: "Customer",
      className: "hidden sm:table-cell",
      headClassName: "hidden sm:table-cell",
      cell: (booking) => {
        const customer = usersMap.get(booking.userId);
        return (
          <div>
            <p className="text-sm font-medium">{formatDisplayName(customer?.name)}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[140px]">{customer?.email ?? ""}</p>
          </div>
        );
      },
    },
    {
      id: "period",
      header: "Rental Period",
      className: "hidden md:table-cell",
      headClassName: "hidden md:table-cell",
      cell: (booking) => (
        <span className="text-xs sm:text-sm">
          {formatDateWithTime(format(new Date(booking.pickupDate), "MMM d"), booking.pickupTime)} —{" "}
          {formatDateWithTime(format(new Date(booking.returnDate), "MMM d, yyyy"), booking.returnTime)}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (booking) => (
        <Badge className={`text-[10px] border capitalize ${STATUS_COLORS[booking.status] ?? ""}`}>
          {booking.status.replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      id: "total",
      header: "Total",
      className: "hidden lg:table-cell",
      headClassName: "hidden lg:table-cell",
      cell: (booking) => <span className="font-semibold text-primary text-sm">${booking.totalAmount}</span>,
    },
    {
      id: "actions",
      header: "",
      className: "text-right w-10",
      headClassName: "text-right w-10",
      cell: (booking) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            setExpandedId(expandedId === booking._id ? null : booking._id);
          }}
        >
          {expandedId === booking._id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      ),
    },
  ], [carsMap, usersMap, expandedId]);

  if (!isLoading && bookings.length === 0 && !emptyMessage) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">{title}</h3>
      <AdminDataTable
        columns={columns}
        data={bookings}
        getRowKey={(b) => b._id}
        isLoading={isLoading}
        emptyMessage={emptyMessage ?? "No bookings"}
        expandedKey={expandedId}
        onRowClick={(b) => setExpandedId(expandedId === b._id ? null : b._id)}
        renderExpandedRow={(booking) => (
          <BookingExpandedPanel
            booking={booking}
            car={carsMap.get(booking.carId)}
            customer={usersMap.get(booking.userId)}
            pickupLocation={locationsMap.get(booking.pickupLocationId)}
            dropoffLocation={locationsMap.get(booking.dropoffLocationId)}
          />
        )}
      />
    </div>
  );
}

export default function AdminCheckInOutPage() {
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["bookings", "admin"],
    queryFn: () => bookingsApi.adminList(),
  });
  const { data: cars } = useQuery({ queryKey: ["cars"], queryFn: () => carsApi.list() });
  const { data: users } = useQuery({ queryKey: ["users"], queryFn: () => usersApi.listUsers() });
  const { data: locations } = useQuery({ queryKey: ["locations"], queryFn: () => locationsApi.list() });

  const carsMap = useMemo(() => new Map((cars ?? []).map((c) => [c._id, c])), [cars]);
  const usersMap = useMemo(() => new Map((users ?? []).map((u) => [u._id, u])), [users]);
  const locationsMap = useMemo(() => new Map((locations ?? []).map((l) => [l._id, l])), [locations]);

  const confirmedBookings = (bookings ?? []).filter((b) => b.status === "confirmed");
  const checkedInBookings = (bookings ?? []).filter((b) => b.status === "checked_in");
  const completedRecently = (bookings ?? [])
    .filter((b) => b.status === "completed")
    .sort((a, b) => b._creationTime - a._creationTime)
    .slice(0, 10);

  const stats = [
    { label: "Awaiting Check-in", value: confirmedBookings.length, color: "text-primary" },
    { label: "Currently Out", value: checkedInBookings.length, color: "text-blue-400" },
    { label: "Completed (recent)", value: completedRecently.length, color: "text-green-400" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Check In / Check Out</h2>
        <p className="text-muted-foreground text-sm mt-0.5">
          Perform check-in and check-out for bookings. Enable customer visibility per booking when ready.
        </p>
      </div>

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

      <CheckInOutBookingTable
        title="Awaiting Check-in"
        bookings={confirmedBookings}
        carsMap={carsMap}
        usersMap={usersMap}
        locationsMap={locationsMap}
        isLoading={isLoading}
      />

      <CheckInOutBookingTable
        title="Currently Out"
        bookings={checkedInBookings}
        carsMap={carsMap}
        usersMap={usersMap}
        locationsMap={locationsMap}
        isLoading={isLoading}
      />

      <CheckInOutBookingTable
        title="Recently Completed"
        bookings={completedRecently}
        carsMap={carsMap}
        usersMap={usersMap}
        locationsMap={locationsMap}
        isLoading={isLoading}
        emptyMessage="No completed rentals yet"
      />
    </div>
  );
}
