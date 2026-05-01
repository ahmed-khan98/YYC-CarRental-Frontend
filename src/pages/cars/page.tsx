import { useState } from "react";
import { useQuery } from "convex/react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "@/convex/_generated/api.js";
import Navbar from "@/components/navbar.tsx";
import Footer from "@/components/footer.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Slider } from "@/components/ui/slider.tsx";
import { motion } from "motion/react";
import {
  Star, Users, Fuel, Gauge, SlidersHorizontal, X, Car,
} from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

const CATEGORIES = ["all", "economy", "compact", "sedan", "suv", "luxury", "sports", "van"] as const;
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

export default function CarsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [category, setCategory] = useState(searchParams.get("category") ?? "all");
  const [transmission, setTransmission] = useState("all");
  const [fuelType, setFuelType] = useState("all");
  const [maxPrice, setMaxPrice] = useState([500]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("default");

  const carsRaw = useQuery(api.cars.list, { availableOnly: true });

  const filtered = (carsRaw ?? []).filter((car) => {
    if (category !== "all" && car.category !== category) return false;
    if (transmission !== "all" && car.transmission !== transmission) return false;
    if (fuelType !== "all" && car.fuelType !== fuelType) return false;
    if (car.dailyRate > maxPrice[0]) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "price_asc") return a.dailyRate - b.dailyRate;
    if (sortBy === "price_desc") return b.dailyRate - a.dailyRate;
    return 0;
  });

  const clearFilters = () => {
    setCategory("all");
    setTransmission("all");
    setFuelType("all");
    setMaxPrice([500]);
    setSortBy("default");
  };

  const hasFilters = category !== "all" || transmission !== "all" || fuelType !== "all" || maxPrice[0] < 500 || sortBy !== "default";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="pt-16">
        {/* Header */}
        <div className="border-b border-border/50 bg-card/30 py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Browse Cars</h1>
                <p className="text-muted-foreground mt-1">
                  {carsRaw === undefined ? "Loading..." : `${filtered.length} cars available`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="secondary"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {hasFilters && <Badge className="h-4 w-4 p-0 flex items-center justify-center text-[10px] ml-1">!</Badge>}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Category Tabs */}
          <div className="flex gap-2 flex-wrap mb-6">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all cursor-pointer border ${
                  category === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 rounded-xl bg-card border border-border/50"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">Filters</h3>
                {hasFilters && (
                  <button onClick={clearFilters} className="text-xs text-primary flex items-center gap-1 cursor-pointer hover:underline">
                    <X className="h-3 w-3" /> Clear all
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-medium">Transmission</label>
                  <Select value={transmission} onValueChange={setTransmission}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TRANSMISSIONS.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-medium">Fuel Type</label>
                  <Select value={fuelType} onValueChange={setFuelType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FUEL_TYPES.map((f) => <SelectItem key={f} value={f} className="capitalize">{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-medium">Max Price: ${maxPrice[0]}/day</label>
                  <Slider
                    min={20} max={500} step={10}
                    value={maxPrice}
                    onValueChange={setMaxPrice}
                    className="mt-3"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Car Grid */}
          {carsRaw === undefined ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-72 w-full rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No cars found</h3>
              <p className="text-muted-foreground text-sm mb-4">Try adjusting your filters</p>
              <Button onClick={clearFilters} className="cursor-pointer">Clear Filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((car, i) => (
                <motion.div
                  key={car._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                  whileHover={{ y: -4 }}
                >
                  <Card
                    className="overflow-hidden border-border/50 bg-card/60 hover:border-primary/40 transition-all duration-300 cursor-pointer group"
                    onClick={() => navigate(`/cars/${car._id}`)}
                  >
                    <div className="relative overflow-hidden h-48">
                      <img
                        src={car.imageUrl ?? CAR_IMAGES[car.category] ?? CAR_IMAGES.sedan}
                        alt={`${car.make} ${car.model}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-background/80 backdrop-blur border-0 text-xs capitalize">
                          {car.category}
                        </Badge>
                      </div>
                      {!car.isAvailable && (
                        <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                          <Badge className="bg-destructive text-destructive-foreground">Unavailable</Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{car.year} {car.make} {car.model}</h3>
                          <p className="text-xs text-muted-foreground capitalize">{car.color} · {car.transmission}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xl font-bold text-primary">${car.dailyRate}</span>
                          <span className="text-xs text-muted-foreground">/day</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{car.seats} seats</span>
                        <span className="flex items-center gap-1"><Fuel className="h-3 w-3" />{car.fuelType}</span>
                        {car.mileage && <span className="flex items-center gap-1"><Gauge className="h-3 w-3" />{car.mileage.toLocaleString()} km</span>}
                      </div>
                      {car.features && car.features.length > 0 && (
                        <div className="flex gap-1 flex-wrap mb-3">
                          {car.features.slice(0, 3).map((f) => (
                            <span key={f} className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{f}</span>
                          ))}
                        </div>
                      )}
                      <Button className="w-full h-9 text-sm cursor-pointer">
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
