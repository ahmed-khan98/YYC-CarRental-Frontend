import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import Navbar from "@/components/navbar.tsx";
import Footer from "@/components/footer.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { useAuth } from "@/hooks/use-auth.ts";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { motion } from "motion/react";
import { format } from "date-fns";
import { Car, Calendar, MapPin, DollarSign, Clock, XCircle, CheckCircle, LogIn, LogOut, Upload, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";

type FuelLevel = "empty" | "quarter" | "half" | "three_quarter" | "full";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-primary/20 text-primary border-primary/30",
  checked_in: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  checked_out: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

const CAR_IMAGES: Record<string, string> = {
  economy: "https://images.unsplash.com/photo-1690278289651-895463644114?w=200&q=80",
  sedan: "https://images.unsplash.com/photo-1679891647402-330589ea9309?w=200&q=80",
  suv: "https://images.unsplash.com/photo-1742869246328-847a516cd30a?w=200&q=80",
  luxury: "https://images.unsplash.com/photo-1650716748498-a2ce13ed0f2d?w=200&q=80",
  sports: "https://images.unsplash.com/photo-1683916138305-98a86efc9fc9?w=200&q=80",
  compact: "https://images.unsplash.com/photo-1647708790575-05985b7f670c?w=200&q=80",
  van: "https://images.unsplash.com/photo-1701918190763-3851cf361f96?w=200&q=80",
};

type BookingType = {
  _id: Id<"bookings">;
  carId: Id<"cars">;
  pickupLocationId: Id<"locations">;
  dropoffLocationId: Id<"locations">;
  pickupDate: string;
  pickupTime?: string;
  returnDate: string;
  returnTime?: string;
  status: string;
  totalAmount: number;
  _creationTime: number;
  cancellationReason?: string;
};

function CheckInOutDialog({
  open, onClose, booking, type,
}: {
  open: boolean;
  onClose: () => void;
  booking: BookingType;
  type: "check_in" | "check_out";
}) {
  const generateUploadUrl = useMutation(api.inspections.generateUploadUrl);
  const createInspection = useMutation(api.inspections.create);
  const updateBooking = useMutation(api.bookings.updateStatus);

  const [mileage, setMileage] = useState("");
  const [fuelLevel, setFuelLevel] = useState<FuelLevel>("full");
  const [notes, setNotes] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 5);
    setImageFiles(files);
    setImagePreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async () => {
    if (!mileage) { toast.error("Please enter mileage"); return; }
    setLoading(true);
    try {
      // Upload images
      const storageIds: Id<"_storage">[] = [];
      for (const file of imageFiles) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = await result.json() as { storageId: Id<"_storage"> };
        storageIds.push(storageId);
      }

      await createInspection({
        carId: booking.carId,
        bookingId: booking._id,
        type,
        mileage: Number(mileage),
        fuelLevel,
        notes: notes || undefined,
        imageStorageIds: storageIds.length > 0 ? storageIds : undefined,
      });

      const newStatus = type === "check_in" ? "checked_in" : "checked_out";
      await updateBooking({ bookingId: booking._id, status: newStatus });

      toast.success(`${type === "check_in" ? "Check-in" : "Check-out"} recorded!`);
      onClose();
    } catch {
      toast.error("Failed to record inspection");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === "check_in" ? <LogIn className="h-5 w-5 text-primary" /> : <LogOut className="h-5 w-5 text-blue-400" />}
            {type === "check_in" ? "Check In — Vehicle Pickup" : "Check Out — Vehicle Return"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <p className="text-sm text-muted-foreground">
            {type === "check_in"
              ? "Please record the car condition at pickup and upload photos."
              : "Please record the car condition at return and upload photos."}
          </p>
          <div className="space-y-1.5">
            <Label className="text-xs">Current Mileage (km) *</Label>
            <Input type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} placeholder="e.g. 45000" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Fuel Level</Label>
            <Select value={fuelLevel} onValueChange={(v) => setFuelLevel(v as FuelLevel)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["empty","quarter","half","three_quarter","full"] as const).map((f) => (
                  <SelectItem key={f} value={f} className="capitalize">{f.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Car Images (optional, up to 5)</Label>
            <div
              className="border-2 border-dashed border-border/50 rounded-xl p-3 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {imagePreviews.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {imagePreviews.map((src, i) => (
                    <img key={i} src={src} alt={`Car ${i + 1}`} className="w-full h-16 object-cover rounded" />
                  ))}
                </div>
              ) : (
                <div className="text-center py-3 text-muted-foreground">
                  <Upload className="h-5 w-5 mx-auto mb-1" />
                  <p className="text-xs">Upload car photos</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
            {imagePreviews.length > 0 && (
              <button
                onClick={() => { setImageFiles([]); setImagePreviews([]); if (fileRef.current) fileRef.current.value = ""; }}
                className="text-xs text-muted-foreground hover:text-destructive cursor-pointer flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Clear images
              </button>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <textarea
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any scratches, damage or notes..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose} className="cursor-pointer">Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="cursor-pointer">
            {loading ? "Recording..." : `Record ${type === "check_in" ? "Check-In" : "Check-Out"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BookingCard({ booking }: { booking: BookingType }) {
  const car = useQuery(api.cars.get, { carId: booking.carId });
  const pickupLocation = useQuery(api.locations.get, { locationId: booking.pickupLocationId });
  const dropoffLocation = useQuery(api.locations.get, { locationId: booking.dropoffLocationId });
  const cancel = useMutation(api.bookings.cancel);

  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);

  const handleCancel = async () => {
    try {
      await cancel({ bookingId: booking._id });
      toast.success("Booking cancelled");
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { message: string };
        toast.error(data.message);
      } else {
        toast.error("Failed to cancel booking");
      }
    }
  };

  const carImg = (car?.resolvedImageUrls?.[0]) ?? car?.imageUrl ?? (car ? CAR_IMAGES[car.category] : undefined);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-border/50 bg-card/60 hover:border-primary/20 transition-colors">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row gap-4">
              {car === undefined ? (
                <Skeleton className="w-24 h-16 rounded-lg shrink-0" />
              ) : car ? (
                <img
                  src={carImg ?? "https://images.unsplash.com/photo-1679891647402-330589ea9309?w=200&q=80"}
                  alt={`${car.make} ${car.model}`}
                  className="w-24 h-16 object-cover rounded-lg shrink-0"
                />
              ) : null}

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    {car ? (
                      <h3 className="font-semibold">{car.year} {car.make} {car.model}</h3>
                    ) : (
                      <Skeleton className="h-5 w-32 mb-1" />
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(booking.pickupDate), "MMM d")}{booking.pickupTime ? ` ${booking.pickupTime}` : ""} — {format(new Date(booking.returnDate), "MMM d, yyyy")}{booking.returnTime ? ` ${booking.returnTime}` : ""}
                      </span>
                      {pickupLocation && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {pickupLocation.name}
                          {dropoffLocation && dropoffLocation._id !== pickupLocation._id && ` → ${dropoffLocation.name}`}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        ${booking.totalAmount}
                      </span>
                    </div>
                  </div>
                  <Badge className={`text-xs border capitalize ${STATUS_COLORS[booking.status] ?? ""}`}>
                    {booking.status.replace("_", " ")}
                  </Badge>
                </div>

                {/* Cancellation reason */}
                {booking.cancellationReason && (
                  <div className="mt-2 text-xs bg-destructive/10 text-destructive border border-destructive/20 rounded px-2 py-1">
                    Cancelled: {booking.cancellationReason}
                  </div>
                )}

                {/* Action buttons */}
                <div className="mt-2 flex gap-2 flex-wrap">
                  {(booking.status === "pending" || booking.status === "confirmed") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                      onClick={handleCancel}
                    >
                      <XCircle className="h-3 w-3 mr-1" /> Cancel
                    </Button>
                  )}
                  {booking.status === "confirmed" && (
                    <Button
                      size="sm"
                      className="h-7 text-xs cursor-pointer"
                      onClick={() => setCheckInOpen(true)}
                    >
                      <LogIn className="h-3 w-3 mr-1" /> Check In
                    </Button>
                  )}
                  {booking.status === "checked_in" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 text-xs cursor-pointer"
                      onClick={() => setCheckOutOpen(true)}
                    >
                      <LogOut className="h-3 w-3 mr-1" /> Check Out
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {checkInOpen && (
        <CheckInOutDialog
          open={checkInOpen}
          onClose={() => setCheckInOpen(false)}
          booking={booking}
          type="check_in"
        />
      )}
      {checkOutOpen && (
        <CheckInOutDialog
          open={checkOutOpen}
          onClose={() => setCheckOutOpen(false)}
          booking={booking}
          type="check_out"
        />
      )}
    </>
  );
}

function DashboardInner() {
  const bookings = useQuery(api.bookings.myBookings, {});
  const { user } = useAuth();
  const navigate = useNavigate();

  const stats = {
    total: bookings?.length ?? 0,
    active: bookings?.filter((b) => ["confirmed", "checked_in"].includes(b.status)).length ?? 0,
    completed: bookings?.filter((b) => b.status === "completed").length ?? 0,
    spent: bookings?.filter((b) => b.status !== "cancelled").reduce((s, b) => s + b.totalAmount, 0) ?? 0,
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {user?.profile.name ?? "Driver"}</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Car, label: "Total Bookings", value: stats.total },
          { icon: CheckCircle, label: "Active", value: stats.active },
          { icon: Clock, label: "Completed", value: stats.completed },
          { icon: DollarSign, label: "Total Spent", value: `$${stats.spent}` },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <Card className="border-border/50 bg-card/60 text-center p-4">
              <CardContent className="p-0">
                <stat.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                <div className="text-xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Bookings */}
      <Card className="border-border/50 bg-card/30">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Rental History</CardTitle>
          <Button size="sm" onClick={() => navigate("/cars")} className="cursor-pointer">Book New Car</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {bookings === undefined ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
          ) : bookings.length === 0 ? (
            <div className="text-center py-10">
              <Car className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No bookings yet. Find your perfect ride!</p>
              <Button className="mt-4 cursor-pointer" onClick={() => navigate("/cars")}>Browse Cars</Button>
            </div>
          ) : (
            bookings
              .slice()
              .sort((a, b) => b._creationTime - a._creationTime)
              .map((booking) => <BookingCard key={booking._id} booking={booking} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="pt-16 flex-1">
        <AuthLoading>
          <div className="mx-auto max-w-4xl px-4 py-8">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          </div>
        </AuthLoading>
        <Unauthenticated>
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="border-border/50 text-center py-12 px-8">
              <CardContent>
                <h3 className="text-lg font-semibold mb-2">Sign in to view your dashboard</h3>
                <p className="text-muted-foreground text-sm mb-4">Track your bookings and rental history.</p>
                <SignInButton />
              </CardContent>
            </Card>
          </div>
        </Unauthenticated>
        <Authenticated>
          <DashboardInner />
        </Authenticated>
      </div>
      <Footer />
    </div>
  );
}
