import { memo, useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { carsApi } from "@/api/cars.api.ts";
import { bookingsApi } from "@/api/bookings.api.ts";
import Navbar from "@/components/navbar.tsx";
import Footer from "@/components/footer.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { DatePicker } from "@/components/date-picker.tsx";
import { Slider } from "@/components/ui/slider.tsx";
import { Users, Fuel, Gauge, SlidersHorizontal, X, Car } from "lucide-react";
import { format } from "date-fns";
import {
  formatVehicleCategoryLabel,
  isCustomerVisibleVehicle,
  normalizeVehicleTypeFilter,
  vehicleCategoryBadgeClass,
  VEHICLE_TYPE_FILTER_OPTIONS,
} from "@/lib/vehicleCategories.ts";
import { cn } from "@/lib/utils.ts";
import { carPrimaryImage, resolveMediaUrl } from "@/lib/mediaUrl.ts";

const CATEGORIES = VEHICLE_TYPE_FILTER_OPTIONS;
const TRANSMISSIONS = ["all", "automatic", "manual"] as const;
const FUEL_TYPES = ["all", "gasoline", "diesel", "electric", "hybrid"] as const;

const CAR_IMAGES: Record<string, string> = {
  economy: "https://images.unsplash.com/photo-1690278289651-895463644114?w=600&q=80",
  sedan: "https://images.unsplash.com/photo-1679891647402-330589ea9309?w=600&q=80",
  suv: "https://images.unsplash.com/photo-1742869246328-847a516cd30a?w=600&q=80",
  luxury: "https://images.unsplash.com/photo-1650716748498-a2ce13ed0f2d?w=600&q=80",
  sports: "https://images.unsplash.com/photo-1683916138305-98a86efc9fc9?w=600&q=80",
  compact: "https://images.unsplash.com/photo-1647708790575-05985b7f670c?w=600&q=80",
  van: "https://images.unsplash.com/photo-1701918190763-3851cf361f96?w=600&q=80",
};

const today = format(new Date(), "yyyy-MM-dd");
const tomorrow = format(new Date(Date.now() + 86400000), "yyyy-MM-dd");

const browseDateFieldClass =
  "h-10 min-h-10 rounded-md border border-input bg-background px-3 text-sm shadow-xs transition-colors hover:bg-accent/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

const CarsFiltersPanel = memo(function CarsFiltersPanel({
  transmission,
  fuelType,
  maxPrice,
  hasFilters,
  onTransmissionChange,
  onFuelTypeChange,
  onMaxPriceChange,
  onClearFilters,
}: {
  transmission: string;
  fuelType: string;
  maxPrice: number[];
  hasFilters: boolean;
  onTransmissionChange: (value: string) => void;
  onFuelTypeChange: (value: string) => void;
  onMaxPriceChange: (value: number[]) => void;
  onClearFilters: () => void;
}) {
  return (
    <div className="mb-5 rounded-xl border border-border/50 bg-card px-4 pb-4 pt-2 sm:mb-6">
      <div className="mb-3 flex min-h-8 items-center justify-between gap-3">
        <h3 className="font-semibold text-sm">Filters</h3>
        <button
          type="button"
          onClick={onClearFilters}
          aria-hidden={!hasFilters}
          tabIndex={hasFilters ? 0 : -1}
          className={cn(
            "flex shrink-0 cursor-pointer items-center gap-1 text-xs text-primary hover:underline",
            !hasFilters && "pointer-events-none invisible",
          )}
        >
          <X className="h-3 w-3" /> Clear all
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="min-w-0 space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Transmission</label>
          <Select value={transmission} onValueChange={onTransmissionChange}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TRANSMISSIONS.map((t) => (
                <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0 space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Fuel Type</label>
          <Select value={fuelType} onValueChange={onFuelTypeChange}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {FUEL_TYPES.map((f) => (
                <SelectItem key={f} value={f} className="capitalize">{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0 space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Max Price</label>
          <div className="flex h-9 items-center">
            <Slider min={20} max={500} step={10} value={maxPrice} onValueChange={onMaxPriceChange} className="w-full" />
          </div>
          <p className="text-[11px] text-muted-foreground">${maxPrice[0]}/day</p>
        </div>
      </div>
    </div>
  );
});

const CarListingCard = memo(function CarListingCard({
  car,
  onOpen,
  onBook,
}: {
  car: NonNullable<Awaited<ReturnType<typeof carsApi.list>>>[number];
  onOpen: (carId: string) => void;
  onBook: () => void;
}) {
  const imgSrc = carPrimaryImage(car, CAR_IMAGES[car.category] ?? CAR_IMAGES.sedan);

  return (
    <div className="transition-transform duration-300 hover:-translate-y-1">
      <Card
        className="group cursor-pointer overflow-hidden border-border/50 bg-card/60 transition-all duration-300 hover:border-primary/40"
        onClick={() => onOpen(car._id)}
      >
        <div className="relative h-48 overflow-hidden">
          <img
            src={resolveMediaUrl(imgSrc)}
            alt={`${car.make} ${car.model}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3">
            <Badge className={`text-xs capitalize ${vehicleCategoryBadgeClass(car.category)}`}>
              {car.category}
            </Badge>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="mb-2 flex items-start justify-between">
            <div>
              <h3 className="font-semibold">{car.year} {car.make} {car.model}</h3>
              <p className="text-xs capitalize text-muted-foreground">{car.color} · {car.transmission}</p>
            </div>
            <div className="shrink-0 text-right">
              <span className="text-xl font-bold text-primary">${car.dailyRate}</span>
              <span className="text-xs text-muted-foreground">/day</span>
            </div>
          </div>
          <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{car.seats} seats</span>
            <span className="flex items-center gap-1"><Fuel className="h-3 w-3" />{car.fuelType}</span>
            {car.mileage && (
              <span className="flex items-center gap-1">
                <Gauge className="h-3 w-3" />{car.mileage.toLocaleString()} km
              </span>
            )}
          </div>
          {car.features && car.features.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {car.features.slice(0, 3).map((f) => (
                <span key={f} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground">
                  {f}
                </span>
              ))}
            </div>
          )}
          <Button
            className="h-9 w-full cursor-pointer text-sm"
            onClick={(e) => {
              e.stopPropagation();
              onBook();
            }}
          >
            Book Now
          </Button>
        </CardContent>
      </Card>
    </div>
  );
});

export default function CarsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [category, setCategory] = useState(() => normalizeVehicleTypeFilter(searchParams.get("category")));
  const [transmission, setTransmission] = useState("all");
  const [fuelType, setFuelType] = useState("all");
  const [maxPrice, setMaxPrice] = useState([500]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("default");

  // Date-based availability — only filter when dates are explicitly chosen
  const [pickupDate, setPickupDate] = useState(searchParams.get("pickupDate") ?? "");
  const [dropoffDate, setDropoffDate] = useState(searchParams.get("dropoffDate") ?? "");
  const [pickupTime] = useState(searchParams.get("pickupTime") ?? "10:00");
  const [dropoffTime] = useState(searchParams.get("dropoffTime") ?? "10:00");

  const hasDateFilter = Boolean(pickupDate && dropoffDate);

  const { data: carsRaw, isLoading: carsLoading } = useQuery({
    queryKey: ["cars"],
    queryFn: () => carsApi.list(),
  });
  const { data: unavailableIds, isLoading: unavailableLoading } = useQuery({
    queryKey: ["bookings", "unavailable", pickupDate, pickupTime, dropoffDate, dropoffTime],
    queryFn: () => bookingsApi.getUnavailableCarIds(pickupDate, dropoffDate, pickupTime, dropoffTime),
    enabled: hasDateFilter,
  });

  const unavailableSet = useMemo(() => new Set(unavailableIds ?? []), [unavailableIds]);

  const filtered = useMemo(() => (carsRaw ?? []).filter((car) => {
    if (!isCustomerVisibleVehicle(car.category)) return false;
    if (hasDateFilter && unavailableSet.has(car._id)) return false;
    if (category !== "all" && car.category !== category) return false;
    if (transmission !== "all" && car.transmission !== transmission) return false;
    if (fuelType !== "all" && car.fuelType !== fuelType) return false;
    if (car.dailyRate > maxPrice[0]) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "price_asc") return a.dailyRate - b.dailyRate;
    if (sortBy === "price_desc") return b.dailyRate - a.dailyRate;
    return 0;
  }), [carsRaw, hasDateFilter, unavailableSet, category, transmission, fuelType, maxPrice, sortBy]);

  const clearDates = () => {
    setPickupDate("");
    setDropoffDate("");
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("pickupDate");
      next.delete("dropoffDate");
      next.delete("pickupTime");
      next.delete("dropoffTime");
      return next;
    }, { replace: true });
  };

  const clearFilters = () => {
    setCategory("all");
    setTransmission("all");
    setFuelType("all");
    setMaxPrice([500]);
    setSortBy("default");
  };

  const hasFilters = category !== "all" || transmission !== "all" || fuelType !== "all" || maxPrice[0] < 500 || sortBy !== "default";

  const handleBookNow = useCallback(() => {
    navigate("/contact");
  }, [navigate]);

  const handleOpenCar = useCallback((carId: string) => {
    navigate(`/cars/${carId}`);
  }, [navigate]);

  const isLoading = carsLoading || (hasDateFilter && unavailableLoading);

  const availabilityLabel = hasDateFilter
    ? `${filtered.length} car${filtered.length !== 1 ? "s" : ""} available for selected dates`
    : `${filtered.length} car${filtered.length !== 1 ? "s" : ""} — select dates to check availability`;
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="pt-16">
        {/* Header */}
        <div className="border-b border-border/50 bg-card/30 py-4 sm:py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold sm:text-3xl">Browse Cars</h1>
                <p className="mt-1 min-h-5 text-sm text-muted-foreground sm:text-base">
                  {isLoading ? "Loading..." : availabilityLabel}
                </p>
              </div>
              <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto sm:gap-3">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-10 flex-1 sm:w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant={showFilters ? "default" : "secondary"}
                  onClick={() => setShowFilters(!showFilters)}
                  className="h-10 shrink-0 cursor-pointer gap-2 px-3 sm:px-4"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  <Badge
                    aria-hidden={!hasFilters}
                    className={cn(
                      "ml-0.5 flex h-4 w-4 items-center justify-center p-0 text-[10px]",
                      !hasFilters && "invisible",
                    )}
                  >
                    !
                  </Badge>
                </Button>
              </div>
            </div>

            {/* Availability dates */}
            <div className="mt-3 w-full rounded-lg border border-border/60 bg-background px-3 pb-3 pt-1.5 shadow-sm sm:mt-4 sm:flex sm:items-end sm:gap-3 sm:px-3 sm:py-2">
              <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:gap-3">
                <div className="min-w-0 space-y-1">
                  <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Pickup
                  </label>
                  <DatePicker
                    value={pickupDate}
                    minDate={today}
                    label="Pick up"
                    selectedHint="Pick up"
                    onChange={(date) => {
                      setPickupDate(date);
                      if (dropoffDate && dropoffDate < date) setDropoffDate(date);
                      setSearchParams((prev) => {
                        const next = new URLSearchParams(prev);
                        next.set("pickupDate", date);
                        if (dropoffDate && dropoffDate < date) next.set("dropoffDate", date);
                        return next;
                      }, { replace: true });
                    }}
                    className="w-full min-w-0"
                    triggerClassName={browseDateFieldClass}
                    align="start"
                    placeholder="Pickup date"
                  />
                </div>
                <div className="min-w-0 space-y-1">
                  <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Drop-off
                  </label>
                  <DatePicker
                    value={dropoffDate}
                    minDate={pickupDate || today}
                    label="Drop-off"
                    selectedHint="Drop-off"
                    onChange={(date) => {
                      setDropoffDate(date);
                      setSearchParams((prev) => {
                        const next = new URLSearchParams(prev);
                        next.set("dropoffDate", date);
                        return next;
                      }, { replace: true });
                    }}
                    className="w-full min-w-0"
                    triggerClassName={browseDateFieldClass}
                    align="start"
                    placeholder="Drop-off date"
                  />
                </div>
              </div>
              {hasDateFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearDates}
                  className="mt-2 h-10 shrink-0 cursor-pointer px-2 text-xs text-muted-foreground hover:text-foreground sm:mt-0"
                >
                  <X className="mr-1 h-3.5 w-3.5" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Category Tabs */}
          <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium capitalize transition-all cursor-pointer ${
                  category === cat
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {formatVehicleCategoryLabel(cat)}
              </button>
            ))}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <CarsFiltersPanel
              transmission={transmission}
              fuelType={fuelType}
              maxPrice={maxPrice}
              hasFilters={hasFilters}
              onTransmissionChange={setTransmission}
              onFuelTypeChange={setFuelType}
              onMaxPriceChange={setMaxPrice}
              onClearFilters={clearFilters}
            />
          )}

          {/* Car Grid */}
          <div className="min-h-[28rem]">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-72 w-full rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No cars available</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {hasFilters
                  ? "Try adjusting your filters"
                  : hasDateFilter
                  ? "No cars available for these dates — try different dates"
                  : "No cars match your criteria"}
              </p>
              {(hasFilters || hasDateFilter) && (
                <Button
                  onClick={() => {
                    clearFilters();
                    clearDates();
                  }}
                  className="cursor-pointer"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((car) => (
                <CarListingCard
                    key={car._id}
                  car={car}
                  onOpen={handleOpenCar}
                  onBook={handleBookNow}
                />
              ))}
            </div>
          )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
