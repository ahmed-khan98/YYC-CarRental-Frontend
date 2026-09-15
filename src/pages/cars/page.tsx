import { memo, useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { carsApi } from "@/api/cars.api.ts";
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
  "h-9 min-h-9 rounded-md border border-border/70 bg-background px-2.5 text-[13px] shadow-none transition-colors hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

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
    <div className="mb-5 rounded-xl border border-border/50 bg-card px-4 py-2 sm:mb-6">
      <div className="mb-1.5 flex items-center justify-between gap-3">
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
    queryKey: hasDateFilter
      ? ["cars", "available", pickupDate, pickupTime, dropoffDate, dropoffTime]
      : ["cars"],
    queryFn: () =>
      hasDateFilter
        ? carsApi.listAvailable({
            pickupDate,
            returnDate: dropoffDate,
            pickupTime,
            returnTime: dropoffTime,
          })
        : carsApi.list(),
  });

  const filtered = useMemo(() => (carsRaw ?? []).filter((car) => {
    if (!isCustomerVisibleVehicle(car.category)) return false;
    if (category !== "all" && car.category !== category) return false;
    if (transmission !== "all" && car.transmission !== transmission) return false;
    if (fuelType !== "all" && car.fuelType !== fuelType) return false;
    if (car.dailyRate > maxPrice[0]) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "price_asc") return a.dailyRate - b.dailyRate;
    if (sortBy === "price_desc") return b.dailyRate - a.dailyRate;
    return 0;
  }), [carsRaw, category, transmission, fuelType, maxPrice, sortBy]);

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

  const hasPanelFilters = transmission !== "all" || fuelType !== "all" || maxPrice[0] < 500;
  const hasFilters = hasPanelFilters || category !== "all" || sortBy !== "default";

  const handleBookNow = useCallback(() => {
    navigate("/contact");
  }, [navigate]);

  const handleOpenCar = useCallback((carId: string) => {
    navigate(`/cars/${carId}`);
  }, [navigate]);

  const isLoading = carsLoading;

  const availabilityLabel = hasDateFilter
    ? `${filtered.length} car${filtered.length !== 1 ? "s" : ""} available for selected dates`
    : `${filtered.length} car${filtered.length !== 1 ? "s" : ""} — select dates to check availability`;
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="pt-16">
        {/* Header */}
        <div className="border-b border-border/50 bg-card/30 py-3 sm:py-4">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-xl font-bold sm:text-2xl">Browse Cars</h1>
                <p className="mt-0.5 truncate text-xs text-muted-foreground sm:text-sm">
                  {isLoading ? "Loading..." : availabilityLabel}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-9 w-[8.5rem] sm:w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant={showFilters ? "default" : "outline"}
                  onClick={() => setShowFilters(!showFilters)}
                  className="h-9 shrink-0 cursor-pointer gap-1.5 px-2.5 sm:px-3"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Filters</span>
                  {hasPanelFilters && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground sm:bg-primary" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
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
                className="min-w-0 flex-1 sm:w-40 sm:flex-none"
                triggerClassName={browseDateFieldClass}
                align="start"
                placeholder="Pickup"
              />
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
                className="min-w-0 flex-1 sm:w-40 sm:flex-none"
                triggerClassName={browseDateFieldClass}
                align="start"
                placeholder="Drop-off"
              />
              {hasDateFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearDates}
                  className="h-9 shrink-0 cursor-pointer px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                  <span className="sr-only">Clear dates</span>
                </Button>
              )}
              <div className="hidden h-5 w-px bg-border sm:block" />
              <div className="inline-flex h-9 items-center rounded-md border border-border/70 bg-background p-0.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={cn(
                      "h-8 shrink-0 cursor-pointer rounded-[5px] px-2.5 text-xs font-medium transition-colors",
                      category === cat
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {formatVehicleCategoryLabel(cat)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 sm:py-6">

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
