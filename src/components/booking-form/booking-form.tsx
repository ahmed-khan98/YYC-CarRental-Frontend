import { memo, useCallback, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";
import { carsApi } from "@/api/cars.api.ts";
import { locationsApi } from "@/api/locations.api.ts";
import { servicesApi } from "@/api/services.api.ts";
import { bookingsApi } from "@/api/bookings.api.ts";
import { getApiErrorMessage } from "@/api/client.ts";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { BookingVehicleCard } from "@/components/booking-detail-ui.tsx";
import { BookingDatesSection } from "@/components/booking-form/booking-dates-section.tsx";
import { BookingLocationsSection } from "@/components/booking-form/booking-locations-section.tsx";
import { BookingServicesSection } from "@/components/booking-form/booking-services-section.tsx";
import { BookingNotesSection } from "@/components/booking-form/booking-notes-section.tsx";
import { BookingSummaryPanel } from "@/components/booking-form/booking-summary-panel.tsx";
import { useBookingQuote } from "@/hooks/use-booking-quote.ts";
import { isValidRentalPeriod } from "@/lib/rentalPricing.ts";
import { isExtraDriverService } from "@/lib/extraDriver.ts";
import { serviceAllowsQuantity } from "@/lib/serviceQuantity.ts";
import { toast } from "sonner";

const CAR_IMAGES: Record<string, string> = {
  economy: "https://images.unsplash.com/photo-1690278289651-895463644114?w=600&q=80",
  sedan: "https://images.unsplash.com/photo-1679891647402-330589ea9309?w=600&q=80",
  suv: "https://images.unsplash.com/photo-1742869246328-847a516cd30a?w=600&q=80",
  luxury: "https://images.unsplash.com/photo-1650716748498-a2ce13ed0f2d?w=600&q=80",
  sports: "https://images.unsplash.com/photo-1683916138305-98a86efc9fc9?w=600&q=80",
  compact: "https://images.unsplash.com/photo-1647708790575-05985b7f670c?w=600&q=80",
  van: "https://images.unsplash.com/photo-1701918190763-3851cf361f96?w=600&q=80",
};

const BookingSuccess = memo(function BookingSuccess() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-16 px-4"
    >
      <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
      <p className="text-muted-foreground mb-6">
        Your booking is confirmed. You can manage it from your dashboard.
      </p>
      <div className="flex gap-3 justify-center">
        <Button onClick={() => navigate("/dashboard")} className="cursor-pointer">
          View My Bookings
        </Button>
        <Button variant="secondary" onClick={() => navigate("/cars")} className="cursor-pointer">
          Browse More
        </Button>
      </div>
    </motion.div>
  );
});

type BookingFormProps = {
  carId: string;
};

function resizeNameList(current: string[], nextCount: number) {
  if (current.length === nextCount) return current;
  if (current.length < nextCount) {
    return [...current, ...Array.from({ length: nextCount - current.length }, () => "")];
  }
  return current.slice(0, nextCount);
}

