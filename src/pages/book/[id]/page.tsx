import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import Navbar from "@/components/navbar.tsx";
import Footer from "@/components/footer.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Authenticated, Unauthenticated } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { motion } from "motion/react";
import { ArrowLeft, Car, MapPin, Calendar, Shield, Users, CheckCircle2, Clock } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";

const CAR_IMAGES: Record<string, string> = {
  economy: "https://images.unsplash.com/photo-1690278289651-895463644114?w=600&q=80",
  sedan: "https://images.unsplash.com/photo-1679891647402-330589ea9309?w=600&q=80",
  suv: "https://images.unsplash.com/photo-1742869246328-847a516cd30a?w=600&q=80",
  luxury: "https://images.unsplash.com/photo-1650716748498-a2ce13ed0f2d?w=600&q=80",
  sports: "https://images.unsplash.com/photo-1683916138305-98a86efc9fc9?w=600&q=80",
  compact: "https://images.unsplash.com/photo-1647708790575-05985b7f670c?w=600&q=80",
  van: "https://images.unsplash.com/photo-1701918190763-3851cf361f96?w=600&q=80",
};

const TIME_OPTIONS = [
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00",
];

function BookingForm({ carId }: { carId: Id<"cars"> }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const car = useQuery(api.cars.get, { carId });
  const locations = useQuery(api.locations.list, { activeOnly: true });
  const services = useQuery(api.services.list, { activeOnly: true });
  const createBooking = useMutation(api.bookings.create);

  const today = format(new Date(), "yyyy-MM-dd");
  const tomorrow = format(new Date(Date.now() + 86400000), "yyyy-MM-dd");

  const [pickupDate, setPickupDate] = useState(searchParams.get("pickupDate") ?? today);
  const [pickupTime, setPickupTime] = useState(searchParams.get("pickupTime") ?? "10:00");
  const [returnDate, setReturnDate] = useState(searchParams.get("dropoffDate") ?? tomorrow);
  const [returnTime, setReturnTime] = useState(searchParams.get("dropoffTime") ?? "10:00");
  const [pickupLocationId, setPickupLocationId] = useState<string>(searchParams.get("pickupLocation") ?? "");
  const [dropoffLocationId, setDropoffLocationId] = useState<string>("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const days = Math.max(1, differenceInDays(parseISO(returnDate), parseISO(pickupDate)));
  const carTotal = (car?.dailyRate ?? 0) * days;
  const servicesTotal = (services ?? [])
    .filter((s) => selectedServices.includes(s._id))
    .reduce((sum, s) => sum + s.dailyRate * days, 0);
  const total = carTotal + servicesTotal;

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!pickupLocationId) { toast.error("Please select a pickup location"); return; }
    if (!dropoffLocationId) { toast.error("Please select a drop-off location"); return; }
    if (!pickupDate || !returnDate) { toast.error("Please select dates"); return; }
    if (new Date(returnDate) <= new Date(pickupDate)) { toast.error("Return date must be after pickup date"); return; }

    setLoading(true);
    try {
      await createBooking({
        carId,
        pickupLocationId: pickupLocationId as Id<"locations">,
        dropoffLocationId: dropoffLocationId as Id<"locations">,
        pickupDate: new Date(pickupDate).toISOString(),
        pickupTime,
        returnDate: new Date(returnDate).toISOString(),
        returnTime,
        additionalServiceIds: selectedServices as Id<"additionalServices">[],
        notes,
      });
      setSuccess(true);
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { message: string };
        toast.error(data.message);
      } else {
        toast.error("Booking failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
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
          <Button onClick={() => navigate("/dashboard")} className="cursor-pointer">View My Bookings</Button>
          <Button variant="secondary" onClick={() => navigate("/cars")} className="cursor-pointer">Browse More</Button>
        </div>
      </motion.div>
    );
  }

  if (car === undefined || locations === undefined || services === undefined) {
    return <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>;
  }

  if (!car) {
    return <div className="text-center py-8"><p className="text-muted-foreground">Car not found.</p></div>;
  }

  const carImage = (car.imageUrls && car.imageUrls[0]) ?? car.imageUrl ?? CAR_IMAGES[car.category] ?? CAR_IMAGES.sedan;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form */}
      <div className="lg:col-span-2 space-y-6">
        {/* Car Summary */}
        <Card className="border-border/50 bg-card/60">
          <CardContent className="p-4 flex gap-4">
            <img
              src={carImage}
              alt={`${car.make} ${car.model}`}
              className="w-28 h-20 object-cover rounded-lg shrink-0"
            />
            <div>
              <h3 className="font-semibold">{car.year} {car.make} {car.model}</h3>
              <p className="text-sm text-muted-foreground capitalize">{car.category} · {car.transmission}</p>
              <p className="text-primary font-bold mt-1">${car.dailyRate}/day</p>
            </div>
          </CardContent>
        </Card>

        {/* Dates & Times */}
        <Card className="border-border/50 bg-card/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> Rental Dates & Times
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Pickup Date</Label>
              <Input type="date" min={today} value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Pickup Time
              </Label>
              <Select value={pickupTime} onValueChange={setPickupTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Drop-off Date</Label>
              <Input type="date" min={pickupDate} value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Drop-off Time
              </Label>
              <Select value={returnTime} onValueChange={setReturnTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="col-span-2 text-sm text-muted-foreground">
              Duration: <span className="text-foreground font-medium">{days} day{days !== 1 ? "s" : ""}</span>
            </p>
          </CardContent>
        </Card>

        {/* Locations */}
        <Card className="border-border/50 bg-card/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> Pickup & Drop-off Locations
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Pickup Location</Label>
              <Select value={pickupLocationId} onValueChange={setPickupLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select pickup location" />
                </SelectTrigger>
                <SelectContent>
                  {(locations ?? []).map((loc) => (
                    <SelectItem key={loc._id} value={loc._id}>
                      {loc.name} — {loc.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Drop-off Location</Label>
              <Select value={dropoffLocationId} onValueChange={setDropoffLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select drop-off location" />
                </SelectTrigger>
                <SelectContent>
                  {(locations ?? []).map((loc) => (
                    <SelectItem key={loc._id} value={loc._id}>
                      {loc.name} — {loc.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Additional Services */}
        {(services ?? []).length > 0 && (
          <Card className="border-border/50 bg-card/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" /> Additional Services
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(services ?? []).map((svc) => (
                <div
                  key={svc._id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    selectedServices.includes(svc._id)
                      ? "border-primary/50 bg-primary/5"
                      : "border-border/50 hover:border-border"
                  }`}
                  onClick={() => toggleService(svc._id)}
                >
                  <Checkbox
                    checked={selectedServices.includes(svc._id)}
                    onCheckedChange={() => toggleService(svc._id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm">{svc.name}</span>
                      <span className="text-primary text-sm font-semibold shrink-0">+${svc.dailyRate}/day</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{svc.description}</p>
                    <Badge variant="secondary" className="text-[10px] mt-1 capitalize">{svc.category}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        <Card className="border-border/50 bg-card/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Additional Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              rows={3}
              placeholder="Any special requests or notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 space-y-4">
          <Card className="border-border/50 bg-card/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Date/time summary */}
              <div className="bg-secondary/30 rounded-lg p-3 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3 w-3 shrink-0" />
                  <span>Pickup: <span className="text-foreground font-medium">{pickupDate} at {pickupTime}</span></span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3 w-3 shrink-0" />
                  <span>Drop-off: <span className="text-foreground font-medium">{returnDate} at {returnTime}</span></span>
                </div>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">${car.dailyRate} × {days} day{days !== 1 ? "s" : ""}</span>
                <span>${carTotal}</span>
              </div>
              {selectedServices.length > 0 && (services ?? [])
                .filter((s) => selectedServices.includes(s._id))
                .map((svc) => (
                  <div key={svc._id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{svc.name}</span>
                    <span className="text-primary">+${svc.dailyRate * days}</span>
                  </div>
                ))}
              <div className="border-t border-border/50 pt-3 flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-primary text-lg">${total}</span>
              </div>
              <Button
                className="w-full cursor-pointer"
                size="lg"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Confirming..." : "Confirm Booking"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Free cancellation up to 24h before pickup
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function BookPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="pt-16 flex-1">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors cursor-pointer text-sm"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Car className="h-7 w-7 text-primary" /> Book Your Ride
            </h1>
            <p className="text-muted-foreground mt-1">Complete your reservation below</p>
          </div>

          <Unauthenticated>
            <Card className="border-border/50 text-center py-12">
              <CardContent>
                <h3 className="text-lg font-semibold mb-2">Sign in to book</h3>
                <p className="text-muted-foreground text-sm mb-4">You need an account to make a reservation.</p>
                <SignInButton />
              </CardContent>
            </Card>
          </Unauthenticated>

          <Authenticated>
            {id && <BookingForm carId={id as Id<"cars">} />}
          </Authenticated>
        </div>
      </div>
      <Footer />
    </div>
  );
}
