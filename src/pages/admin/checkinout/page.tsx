import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { toast } from "sonner";
import { format } from "date-fns";
import { CarFront, CheckCircle, XCircle } from "lucide-react";

type FuelLevel = "empty" | "quarter" | "half" | "three_quarter" | "full";

export default function AdminCheckInOutPage() {
  const bookings = useQuery(api.bookings.adminList, {});
  const cars = useQuery(api.cars.list, {});
  const createInspection = useMutation(api.inspections.create);
  const updateBooking = useMutation(api.bookings.updateStatus);
  const updateCar = useMutation(api.cars.update);

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"check_in" | "check_out">("check_in");
  const [selectedBooking, setSelectedBooking] = useState<string>("");
  const [mileage, setMileage] = useState("");
  const [fuelLevel, setFuelLevel] = useState<FuelLevel>("full");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const activeBookings = (bookings ?? []).filter((b) =>
    b.status === "confirmed" || b.status === "checked_in"
  );

  const openDialog = (t: "check_in" | "check_out") => {
    setType(t);
    setSelectedBooking("");
    setMileage("");
    setFuelLevel("full");
    setNotes("");
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedBooking || !mileage) { toast.error("Please fill all fields"); return; }
    setLoading(true);
    try {
      const booking = bookings?.find((b) => b._id === selectedBooking);
      if (!booking) throw new Error("Booking not found");

      await createInspection({
        carId: booking.carId,
        bookingId: booking._id as Id<"bookings">,
        type,
        mileage: Number(mileage),
        fuelLevel,
        notes: notes || undefined,
      });

      const newStatus = type === "check_in" ? "checked_in" : "checked_out";
      await updateBooking({ bookingId: booking._id as Id<"bookings">, status: newStatus });

      if (type === "check_out") {
        await updateCar({ carId: booking.carId, isAvailable: true, mileage: Number(mileage) });
      } else {
        await updateCar({ carId: booking.carId, isAvailable: false });
      }

      toast.success(`${type === "check_in" ? "Check-in" : "Check-out"} recorded successfully`);
      setOpen(false);
    } catch {
      toast.error("Failed to record inspection");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-2xl font-bold">Check In / Check Out</h2>
        <p className="text-muted-foreground text-sm">Manage vehicle handovers</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card
          className="border-primary/30 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
          onClick={() => openDialog("check_in")}
        >
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold">Check In</h3>
            <p className="text-xs text-muted-foreground mt-1">Customer picks up vehicle</p>
          </CardContent>
        </Card>
        <Card
          className="border-blue-500/30 bg-blue-500/5 cursor-pointer hover:bg-blue-500/10 transition-colors"
          onClick={() => openDialog("check_out")}
        >
          <CardContent className="p-6 text-center">
            <XCircle className="h-8 w-8 text-blue-400 mx-auto mb-2" />
            <h3 className="font-semibold">Check Out</h3>
            <p className="text-xs text-muted-foreground mt-1">Customer returns vehicle</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Bookings */}
      <Card className="border-border/50 bg-card/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Active Rentals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {bookings === undefined
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
            : activeBookings.length === 0
            ? <p className="text-muted-foreground text-sm text-center py-4">No active rentals</p>
            : activeBookings.map((b) => {
                const car = (cars ?? []).find((c) => c._id === b.carId);
                return (
                  <div key={b._id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/50">
                    <div>
                      <p className="text-sm font-medium">
                        {car ? `${car.year} ${car.make} ${car.model}` : "Loading..."}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(b.pickupDate), "MMM d")} — {format(new Date(b.returnDate), "MMM d")}
                      </p>
                    </div>
                    <Badge className={b.status === "confirmed"
                      ? "bg-primary/20 text-primary border-primary/30 text-xs"
                      : "bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs"
                    }>
                      {b.status.replace("_", " ")}
                    </Badge>
                  </div>
                );
              })}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CarFront className="h-5 w-5 text-primary" />
              {type === "check_in" ? "Vehicle Check-In" : "Vehicle Check-Out"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs">Select Booking</Label>
              <Select value={selectedBooking} onValueChange={setSelectedBooking}>
                <SelectTrigger><SelectValue placeholder="Select a booking" /></SelectTrigger>
                <SelectContent>
                  {activeBookings
                    .filter((b) => type === "check_in" ? b.status === "confirmed" : b.status === "checked_in")
                    .map((b) => {
                      const car = (cars ?? []).find((c) => c._id === b.carId);
                      return (
                        <SelectItem key={b._id} value={b._id}>
                          {car ? `${car.make} ${car.model}` : "Car"} — #{b._id.slice(-6)}
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Current Mileage (km)</Label>
              <Input type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} placeholder="e.g. 45000" />
            </div>
            <div className="space-y-1">
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
            <div className="space-y-1">
              <Label className="text-xs">Notes</Label>
              <textarea
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any damage, issues, or notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading} className="cursor-pointer">
              {loading ? "Recording..." : `Record ${type === "check_in" ? "Check-In" : "Check-Out"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
