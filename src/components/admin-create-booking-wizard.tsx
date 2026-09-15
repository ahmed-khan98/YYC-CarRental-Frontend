import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { bookingsApi } from "@/api/bookings.api.ts";
import { carsApi } from "@/api/cars.api.ts";
import { locationsApi } from "@/api/locations.api.ts";
import { servicesApi } from "@/api/services.api.ts";
import { usersApi } from "@/api/users.api.ts";
import { getApiErrorMessage } from "@/api/client.ts";
import { carPrimaryImage } from "@/lib/mediaUrl.ts";
import {
  BookingDetailCard,
  BookingDetailCardContent,
} from "@/components/booking-detail-ui.tsx";
import { BookingDatesSection } from "@/components/booking-form/booking-dates-section.tsx";
import { BookingLocationsSection } from "@/components/booking-form/booking-locations-section.tsx";
import { BookingNotesSection } from "@/components/booking-form/booking-notes-section.tsx";
import { BookingServicesSection } from "@/components/booking-form/booking-services-section.tsx";
import { BookingSummaryPanel } from "@/components/booking-form/booking-summary-panel.tsx";
import { CustomerSearchSelect } from "@/components/customer-search-select.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible.tsx";
import { useBookingQuote } from "@/hooks/use-booking-quote.ts";
import {
  buildServicesPayload,
  emptyServicesFormState,
  setBookingExtraDriverName,
  setBookingServiceQuantity,
  toggleBookingService,
  validateBookingExtraDrivers,
  type BookingServicesFormState,
} from "@/lib/bookingServicesState.ts";
import {
  calculateRentalDays,
  formatRentalDays,
  isValidRentalPeriod,
} from "@/lib/rentalPricing.ts";
import { isStaffRole } from "@/lib/roles.ts";
import { formatTime12h } from "@/lib/timeFormat.ts";
import {
  formatVehicleCategoryLabel,
  vehicleCategoryBadgeClass,
  VEHICLE_TYPE_FILTER_OPTIONS,
} from "@/lib/vehicleCategories.ts";
import { cn } from "@/lib/utils.ts";
import { Hint } from "@/components/ui/tooltip.tsx";
import type { Car, User } from "@/types/index.ts";
import {
  ArrowLeft,
  CarFront,
  ChevronLeft,
  ChevronDown,
  CircleCheckBig,
  Search,
  SlidersHorizontal,
  UserPlus,
  Users,
} from "lucide-react";
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

const WIZARD_STEPS = [
  { id: 1, label: "Search Car", shortLabel: "Search" },
  { id: 2, label: "Select Car", shortLabel: "Vehicle" },
  { id: 3, label: "Customer", shortLabel: "Customer" },
  { id: 4, label: "Services", shortLabel: "Services" },
] as const;

const TRANSMISSIONS = ["all", "automatic", "manual"] as const;
const FUEL_TYPES = ["all", "gasoline", "diesel", "electric", "hybrid"] as const;

const today = format(new Date(), "yyyy-MM-dd");
const tomorrow = format(new Date(Date.now() + 86400000), "yyyy-MM-dd");

function getCarImage(car: Car) {
  return carPrimaryImage(car, CAR_IMAGES[car.category] ?? CAR_IMAGES.sedan);
}

function WizardStepCompletedIcon() {
  return (
    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary">
      <CircleCheckBig
        className="h-4 w-4 text-white"
        strokeWidth={2}
        fill="none"
        aria-hidden
      />
    </span>
  );
}

