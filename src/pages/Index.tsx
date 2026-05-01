import { motion } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import Navbar from "@/components/navbar.tsx";
import Footer from "@/components/footer.tsx";
import { ArrowRight, Star, Shield, Clock, MapPin, Zap, Car, Users, Award, Calendar } from "lucide-react";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { format } from "date-fns";

const HERO_IMAGE = "https://images.unsplash.com/photo-1679891647402-330589ea9309?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1920&q=80";

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

const TIME_OPTIONS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00",
];

export default function Index() {
  const navigate = useNavigate();
  const locations = useQuery(api.locations.list, { activeOnly: true });

  const today = format(new Date(), "yyyy-MM-dd");
  const tomorrow = format(new Date(Date.now() + 86400000), "yyyy-MM-dd");

  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [pickupDate, setPickupDate] = useState(today);
  const [pickupTime, setPickupTime] = useState("10:00");
  const [dropoffDate, setDropoffDate] = useState(tomorrow);
  const [dropoffTime, setDropoffTime] = useState("10:00");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (pickupLocation) params.set("pickupLocation", pickupLocation);
    if (dropoffLocation) params.set("dropoffLocation", dropoffLocation);
    if (pickupDate) params.set("pickupDate", pickupDate);
    if (pickupTime) params.set("pickupTime", pickupTime);
    if (dropoffDate) params.set("dropoffDate", dropoffDate);
    if (dropoffTime) params.set("dropoffTime", dropoffTime);
    navigate(`/cars?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

        {/* Glowing orb effect */}
        <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 font-mono text-xs">
                #1 Car Rental in Calgary
              </Badge>
            </motion.div>

            <motion.h1
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-balance leading-none mb-6"
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
              className="text-lg text-muted-foreground mb-8 max-w-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              Premium cars, zero hassle. From daily commuters to weekend escapes — find the perfect ride in minutes.
            </motion.p>

            {/* Search Widget */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="bg-card/90 backdrop-blur-xl border border-border rounded-2xl p-5 space-y-4"
            >
              {/* Row 1: Pickup & Drop-off Locations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-primary" /> Pickup Location
                  </Label>
                  <Select value={pickupLocation} onValueChange={setPickupLocation}>
                    <SelectTrigger className="bg-secondary/50 border-0 h-10">
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
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-primary" /> Drop-off Location
                  </Label>
                  <Select value={dropoffLocation} onValueChange={setDropoffLocation}>
                    <SelectTrigger className="bg-secondary/50 border-0 h-10">
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
              </div>

              {/* Row 2: Dates & Times */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-primary" /> Pickup Date
                  </Label>
                  <Input
                    type="date"
                    min={today}
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="bg-secondary/50 border-0 h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Pickup Time</Label>
                  <Select value={pickupTime} onValueChange={setPickupTime}>
                    <SelectTrigger className="bg-secondary/50 border-0 h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-primary" /> Drop-off Date
                  </Label>
                  <Input
                    type="date"
                    min={pickupDate}
                    value={dropoffDate}
                    onChange={(e) => setDropoffDate(e.target.value)}
                    className="bg-secondary/50 border-0 h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Drop-off Time</Label>
                  <Select value={dropoffTime} onValueChange={setDropoffTime}>
                    <SelectTrigger className="bg-secondary/50 border-0 h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleSearch} className="w-full h-11 font-semibold cursor-pointer">
                Search Available Cars <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>

            <motion.div
              className="mt-4 flex items-center gap-4 text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-primary text-primary" />
                <span>4.9/5 from 12,000+ reviews</span>
              </div>
              <span>•</span>
              <span>Free cancellation</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 -mt-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-16">
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
              <Card className="bg-card/60 backdrop-blur border-border/50 text-center p-5">
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
            <p className="text-primary text-sm font-mono mb-2">WHY YYCDRIVE</p>
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

      {/* CTA Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-primary p-10 md:p-16 text-center"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_oklch(0.9_0.28_145)_0%,_oklch(0.6_0.28_145)_100%)] opacity-50" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to hit the road?
            </h2>
            <p className="text-primary-foreground/80 mb-8 text-lg">
              Browse 200+ cars and book your perfect ride in minutes.
            </p>
            <Link to="/cars">
              <Button
                size="lg"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold cursor-pointer"
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
