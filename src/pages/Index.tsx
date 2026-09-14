import { motion } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import Navbar from "@/components/navbar.tsx";
import Footer from "@/components/footer.tsx";
import { ArrowRight, Search, Star, Shield, Clock, MapPin, Zap, Car, Users, Award, Calendar } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { locationsApi } from "@/api/locations.api.ts";
import { useAutoSelectSingleLocation } from "@/hooks/use-auto-select-single-location.ts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Label } from "@/components/ui/label.tsx";
import { DatePicker } from "@/components/date-picker.tsx";
import { format } from "date-fns";
import {
  formatVehicleCategoryLabel,
  VEHICLE_TYPE_OPTIONS,
} from "@/lib/vehicleCategories.ts";
import { formatTime12h } from "@/lib/timeFormat.ts";

// Real MP4 hosted in /public — do not hotlink Pexels CDN (403) or use their JPEG "download" URLs
const HERO_VIDEO = "/hero-video.mp4?v=3";

function HeroFieldLabel({
  icon: Icon,
  children,
}: {
  icon?: typeof MapPin;
  children: ReactNode;
}) {
  return (
    <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-600">
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />}
      {children}
    </Label>
  );
}

const heroFieldClass =
  "h-10 min-h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-0 text-sm font-medium text-gray-800 shadow-none hover:border-primary focus:border-primary focus-visible:border-primary focus-visible:ring-0 data-[placeholder]:text-gray-400";

const heroFieldWrap = "space-y-1.5";
const heroSearchCardClass = "rounded-2xl bg-white p-5 shadow-2xl";
const heroSearchRowTopClass =
  "relative mb-4 grid grid-cols-1 gap-3 pb-4 after:absolute after:bottom-0 after:left-3 after:right-3 after:h-px after:bg-gray-200/40 after:content-[''] sm:grid-cols-3";
const heroSearchRowBottomClass = "grid grid-cols-2 items-end gap-3 sm:grid-cols-5";
const heroSearchButtonClass =
  "col-span-2 h-10 cursor-pointer rounded-lg text-sm font-bold sm:col-span-1";
const FEATURED_CARS = [
  {
    name: "BMW 3 Series",
    category: "Luxury Sedan",
    price: 129,
    image: "https://images.unsplash.com/photo-1679891647402-330589ea9309?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=80",
    seats: 5,
    transmission: "Automatic",
    rating: 4.9,
  },
  {
    name: "Range Rover Sport",
    category: "Luxury SUV",
    price: 189,
    image: "https://images.unsplash.com/photo-1742869246328-847a516cd30a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=80",
    seats: 7,
    transmission: "Automatic",
    rating: 4.8,
  },
  {
    name: "Mazda CX-5",
    category: "Compact SUV",
    price: 79,
    image: "https://images.unsplash.com/photo-1756862038199-4fb91d10d948?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=80",
    seats: 5,
    transmission: "Automatic",
    rating: 4.7,
  },
];

const STATS = [
  { icon: Car, value: "200+", label: "Cars Available" },
  { icon: Users, value: "50K+", label: "Happy Customers" },
  { icon: Award, value: "4.9★", label: "Average Rating" },
  { icon: MapPin, value: "12", label: "Pickup Locations" },
];

const WHY_US = [
  {
    icon: Zap,
    title: "Instant Booking",
    desc: "Book in under 2 minutes. No paperwork, no waiting.",
  },
  {
    icon: Shield,
    title: "Full Insurance",
    desc: "Every rental includes comprehensive coverage options.",
  },
  {
    icon: Clock,
    title: "24/7 Support",
    desc: "We're always here — before, during, and after your trip.",
  },
];