function WizardStepper({ currentStep }: { currentStep: number }) {
  return (
    <ol className="flex w-full items-center gap-1">
      {WIZARD_STEPS.map((step, index) => {
        const stepNum = index + 1;
        const isCompleted = currentStep > stepNum;
        const isCurrent = currentStep === stepNum;

        return (
          <li key={step.id} className="contents">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div className="flex h-7 w-full items-center justify-center">
                {isCompleted ? (
                  <WizardStepCompletedIcon />
                ) : (
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                      isCurrent && "border-2 border-primary bg-background text-primary",
                      !isCurrent && "border-2 border-border bg-background text-muted-foreground",
                    )}
                    aria-current={isCurrent ? "step" : undefined}
                  >
                    {stepNum}
                  </div>
                )}
              </div>
              <span
                className={cn(
                  "hidden w-full text-center text-[10px] font-medium leading-tight sm:block sm:text-[11px]",
                  (isCompleted || isCurrent) && "text-foreground",
                  !isCompleted && !isCurrent && "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
              <span
                className={cn(
                  "w-full text-center text-[10px] font-medium leading-tight sm:hidden",
                  (isCompleted || isCurrent) && "text-foreground",
                  !isCompleted && !isCurrent && "text-muted-foreground",
                )}
              >
                {step.shortLabel}
              </span>
            </div>
            {index < WIZARD_STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 min-w-2 flex-1 shrink self-center",
                  isCompleted ? "bg-primary" : "bg-border",
                )}
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function ScheduleSummary({
  pickupLocationName,
  dropoffLocationName,
  pickupDate,
  pickupTime,
  returnDate,
  returnTime,
}: {
  pickupLocationName?: string;
  dropoffLocationName?: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
}) {
  return (
    <div className="rounded-lg border border-border/40 bg-muted/15 px-3 py-2.5 text-xs text-muted-foreground space-y-1">
      <p>
        <span className="font-medium text-foreground">Pickup:</span>{" "}
        {pickupLocationName ?? "—"} · {pickupDate} · {formatTime12h(pickupTime)}
      </p>
      <p>
        <span className="font-medium text-foreground">Drop-off:</span>{" "}
        {dropoffLocationName ?? "—"} · {returnDate} · {formatTime12h(returnTime)}
      </p>
    </div>
  );
}

function CarFiltersPanel({
  vehicleType,
  transmission,
  fuelType,
  onVehicleTypeChange,
  onTransmissionChange,
  onFuelTypeChange,
}: {
  vehicleType: string;
  transmission: string;
  fuelType: string;
  onVehicleTypeChange: (value: string) => void;
  onTransmissionChange: (value: string) => void;
  onFuelTypeChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const hasActiveFilters =
    vehicleType !== "all" || transmission !== "all" || fuelType !== "all";

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Element;
      if (panelRef.current?.contains(target)) return;
      if (target.closest("[data-slot='select-content']")) return;
      if (target.closest("[role='listbox']")) return;
      setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <div ref={panelRef}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex justify-end">
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant={open || hasActiveFilters ? "default" : "secondary"}
              size="sm"
              className="cursor-pointer gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filter
              {hasActiveFilters && (
                <Badge
                  variant="secondary"
                  className="h-4 min-w-4 px-1 text-[10px] bg-primary-foreground/20 text-primary-foreground border-0"
                >
                  !
                </Badge>
              )}
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  open && "rotate-180",
                )}
              />
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          <div className="pt-3">
            <BookingDetailCard>
              <BookingDetailCardContent className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-3 sm:pt-5">
                <div className="min-w-0 space-y-2">
                  <Label className="text-xs text-muted-foreground">Vehicle Type</Label>
                  <Select value={vehicleType} onValueChange={onVehicleTypeChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All vehicle types" />
                    </SelectTrigger>
                    <SelectContent>
                      {VEHICLE_TYPE_FILTER_OPTIONS.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type === "all" ? "All" : formatVehicleCategoryLabel(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-0 space-y-2">
                  <Label className="text-xs text-muted-foreground">Transmission</Label>
                  <Select value={transmission} onValueChange={onTransmissionChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSMISSIONS.map((value) => (
                        <SelectItem key={value} value={value} className="capitalize">
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-0 space-y-2">
                  <Label className="text-xs text-muted-foreground">Fuel Type</Label>
                  <Select value={fuelType} onValueChange={onFuelTypeChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FUEL_TYPES.map((value) => (
                        <SelectItem key={value} value={value} className="capitalize">
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </BookingDetailCardContent>
            </BookingDetailCard>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function SelectedCarSummary({ car, durationLabel }: { car: Car; durationLabel: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/15 px-3 py-2.5">
      <img
        src={getCarImage(car)}
        alt={`${car.make} ${car.model}`}
        className="h-12 w-16 shrink-0 rounded-md object-cover border border-border/30"
      />
      <div className="min-w-0">
        <p className="text-sm font-medium">
          {car.year} {car.make} {car.model}
        </p>
        <p className="text-xs text-muted-foreground">
          ${car.dailyRate}/day · {durationLabel}
        </p>
      </div>
    </div>
  );
}

function SelectedCustomerSummary({ customer }: { customer: User }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/15 px-3 py-2.5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border/30 bg-muted/30">
        <Users className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium">{customer.name ?? "Unknown"}</p>
        <p className="text-xs text-muted-foreground truncate">{customer.email ?? "No email"}</p>
        {customer.phone && (
          <p className="text-xs text-muted-foreground">{customer.phone}</p>
        )}
      </div>
    </div>
  );
}

export function AdminCreateBookingWizard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [searching, setSearching] = useState(false);

  const [pickupLocationId, setPickupLocationId] = useState("");
  const [dropoffLocationId, setDropoffLocationId] = useState("");
  const [pickupLocationName, setPickupLocationName] = useState("");
  const [dropoffLocationName, setDropoffLocationName] = useState("");
  const [pickupDate, setPickupDate] = useState(today);
  const [pickupTime, setPickupTime] = useState("10:00");
  const [returnDate, setReturnDate] = useState(tomorrow);
  const [returnTime, setReturnTime] = useState("10:00");
  const [vehicleType, setVehicleType] = useState("all");
  const [transmission, setTransmission] = useState("all");
  const [fuelType, setFuelType] = useState("all");

  const [unavailableIds, setUnavailableIds] = useState<string[] | null>(null);
  const [selectedCarId, setSelectedCarId] = useState("");
  const [userId, setUserId] = useState("");
  const [servicesForm, setServicesForm] = useState<BookingServicesFormState>(emptyServicesFormState());
  const [notes, setNotes] = useState("");

  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerPassword, setNewCustomerPassword] = useState("");

  const { data: locations, isLoading: locationsLoading } = useQuery({
    queryKey: ["locations", { activeOnly: true }],
    queryFn: () => locationsApi.list(true),
    enabled: step === 1,
  });
  const { data: cars, isLoading: carsLoading } = useQuery({
    queryKey: ["cars"],
    queryFn: () => carsApi.list(),
    enabled: step >= 2,
  });
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.listUsers(),
    enabled: step >= 3,
  });
  const { data: services } = useQuery({
    queryKey: ["services", { activeOnly: true }],
    queryFn: () => servicesApi.list(true),
    enabled: step >= 4,
  });

  const adminCreate = useMutation({
    mutationFn: bookingsApi.adminCreate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookings"] }),
  });

  const createCustomer = useMutation({
    mutationFn: usersApi.createCustomer,
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setUserId(customer._id);
      toast.success("Customer created and selected");
      setAddCustomerOpen(false);
      setNewCustomerName("");
      setNewCustomerEmail("");
      setNewCustomerPhone("");
      setNewCustomerPassword("");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const customers = useMemo(
    () => (users ?? []).filter((u) => !isStaffRole(u.role)),
    [users],
  );

  const locationsMap = useMemo(() => {
    const m = new Map<string, string>();
    (locations ?? []).forEach((l) => m.set(l._id, l.name));
    return m;
  }, [locations]);

  const unavailableSet = useMemo(() => new Set(unavailableIds ?? []), [unavailableIds]);

  const baseAvailableCars = useMemo(() => {
    if (unavailableIds === null) return [];
    return (cars ?? []).filter((car) => car.isAvailable && !unavailableSet.has(car._id));
  }, [cars, unavailableIds, unavailableSet]);

  const availableCars = useMemo(() => {
    return baseAvailableCars.filter((car) => {
      if (vehicleType !== "all" && car.category !== vehicleType) return false;
      if (transmission !== "all" && car.transmission !== transmission) return false;
      if (fuelType !== "all" && car.fuelType !== fuelType) return false;
      return true;
    });
  }, [baseAvailableCars, vehicleType, transmission, fuelType]);

  const hasActiveFilters =
    vehicleType !== "all" || transmission !== "all" || fuelType !== "all";

  const clearCarFilters = useCallback(() => {
    setVehicleType("all");
    setTransmission("all");
    setFuelType("all");
    setSelectedCarId("");
  }, []);

  const syncSelectedCarWithFilters = useCallback(
    (next: { vehicleType?: string; transmission?: string; fuelType?: string }) => {
      if (!selectedCarId) return;
      const car = (cars ?? []).find((c) => c._id === selectedCarId);
      if (!car) return;

      const nextVehicleType = next.vehicleType ?? vehicleType;
      const nextTransmission = next.transmission ?? transmission;
      const nextFuelType = next.fuelType ?? fuelType;

      const stillMatches =
        (nextVehicleType === "all" || car.category === nextVehicleType) &&
        (nextTransmission === "all" || car.transmission === nextTransmission) &&
        (nextFuelType === "all" || car.fuelType === nextFuelType);

      if (!stillMatches) setSelectedCarId("");
    },
    [cars, fuelType, selectedCarId, transmission, vehicleType],
  );

  const handleVehicleTypeChange = useCallback(
    (value: string) => {
      setVehicleType(value);
      syncSelectedCarWithFilters({ vehicleType: value });
    },
    [syncSelectedCarWithFilters],
  );

  const handleTransmissionChange = useCallback(
    (value: string) => {
      setTransmission(value);
      syncSelectedCarWithFilters({ transmission: value });
    },
    [syncSelectedCarWithFilters],
  );

  const handleFuelTypeChange = useCallback(
    (value: string) => {
      setFuelType(value);
      syncSelectedCarWithFilters({ fuelType: value });
    },
    [syncSelectedCarWithFilters],
  );

  const selectedCar = useMemo(
    () => (cars ?? []).find((c) => c._id === selectedCarId),
    [cars, selectedCarId],
  );

  const selectedCustomer = useMemo(
    () => customers.find((u) => u._id === userId),
    [customers, userId],
  );

  const serviceList = services ?? [];
  const selectedServiceIds = useMemo(
    () => new Set(servicesForm.additionalServiceIds),
    [servicesForm.additionalServiceIds],
  );

  const durationLabel = formatRentalDays(
    calculateRentalDays(pickupDate, pickupTime, returnDate, returnTime),
  );

  const quote = useBookingQuote({
    dailyRate: selectedCar?.dailyRate ?? 0,
    pickupDate,
    pickupTime,
    returnDate,
    returnTime,
    services: serviceList,
    selectedServiceIds: servicesForm.additionalServiceIds,
    serviceQuantities: servicesForm.serviceQuantities,
  });

  const handleToggleService = useCallback(
    (serviceId: string) => {
      setServicesForm((state) => toggleBookingService(state, serviceId, serviceList));
    },
    [serviceList],
  );

  const handleServiceQuantityChange = useCallback(
    (serviceId: string, count: number) => {
      setServicesForm((state) => setBookingServiceQuantity(state, serviceId, count, serviceList));
    },
    [serviceList],
  );

  const handleExtraDriverNameChange = useCallback((index: number, name: string) => {
    setServicesForm((state) => setBookingExtraDriverName(state, index, name));
  }, []);

  const validateSchedule = () => {
    if (!pickupLocationId || !dropoffLocationId) {
      toast.error("Please select pickup and drop-off locations");
      return false;
    }
    if (!isValidRentalPeriod(pickupDate, pickupTime, returnDate, returnTime)) {
      toast.error("Drop-off must be after pickup date and time");
      return false;
    }
    return true;
  };

  const handleSearchCars = async () => {
    if (!validateSchedule()) return;

    setPickupLocationName(locationsMap.get(pickupLocationId) ?? "");
    setDropoffLocationName(locationsMap.get(dropoffLocationId) ?? "");
    setSearching(true);
    void queryClient.prefetchQuery({ queryKey: ["cars"], queryFn: () => carsApi.list() });
    try {
      const ids = await bookingsApi.getUnavailableCarIds(
        pickupDate,
        returnDate,
        pickupTime,
        returnTime,
      );
      setUnavailableIds(ids);
      setSelectedCarId("");
      setStep(2);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSearching(false);
    }
  };

  const handleCreateCustomer = () => {
    if (!newCustomerName.trim() || !newCustomerEmail.trim() || !newCustomerPassword) {
      toast.error("Please fill in name, email, and password");
      return;
    }
    createCustomer.mutate({
      name: newCustomerName.trim(),
      email: newCustomerEmail.trim(),
      password: newCustomerPassword,
      phone: newCustomerPhone.trim() || undefined,
    });
  };

  const handleCreateBooking = async () => {
    if (!userId || !selectedCarId) {
      toast.error("Please complete all previous steps");
      return;
    }
    const servicesError = validateBookingExtraDrivers(servicesForm, serviceList);
    if (servicesError) {
      toast.error(servicesError);
      return;
    }

    setSubmitting(true);
    try {
      const servicesPayload = buildServicesPayload(servicesForm, serviceList);
      const booking = await adminCreate.mutateAsync({
        userId,
        carId: selectedCarId,
        pickupLocationId,
        dropoffLocationId,
        pickupDate: new Date(pickupDate).toISOString(),
        pickupTime,
        returnDate: new Date(returnDate).toISOString(),
        returnTime,
        ...servicesPayload,
        notes: notes || undefined,
      });
      toast.success("Booking created successfully");
      navigate(`/admin/bookings/${booking._id}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const goBackToSchedule = () => {
    setUnavailableIds(null);
    setSelectedCarId("");
    setStep(1);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-2 sm:px-6 sm:py-3">
      <div className="flex items-start gap-3">
        <Hint label="Back to bookings">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mt-0.5 shrink-0 cursor-pointer"
            aria-label="Back to bookings"
            onClick={() => navigate("/admin/bookings")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Hint>
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Create Booking</h2>
          <p className="text-sm text-muted-foreground">
            Step {step} of {WIZARD_STEPS.length} — {WIZARD_STEPS[step - 1]?.label}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/60 px-3 py-2 sm:px-5 sm:py-2.5">
        <WizardStepper currentStep={step} />
      </div>

      {step === 1 && (
        <div className="space-y-4">
          {locationsLoading && !locations ? (
            <Skeleton className="h-40 w-full rounded-xl" />
          ) : (
          <BookingLocationsSection
            locations={locations ?? []}
            pickupLocationId={pickupLocationId}
            dropoffLocationId={dropoffLocationId}
            onPickupLocationChange={setPickupLocationId}
            onDropoffLocationChange={setDropoffLocationId}
          />
          )}
          <BookingDatesSection
            today={today}
            pickupDate={pickupDate}
            returnDate={returnDate}
            pickupTime={pickupTime}
            returnTime={returnTime}
            durationLabel={durationLabel}
            onPickupDateChange={setPickupDate}
            onReturnDateChange={setReturnDate}
            onPickupTimeChange={setPickupTime}
            onReturnTimeChange={setReturnTime}
          />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              className="cursor-pointer"
              onClick={() => navigate("/admin/bookings")}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="cursor-pointer"
              disabled={searching}
              onClick={handleSearchCars}
            >
              {searching ? (
                "Searching..."
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search Available Cars
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <ScheduleSummary
            pickupLocationName={pickupLocationName}
            dropoffLocationName={dropoffLocationName}
            pickupDate={pickupDate}
            pickupTime={pickupTime}
            returnDate={returnDate}
            returnTime={returnTime}
          />

          {searching || (carsLoading && !cars) ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              {baseAvailableCars.length > 0 && (
                <CarFiltersPanel
                  vehicleType={vehicleType}
                  transmission={transmission}
                  fuelType={fuelType}
                  onVehicleTypeChange={handleVehicleTypeChange}
                  onTransmissionChange={handleTransmissionChange}
                  onFuelTypeChange={handleFuelTypeChange}
                />
              )}

              {availableCars.length === 0 ? (
            <div className="rounded-xl border border-border/50 bg-card/60 px-6 py-12 text-center">
              <CarFront className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-medium">No vehicles available</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {baseAvailableCars.length > 0 && hasActiveFilters
                  ? "No vehicles match your filters for these dates. Try adjusting filters or change dates."
                  : "No cars are free for the selected dates and times. Try different dates or times."}
              </p>
              <div className="mt-4 flex flex-col items-center justify-center gap-2 sm:flex-row">
                {baseAvailableCars.length > 0 && hasActiveFilters && (
                  <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer"
                    onClick={clearCarFilters}
                  >
                    Clear filters
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
                  onClick={goBackToSchedule}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Change Dates
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {availableCars.length} vehicle{availableCars.length !== 1 ? "s" : ""} available for your dates
              </p>
              <div className="space-y-2">
                {availableCars.map((car) => {
                  const selected = selectedCarId === car._id;
                  return (
                    <button
                      key={car._id}
                      type="button"
                      onClick={() => setSelectedCarId(car._id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors cursor-pointer",
                        selected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border/50 bg-card/60 hover:bg-muted/20",
                      )}
                    >
                      <img
                        src={getCarImage(car)}
                        alt={`${car.make} ${car.model}`}
                        className="h-16 w-24 shrink-0 rounded-lg object-cover border border-border/30"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-sm">
                            {car.year} {car.make} {car.model}
                          </p>
                          <Badge className={cn("text-[10px] capitalize", vehicleCategoryBadgeClass(car.category))}>
                            {formatVehicleCategoryLabel(car.category)}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground capitalize">
                          {car.transmission} · {car.fuelType} · {car.seats} seats
                        </p>
                        <p className="mt-1 text-sm font-semibold text-primary">${car.dailyRate}/day</p>
                      </div>
                      {selected && (
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary">
                          <CircleCheckBig className="h-[15px] w-[15px] text-white" strokeWidth={2} fill="none" aria-hidden />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
            </>
          )}

          {availableCars.length > 0 && (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <Button type="button" variant="outline" className="cursor-pointer" onClick={goBackToSchedule}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                type="button"
                className="cursor-pointer"
                disabled={!selectedCarId}
                onClick={() => setStep(3)}
              >
                Continue
              </Button>
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <ScheduleSummary
            pickupLocationName={pickupLocationName}
            dropoffLocationName={dropoffLocationName}
            pickupDate={pickupDate}
            pickupTime={pickupTime}
            returnDate={returnDate}
            returnTime={returnTime}
          />

          {selectedCar && (
            <SelectedCarSummary car={selectedCar} durationLabel={durationLabel} />
          )}

          <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">Select Customer</h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs cursor-pointer"
                onClick={() => setAddCustomerOpen(true)}
              >
                <UserPlus className="mr-1 h-3.5 w-3.5" />
                Add Customer
              </Button>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Customer</Label>
              {usersLoading && !users ? (
                <Skeleton className="h-10 w-full rounded-md" />
              ) : (
              <CustomerSearchSelect
                customers={customers}
                value={userId}
                onChange={setUserId}
                placeholder="Select a customer"
              />
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button type="button" variant="outline" className="cursor-pointer" onClick={() => setStep(2)}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              type="button"
              className="cursor-pointer"
              disabled={!userId}
              onClick={() => setStep(4)}
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 4 && selectedCar && (
        <div className="space-y-4">
          <ScheduleSummary
            pickupLocationName={pickupLocationName}
            dropoffLocationName={dropoffLocationName}
            pickupDate={pickupDate}
            pickupTime={pickupTime}
            returnDate={returnDate}
            returnTime={returnTime}
          />

          {selectedCar && (
            <SelectedCarSummary car={selectedCar} durationLabel={durationLabel} />
          )}
          {selectedCustomer && (
            <SelectedCustomerSummary customer={selectedCustomer} />
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              {serviceList.length > 0 && (
                <BookingServicesSection
                  services={serviceList}
                  selectedIds={selectedServiceIds}
                  serviceQuantities={servicesForm.serviceQuantities}
                  extraDriverNames={servicesForm.extraDriverNames}
                  onToggleService={handleToggleService}
                  onServiceQuantityChange={handleServiceQuantityChange}
                  onExtraDriverNameChange={handleExtraDriverNameChange}
                />
              )}
              <BookingNotesSection notes={notes} onNotesChange={setNotes} />
            </div>
            <BookingSummaryPanel
              quote={quote}
              pickupDate={pickupDate}
              pickupTime={pickupTime}
              returnDate={returnDate}
              returnTime={returnTime}
              loading={submitting}
              onSubmit={handleCreateBooking}
            />
          </div>

          <div className="flex justify-start">
            <Button type="button" variant="outline" className="cursor-pointer" onClick={() => setStep(3)}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </div>
      )}

      <Dialog open={addCustomerOpen} onOpenChange={setAddCustomerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="wizard-customer-name">Full Name</Label>
              <Input
                id="wizard-customer-name"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wizard-customer-email">Email</Label>
              <Input
                id="wizard-customer-email"
                type="email"
                value={newCustomerEmail}
                onChange={(e) => setNewCustomerEmail(e.target.value)}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wizard-customer-phone">Phone (optional)</Label>
              <Input
                id="wizard-customer-phone"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                placeholder="+1 403 555 0100"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wizard-customer-password">Temporary Password</Label>
              <Input
                id="wizard-customer-password"
                type="password"
                value={newCustomerPassword}
                onChange={(e) => setNewCustomerPassword(e.target.value)}
                placeholder="Min. 6 characters"
                minLength={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setAddCustomerOpen(false)} className="cursor-pointer">
              Cancel
            </Button>
            <Button
              onClick={handleCreateCustomer}
              disabled={createCustomer.isPending}
              className="cursor-pointer"
            >
              {createCustomer.isPending ? "Creating..." : "Create & Select"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
