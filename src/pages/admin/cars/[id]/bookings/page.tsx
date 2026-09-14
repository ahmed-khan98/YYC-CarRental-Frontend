import { useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { carsApi } from "@/api/cars.api.ts";
import { locationsApi } from "@/api/locations.api.ts";
import { bookingsApi, type CarBookingCalendarItem } from "@/api/bookings.api.ts";
import { CarBookingCalendar } from "@/components/car-booking-calendar.tsx";
import { DateGroupedBookingsTable } from "@/components/date-grouped-bookings.tsx";
import { buildBookingDateGroups } from "@/lib/bookingDateGroups.ts";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { ArrowLeft, CalendarDays, Car as CarIcon, ListOrdered } from "lucide-react";
import { resolveMediaUrl } from "@/lib/mediaUrl.ts";

const CAR_IMAGES: Record<string, string> = {
  economy: "https://images.unsplash.com/photo-1690278289651-895463644114?w=400&q=70",
  sedan: "https://images.unsplash.com/photo-1679891647402-330589ea9309?w=400&q=70",
  suv: "https://images.unsplash.com/photo-1742869246328-847a516cd30a?w=400&q=70",
  luxury: "https://images.unsplash.com/photo-1650716748498-a2ce13ed0f2d?w=400&q=70",
  sports: "https://images.unsplash.com/photo-1683916138305-98a86efc9fc9?w=400&q=70",
  compact: "https://images.unsplash.com/photo-1647708790575-05985b7f670c?w=400&q=70",
  van: "https://images.unsplash.com/photo-1701918190763-3851cf361f96?w=400&q=70",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-primary/20 text-primary border-primary/30",
  checked_in: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  checked_out: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

const PAYMENT_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-500 border-yellow-500/25",
  paid: "bg-green-500/15 text-green-500 border-green-500/25",
  refunded: "bg-muted text-muted-foreground border-border",
};

export default function AdminCarBookingsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: car, isLoading: carLoading } = useQuery({
    queryKey: ["cars", id],
    queryFn: () => carsApi.get(id!),
    enabled: !!id,
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["bookings", "admin", "car", id],
    queryFn: () => bookingsApi.adminListByCar(id!),
    enabled: !!id,
  });

  const { data: locations } = useQuery({
    queryKey: ["locations"],
    queryFn: () => locationsApi.list(),
  });

  const locationsMap = useMemo(() => {
    const map = new Map<string, { name: string }>();
    (locations ?? []).forEach((l) => map.set(l._id, l));
    return map;
  }, [locations]);

  const dateGroups = useMemo(
    () => buildBookingDateGroups(bookings ?? [], []),
    [bookings],
  );

  const bookingsById = useMemo(() => {
    const map = new Map<string, CarBookingCalendarItem>();
    (bookings ?? []).forEach((b) => map.set(b._id, b));
    return map;
  }, [bookings]);

  if (!id) {
    return null;
  }

  const imgSrc = car?.resolvedImageUrls?.[0] ?? car?.imageUrl ?? (car ? CAR_IMAGES[car.category] : undefined);

  return (
    <div className="p-6 space-y-4 max-w-6xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/admin/cars")}
        className="cursor-pointer -ml-2 -mb-1 h-8"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Cars
      </Button>

      {carLoading ? (
        <Skeleton className="h-24 w-full rounded-xl" />
      ) : car ? (
        <Card className="border-border/50 bg-card/60 py-0 gap-0">
          <CardContent className="p-3 flex items-center gap-3">
            {imgSrc ? (
              <img
                src={resolveMediaUrl(imgSrc)}
                alt={`${car.make} ${car.model}`}
                className="w-24 h-16 object-cover rounded-lg shrink-0"
              />
            ) : (
              <div className="w-24 h-16 bg-muted rounded-lg flex items-center justify-center shrink-0">
                <CarIcon className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold">{car.year} {car.make} {car.model}</h1>
              <p className="text-sm text-muted-foreground capitalize mt-0.5">
                {car.category} · {car.color} · ${car.dailyRate}/day
              </p>
              <div className="flex gap-2 mt-2">
                <Badge className={car.isAvailable ? "bg-primary/20 text-primary border-primary/30" : "bg-destructive/20 text-destructive border-destructive/30"}>
                  {car.isAvailable ? "Available" : "Unavailable"}
                </Badge>
                {car.licensePlate && (
                  <Badge variant="outline" className="font-mono text-xs">{car.licensePlate}</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50">
          <CardContent className="py-8 text-center text-muted-foreground">Car not found.</CardContent>
        </Card>
      )}

      <Card className="border-border/50 bg-card/60 py-0 gap-0">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            Booking Calendar
            {bookings && (
              <span className="text-sm font-normal text-muted-foreground">
                ({bookings.length} booking{bookings.length !== 1 ? "s" : ""})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          {bookingsLoading ? (
            <Skeleton className="h-96 w-full rounded-xl" />
          ) : bookings && bookings.length > 0 ? (
            <CarBookingCalendar
              bookings={bookings}
              onViewBooking={(bookingId) => navigate(`/admin/bookings/${bookingId}`)}
            />
          ) : (
            <div className="py-16 text-center text-muted-foreground">
              <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No bookings for this vehicle yet.</p>
              <Button asChild variant="link" className="mt-2 cursor-pointer">
                <Link to="/admin/bookings">View all bookings</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {bookings && bookings.length > 0 && (
        <Card className="border-border/50 bg-card/60 py-0 gap-0">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-base flex items-center gap-2">
              <ListOrdered className="h-4 w-4 text-primary" />
              Bookings by Date
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {bookingsLoading ? (
              <Skeleton className="h-64 w-full rounded-xl" />
            ) : (
              <DateGroupedBookingsTable
                groups={dateGroups}
                getCustomerLabel={(booking) => bookingsById.get(booking._id)?.customerName ?? undefined}
                getCustomerEmail={(booking) => bookingsById.get(booking._id)?.customerEmail ?? undefined}
                getPickupLocationName={(booking) => locationsMap.get(booking.pickupLocationId)?.name}
                getDropoffLocationName={(booking) => locationsMap.get(booking.dropoffLocationId)?.name}
                onViewBooking={(bookingId) => navigate(`/admin/bookings/${bookingId}`)}
                statusColors={STATUS_COLORS}
                paymentColors={PAYMENT_COLORS}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
