import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { carsApi } from "@/api/cars.api.ts";
import { locationsApi } from "@/api/locations.api.ts";
import Navbar from "@/components/navbar.tsx";
import Footer from "@/components/footer.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { ArrowLeft, Users, Fuel, Gauge, Cog, MapPin, CheckCircle } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils.ts";
import { vehicleCategoryBadgeClass } from "@/lib/vehicleCategories.ts";
import { resolveMediaUrl } from "@/lib/mediaUrl.ts";

const CAR_IMAGES: Record<string, string> = {
  economy: "https://images.unsplash.com/photo-1690278289651-895463644114?w=800&q=80",
  sedan: "https://images.unsplash.com/photo-1679891647402-330589ea9309?w=800&q=80",
  suv: "https://images.unsplash.com/photo-1742869246328-847a516cd30a?w=800&q=80",
  luxury: "https://images.unsplash.com/photo-1650716748498-a2ce13ed0f2d?w=800&q=80",
  sports: "https://images.unsplash.com/photo-1683916138305-98a86efc9fc9?w=800&q=80",
  compact: "https://images.unsplash.com/photo-1647708790575-05985b7f670c?w=800&q=80",
  van: "https://images.unsplash.com/photo-1701918190763-3851cf361f96?w=800&q=80",
};

export default function CarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    setActiveImage(0);
  }, [id]);

  const { data: car, isLoading: carLoading } = useQuery({
    queryKey: ["cars", id],
    queryFn: () => carsApi.get(id!),
    enabled: !!id,
  });
  const { data: location } = useQuery({
    queryKey: ["locations", car?.locationId],
    queryFn: () => locationsApi.get(car!.locationId!),
    enabled: !!car?.locationId,
  });

  if (carLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 mx-auto max-w-5xl px-4">
          <Skeleton className="h-72 w-full rounded-xl mb-6" />
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Car not found</h2>
          <Button onClick={() => navigate("/cars")} className="cursor-pointer">Back to Cars</Button>
        </div>
      </div>
    );
  }

  const images = (
    car.resolvedImageUrls?.length
      ? car.resolvedImageUrls
      : car.imageUrl
        ? [car.imageUrl]
        : [CAR_IMAGES[car.category] ?? CAR_IMAGES.sedan]
  ).map((url) => resolveMediaUrl(url));

  const safeActiveImage = activeImage < images.length ? activeImage : 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="pt-[4.5rem] flex-1">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate("/cars")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors cursor-pointer text-sm"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Cars
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-muted/30">
                  <img
                    src={images[safeActiveImage]}
                    alt={`${car.make} ${car.model}`}
                    className="h-56 w-full object-cover sm:h-72"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <Badge className={cn("capitalize", vehicleCategoryBadgeClass(car.category))}>
                      {car.category}
                    </Badge>
                    {!car.isAvailable && <Badge className="bg-destructive text-destructive-foreground">Unavailable</Badge>}
                  </div>
                </div>
                {images.length > 1 && (
                  <div className="-mx-4 flex gap-2 overflow-x-auto overscroll-x-contain touch-pan-x px-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
                    {images.map((url, i) => (
                      <button
                        key={`${url}-${i}`}
                        type="button"
                        onClick={() => setActiveImage(i)}
                        aria-label={`View photo ${i + 1}`}
                        aria-pressed={safeActiveImage === i}
                        className={cn(
                          "h-20 w-20 shrink-0 overflow-hidden rounded-md border-2 transition-all sm:h-24 sm:w-24",
                          safeActiveImage === i
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-border/50 opacity-80 hover:border-primary/40 hover:opacity-100",
                        )}
                      >
                        <img
                          src={url}
                          alt={`${car.make} ${car.model} thumbnail ${i + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-4"
              >
                <div>
                  <h1 className="text-3xl font-bold">{car.year} {car.make} {car.model}</h1>
                  <p className="text-muted-foreground capitalize mt-1">{car.color} · {car.category}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon: Users, label: "Seats", value: `${car.seats}` },
                    { icon: Cog, label: "Transmission", value: car.transmission },
                    { icon: Fuel, label: "Fuel", value: car.fuelType },
                    {
                      icon: Gauge,
                      label: "Daily Mileage",
                      value: car.dailyMileageLimit ? `${car.dailyMileageLimit} km/day` : "Unlimited",
                    },
                  ].map((item) => (
                    <div key={item.label} className="bg-card border border-border/50 rounded-xl p-3 text-center">
                      <item.icon className="h-4 w-4 text-primary mx-auto mb-1" />
                      <div className="text-xs text-muted-foreground">{item.label}</div>
                      <div className="text-sm font-medium capitalize">{item.value}</div>
                    </div>
                  ))}
                </div>

                {car.description && (
                  <div>
                    <h3 className="font-semibold mb-2">About this car</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{car.description}</p>
                  </div>
                )}

                {car.features && car.features.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Features</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {car.features.map((f) => (
                        <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-3 w-3 text-primary shrink-0" />
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {location && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <span className="font-medium text-foreground">{location.name}</span>
                      <br />
                      {location.address}, {location.city}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <div className="sticky top-24 bg-card border border-border/50 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-3xl font-bold text-primary">${car.dailyRate}</span>
                    <span className="text-muted-foreground text-sm">/day</span>
                  </div>
                  <Badge className={car.isAvailable ? "bg-primary/20 text-primary border-primary/30" : "bg-destructive/20 text-destructive border-destructive/30"}>
                    {car.isAvailable ? "Available" : "Unavailable"}
                  </Badge>
                </div>

                <div className="border-t border-border/50 pt-4">
                  <Button
                    className="w-full cursor-pointer"
                    size="lg"
                    disabled={!car.isAvailable}
                    onClick={() => navigate("/contact")}
                  >
                    {car.isAvailable ? "Book This Car" : "Not Available"}
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  No payment at booking. Cancel 72+ hrs before pick-up: 1 day fee due. Within 72 hrs: full amount due.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