const PRICING_ROWS = [
  { duration: "Less than 24 hours", charge: "1 Day Rent", highlight: false },
  { duration: "1 Day + up to 4 hours", charge: "1.5 Days Rent", highlight: true },
  { duration: "1 Day + 4.5 hours or more", charge: "2 Days Rent", highlight: false },
  { duration: "2 Days + up to 4 hours", charge: "2.5 Days Rent", highlight: true },
  { duration: "2 Days + 4.5 hours or more", charge: "3 Days Rent", highlight: false },
  { duration: "3 Days + up to 4 hours", charge: "3.5 Days Rent", highlight: true },
  { duration: "3 Days + 4.5 hours or more", charge: "4 Days Rent", highlight: false },
  { duration: "And so on…", charge: "(Same pattern continues)", highlight: true },
];

const TIME_OPTIONS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00",
];

export default function Index() {
  const navigate = useNavigate();
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const { data: locations } = useQuery({
    queryKey: ["locations", { activeOnly: true }],
    queryFn: () => locationsApi.list(true),
  });

  const today = format(new Date(), "yyyy-MM-dd");
  const tomorrow = format(new Date(Date.now() + 86400000), "yyyy-MM-dd");

  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  useAutoSelectSingleLocation(
    locations,
    pickupLocation,
    dropoffLocation,
    setPickupLocation,
    setDropoffLocation,
  );
  const [vehicleType, setVehicleType] = useState("");
  const [pickupDate, setPickupDate] = useState(today);
  const [pickupTime, setPickupTime] = useState("10:00");
  const [dropoffDate, setDropoffDate] = useState(tomorrow);
  const [dropoffTime, setDropoffTime] = useState("10:00");

  useEffect(() => {
    const video = heroVideoRef.current;
    if (!video) return;

    const playVideo = () => {
      void video.play().catch(() => {
        // Browser may block autoplay until interaction — muted autoplay usually works
      });
    };

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      playVideo();
    } else {
      video.addEventListener("loadeddata", playVideo, { once: true });
    }

    return () => video.removeEventListener("loadeddata", playVideo);
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (pickupLocation) params.set("pickupLocation", pickupLocation);
    if (dropoffLocation) params.set("dropoffLocation", dropoffLocation);
    if (vehicleType && vehicleType !== "all") params.set("category", vehicleType);
    if (pickupDate) params.set("pickupDate", pickupDate);
    if (pickupTime) params.set("pickupTime", pickupTime);
    if (dropoffDate) params.set("dropoffDate", dropoffDate);
    if (dropoffTime) params.set("dropoffTime", dropoffTime);
    navigate(`/cars?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero — matches yycdrive.onhercules.app layout */}
      <section className="relative flex h-screen items-center overflow-hidden pt-24">
        <video
          ref={heroVideoRef}
          className="absolute inset-0 h-full w-full scale-105 object-cover object-[72%_center]"
          src={HERO_VIDEO}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 via-45% to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="max-w-4xl"
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Badge className="mb-3 border-primary/30 bg-primary/20 font-mono text-xs text-primary">
                #1 Car Rental in Calgary
              </Badge>
            </motion.div>

            <motion.h1
              className="mb-3 text-4xl font-bold leading-none tracking-tight text-balance text-white sm:text-5xl lg:text-6xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Drive Your{" "}
              <span className="text-primary">Vibe.</span>
              <br />
              Own the Road.
            </motion.h1>

            <motion.p
              className="mb-5 max-w-lg text-base font-normal text-white/75"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              Premium cars, zero hassle. From daily commuters to weekend escapes — find the perfect ride in minutes.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className={heroSearchCardClass}
            >
              <div className={heroSearchRowTopClass}>
                <div className={heroFieldWrap}>
                  <HeroFieldLabel icon={MapPin}>Pickup Location</HeroFieldLabel>
                  <Select value={pickupLocation} onValueChange={setPickupLocation}>
                    <SelectTrigger className={heroFieldClass}>
                      <SelectValue placeholder="Select pickup location" />
                    </SelectTrigger>
                    <SelectContent>
                      {(locations ?? []).map((loc) => (
                        <SelectItem key={loc._id} value={loc._id}>
                          {loc.name} — {loc.city}
                        </SelectItem>
                      ))}
                      {(locations ?? []).length === 0 && (
                        <SelectItem value="none" disabled>No locations yet</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className={heroFieldWrap}>
                  <HeroFieldLabel icon={MapPin}>Drop-off Location</HeroFieldLabel>
                  <Select value={dropoffLocation} onValueChange={setDropoffLocation}>
                    <SelectTrigger className={heroFieldClass}>
                      <SelectValue placeholder="Select drop-off location" />
                    </SelectTrigger>
                    <SelectContent>
                      {(locations ?? []).map((loc) => (
                        <SelectItem key={loc._id} value={loc._id}>
                          {loc.name} — {loc.city}
                        </SelectItem>
                      ))}
                      {(locations ?? []).length === 0 && (
                        <SelectItem value="none" disabled>No locations yet</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className={heroFieldWrap}>
                  <HeroFieldLabel icon={Car}>Vehicle Type</HeroFieldLabel>
                  <Select value={vehicleType} onValueChange={setVehicleType}>
                    <SelectTrigger className={heroFieldClass}>
                      <SelectValue placeholder="All vehicle types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All vehicle types</SelectItem>
                      {VEHICLE_TYPE_OPTIONS.map((type) => (
                        <SelectItem key={type} value={type}>
                          {formatVehicleCategoryLabel(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className={heroSearchRowBottomClass}>
                <div className={heroFieldWrap}>
                  <HeroFieldLabel icon={Calendar}>Pickup Date</HeroFieldLabel>
                  <DatePicker
                    value={pickupDate}
                    minDate={today}
                    label="Pick up"
                    selectedHint="Pick up"
                    onChange={(date) => {
                      setPickupDate(date);
                      if (dropoffDate && dropoffDate < date) setDropoffDate(date);
                    }}
                    triggerClassName={heroFieldClass}
                    align="start"
                  />
                </div>
                <div className={heroFieldWrap}>
                  <HeroFieldLabel>Pickup Time</HeroFieldLabel>
                  <Select value={pickupTime} onValueChange={setPickupTime}>
                    <SelectTrigger className={heroFieldClass}>
                      <SelectValue>{formatTime12h(pickupTime)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {formatTime12h(t)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className={heroFieldWrap}>
                  <HeroFieldLabel icon={Calendar}>Drop-off Date</HeroFieldLabel>
                  <DatePicker
                    value={dropoffDate}
                    minDate={pickupDate || today}
                    label="Drop-off"
                    selectedHint="Drop-off"
                    onChange={setDropoffDate}
                    triggerClassName={heroFieldClass}
                    align="start"
                  />
                </div>
                <div className={heroFieldWrap}>
                  <HeroFieldLabel>Drop-off Time</HeroFieldLabel>
                  <Select value={dropoffTime} onValueChange={setDropoffTime}>
                    <SelectTrigger className={heroFieldClass}>
                      <SelectValue>{formatTime12h(dropoffTime)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {formatTime12h(t)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSearch} className={heroSearchButtonClass}>
                  Search <Search className="ml-1.5 h-4 w-4" />
                </Button>
              </div>
            </motion.div>

            <motion.div
              className="mt-4 flex items-center gap-4 text-sm text-white/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-primary text-primary" />
                <span>4.9/5 from 12,000+ reviews</span>
              </div>
              <span>•</span>
              <span>Flexible cancellation policy</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <Card className="bg-card backdrop-blur border-border shadow-sm text-center p-5">
                <CardContent className="p-0 space-y-1">
                  <stat.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Featured Cars */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-end justify-between mb-8"
        >
          <div>
            <p className="text-primary text-sm font-mono mb-1">FEATURED</p>
            <h2 className="text-3xl font-bold">Top Picks This Week</h2>
          </div>
          <Link to="/cars">
            <Button variant="ghost" className="text-primary hover:text-primary cursor-pointer">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURED_CARS.map((car, i) => (
            <motion.div
              key={car.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              whileHover={{ y: -4 }}
            >
              <Card className="overflow-hidden border-border/50 bg-card/60 hover:border-primary/40 transition-all duration-300 cursor-pointer group"
                onClick={() => navigate("/cars")}
              >
                <div className="relative overflow-hidden h-48">
                  <img
                    src={car.image}
                    alt={car.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-background/80 backdrop-blur text-foreground border-0 text-xs">
                      <Star className="h-3 w-3 fill-primary text-primary mr-1" />
                      {car.rating}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-foreground">{car.name}</h3>
                      <p className="text-xs text-muted-foreground">{car.category}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold text-primary">${car.price}</span>
                      <span className="text-xs text-muted-foreground">/day</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{car.seats} seats</span>
                    <span>•</span>
                    <span>{car.transmission}</span>
                  </div>
                  <Button className="w-full mt-3 h-9 text-sm font-medium cursor-pointer" onClick={() => navigate("/cars")}>
                    Book Now
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Why Us */}
      <section className="bg-card/30 border-y border-border/50 py-20 mb-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <p className="text-primary text-sm font-mono mb-2">WHY YYC CAR RENTAL</p>
            <h2 className="text-3xl font-bold">Rentals, Reimagined</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {WHY_US.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.4 }}
                className="text-center space-y-3"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Transparent Pricing */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <p className="mb-2 font-mono text-sm text-primary">TRANSPARENT PRICING</p>
          <h2 className="text-3xl font-bold">How We Calculate Your Rental Charge</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            We charge fairly based on exact duration — not just calendar days. Here&apos;s exactly how it works:
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto max-w-3xl"
        >
          <div className="overflow-hidden rounded-2xl border border-border/60 shadow-sm">
            <div className="grid grid-cols-2 bg-primary text-primary-foreground">
              <div className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">
                Duration Selected
              </div>
              <div className="border-l border-primary-foreground/20 px-6 py-4 text-sm font-semibold uppercase tracking-wider">
                Charge Applied
              </div>
            </div>
            {PRICING_ROWS.map((row) => (
              <div
                key={row.duration}
                className={`grid grid-cols-2 border-t border-border/40 text-sm ${row.highlight ? "bg-muted/40" : "bg-card"}`}
              >
                <div className="px-6 py-4 text-foreground">{row.duration}</div>
                <div className="border-l border-border/40 px-6 py-4 font-semibold text-primary">
                  {row.charge}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 text-sm text-muted-foreground">
            <span className="mt-0.5 text-base font-bold text-primary">💡</span>
            <p>
              <span className="font-semibold text-foreground">Rule: </span>
              Every extra period of{" "}
              <span className="font-medium text-foreground">up to 4 hours</span> ={" "}
              <span className="font-semibold text-primary">+0.5 day</span> charge. Every extra period of{" "}
              <span className="font-medium text-foreground">4.5 hours or more</span> ={" "}
              <span className="font-semibold text-primary">+1 full day</span> charge.
            </p>
          </div>
        </motion.div>
      </section>

      {/* CTA Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl p-10 text-center md:p-16"
          style={{ background: "linear-gradient(135deg, #cc1f1f 0%, #991515 100%)" }}
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{ background: "radial-gradient(ellipse at center, #ff4444 0%, transparent 70%)" }}
          />
          <div className="relative z-10">
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
              Ready to hit the road?
            </h2>
            <p className="mb-8 text-lg text-white/80">
              Browse 200+ cars and book your perfect ride in minutes.
            </p>
            <Link to="/cars">
              <Button
                size="lg"
                className="cursor-pointer bg-white font-semibold text-[#cc1f1f] hover:bg-white/90"
              >
                Browse All Cars <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