export function BookingForm({ carId }: BookingFormProps) {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const { data: car, isLoading: carLoading } = useQuery({
    queryKey: ["cars", carId],
    queryFn: () => carsApi.get(carId),
    staleTime: 60_000,
  });
  const { data: locations = [], isLoading: locationsLoading } = useQuery({
    queryKey: ["locations", { activeOnly: true }],
    queryFn: () => locationsApi.list(true),
    staleTime: 60_000,
  });
  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ["services", { activeOnly: true }],
    queryFn: () => servicesApi.list(true),
    staleTime: 60_000,
  });

  const createBooking = useMutation({
    mutationFn: bookingsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookings"] }),
  });

  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const tomorrow = useMemo(() => format(new Date(Date.now() + 86400000), "yyyy-MM-dd"), []);

  const [pickupDate, setPickupDate] = useState(() => searchParams.get("pickupDate") ?? today);
  const [pickupTime, setPickupTime] = useState(() => searchParams.get("pickupTime") ?? "10:00");
  const [returnDate, setReturnDate] = useState(() => searchParams.get("dropoffDate") ?? tomorrow);
  const [returnTime, setReturnTime] = useState(() => searchParams.get("dropoffTime") ?? "10:00");
  const [pickupLocationId, setPickupLocationId] = useState(() => searchParams.get("pickupLocation") ?? "");
  const [dropoffLocationId, setDropoffLocationId] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [serviceQuantities, setServiceQuantities] = useState<Record<string, number>>({});
  const [extraDriverNames, setExtraDriverNames] = useState<string[]>([""]);
  const [notes, setNotes] = useState("");
  const submittingRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const selectedIds = useMemo(() => new Set(selectedServices), [selectedServices]);

  const extraDriverService = useMemo(
    () => services.find(isExtraDriverService),
    [services],
  );

  const hasExtraDriver = extraDriverService ? selectedIds.has(extraDriverService._id) : false;
  const extraDriverCount = extraDriverService
    ? serviceQuantities[extraDriverService._id] ?? 1
    : 1;

  const quote = useBookingQuote({
    dailyRate: car?.dailyRate ?? 0,
    pickupDate,
    pickupTime,
    returnDate,
    returnTime,
    services,
    selectedServiceIds: selectedServices,
    serviceQuantities,
  });

  const handlePickupDateChange = useCallback((date: string) => {
    setPickupDate(date);
    setReturnDate((current) => (current && current < date ? date : current));
  }, []);

  const handleToggleService = useCallback(
    (id: string) => {
      const service = services.find((item) => item._id === id);
      setSelectedServices((prev) => {
        const removing = prev.includes(id);
        if (removing) {
          setServiceQuantities((current) => {
            const next = { ...current };
            delete next[id];
            return next;
          });
          if (extraDriverService?._id === id) {
            setExtraDriverNames([""]);
          }
          return prev.filter((serviceId) => serviceId !== id);
        }

        if (service && serviceAllowsQuantity(service)) {
          setServiceQuantities((current) => ({ ...current, [id]: 1 }));
        }
        if (extraDriverService?._id === id) {
          setExtraDriverNames([""]);
        }
        return [...prev, id];
      });
    },
    [extraDriverService?._id, services],
  );

  const handleServiceQuantityChange = useCallback(
    (serviceId: string, count: number) => {
      const nextCount = Math.max(1, count);
      setServiceQuantities((current) => ({ ...current, [serviceId]: nextCount }));

      if (extraDriverService?._id === serviceId) {
        setExtraDriverNames((current) => resizeNameList(current, nextCount));
      }
    },
    [extraDriverService?._id],
  );

  const handleExtraDriverNameChange = useCallback((index: number, name: string) => {
    setExtraDriverNames((prev) => {
      const next = [...prev];
      next[index] = name;
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (submittingRef.current || loading || !car) return;
    if (!pickupLocationId) {
      toast.error("Please select a pickup location");
      return;
    }
    if (!dropoffLocationId) {
      toast.error("Please select a drop-off location");
      return;
    }
    if (!pickupDate || !returnDate) {
      toast.error("Please select dates");
      return;
    }
    if (!isValidRentalPeriod(pickupDate, pickupTime, returnDate, returnTime)) {
      toast.error("Drop-off must be after pickup date and time");
      return;
    }
    if (hasExtraDriver) {
      const missingName = extraDriverNames.findIndex((name) => !name.trim());
      if (missingName !== -1) {
        toast.error(`Please enter the full name for additional driver ${missingName + 1}`);
        return;
      }
    }

    submittingRef.current = true;
    setLoading(true);
    try {
      await createBooking.mutateAsync({
        carId,
        pickupLocationId,
        dropoffLocationId,
        pickupDate: new Date(pickupDate).toISOString(),
        pickupTime,
        returnDate: new Date(returnDate).toISOString(),
        returnTime,
        additionalServiceIds: selectedServices,
        serviceQuantities: selectedServices.map((serviceId) => ({
          serviceId,
          quantity: serviceQuantities[serviceId] ?? 1,
        })),
        extraDriverCount: hasExtraDriver ? extraDriverCount : undefined,
        extraDriverNames: hasExtraDriver
          ? extraDriverNames.map((name) => name.trim())
          : undefined,
        notes,
      });
      setSuccess(true);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }, [
    loading,
    car,
    pickupLocationId,
    dropoffLocationId,
    pickupDate,
    returnDate,
    pickupTime,
    returnTime,
    hasExtraDriver,
    extraDriverCount,
    extraDriverNames,
    serviceQuantities,
    carId,
    selectedServices,
    notes,
    createBooking,
  ]);

  if (success) return <BookingSuccess />;

  if (carLoading || locationsLoading || servicesLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!car) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Car not found.</p>
      </div>
    );
  }

  const carImage =
    car.resolvedImageUrls?.[0] ?? car.imageUrl ?? CAR_IMAGES[car.category] ?? CAR_IMAGES.sedan;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <BookingVehicleCard car={car} imageUrl={carImage} />

        <BookingDatesSection
          today={today}
          pickupDate={pickupDate}
          returnDate={returnDate}
          pickupTime={pickupTime}
          returnTime={returnTime}
          durationLabel={quote.durationLabel}
          onPickupDateChange={handlePickupDateChange}
          onReturnDateChange={setReturnDate}
          onPickupTimeChange={setPickupTime}
          onReturnTimeChange={setReturnTime}
        />

        <BookingLocationsSection
          locations={locations}
          pickupLocationId={pickupLocationId}
          dropoffLocationId={dropoffLocationId}
          onPickupLocationChange={setPickupLocationId}
          onDropoffLocationChange={setDropoffLocationId}
        />

        <BookingServicesSection
          services={services}
          selectedIds={selectedIds}
          serviceQuantities={serviceQuantities}
          extraDriverNames={extraDriverNames}
          onToggleService={handleToggleService}
          onServiceQuantityChange={handleServiceQuantityChange}
          onExtraDriverNameChange={handleExtraDriverNameChange}
        />

        <BookingNotesSection notes={notes} onNotesChange={setNotes} />
      </div>

      <div className="lg:col-span-1">
        <BookingSummaryPanel
          quote={quote}
          pickupDate={pickupDate}
          pickupTime={pickupTime}
          returnDate={returnDate}
          returnTime={returnTime}
          loading={loading}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
