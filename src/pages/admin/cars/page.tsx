import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Car } from "lucide-react";

type CarCategory = "economy" | "compact" | "sedan" | "suv" | "luxury" | "sports" | "van";
type Transmission = "automatic" | "manual";
type FuelType = "gasoline" | "diesel" | "electric" | "hybrid";

interface CarForm {
  make: string; model: string; year: string; category: CarCategory;
  color: string; licensePlate: string; dailyRate: string;
  seats: string; transmission: Transmission; fuelType: FuelType;
  locationId: string; mileage: string; description: string;
  imageUrl: string; features: string;
}

const EMPTY_FORM: CarForm = {
  make: "", model: "", year: "", category: "sedan",
  color: "", licensePlate: "", dailyRate: "",
  seats: "5", transmission: "automatic", fuelType: "gasoline",
  locationId: "", mileage: "", description: "",
  imageUrl: "", features: "",
};

export default function AdminCarsPage() {
  const cars = useQuery(api.cars.list, {});
  const locations = useQuery(api.locations.list, {});
  const createCar = useMutation(api.cars.create);
  const updateCar = useMutation(api.cars.update);
  const removeCar = useMutation(api.cars.remove);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<Id<"cars"> | null>(null);
  const [form, setForm] = useState<CarForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = (cars ?? []).filter((c) =>
    `${c.make} ${c.model} ${c.licensePlate}`.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setForm(EMPTY_FORM); setEditId(null); setOpen(true); };
  const openEdit = (car: typeof cars extends (infer T)[] | undefined ? T : never) => {
    if (!car) return;
    setForm({
      make: car.make, model: car.model, year: String(car.year), category: car.category,
      color: car.color, licensePlate: car.licensePlate, dailyRate: String(car.dailyRate),
      seats: String(car.seats), transmission: car.transmission, fuelType: car.fuelType,
      locationId: car.locationId, mileage: car.mileage ? String(car.mileage) : "",
      description: car.description ?? "", imageUrl: car.imageUrl ?? "",
      features: car.features?.join(", ") ?? "",
    });
    setEditId(car._id);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.make || !form.model || !form.year || !form.dailyRate || !form.locationId) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        make: form.make, model: form.model, year: Number(form.year),
        category: form.category, color: form.color, licensePlate: form.licensePlate,
        dailyRate: Number(form.dailyRate), seats: Number(form.seats),
        transmission: form.transmission, fuelType: form.fuelType,
        locationId: form.locationId as Id<"locations">,
        mileage: form.mileage ? Number(form.mileage) : undefined,
        description: form.description || undefined,
        imageUrl: form.imageUrl || undefined,
        features: form.features ? form.features.split(",").map((f) => f.trim()).filter(Boolean) : undefined,
      };
      if (editId) {
        await updateCar({ carId: editId, ...payload });
        toast.success("Car updated");
      } else {
        await createCar(payload);
        toast.success("Car added");
      }
      setOpen(false);
    } catch {
      toast.error("Failed to save car");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (carId: Id<"cars">) => {
    if (!confirm("Delete this car?")) return;
    try {
      await removeCar({ carId });
      toast.success("Car deleted");
    } catch {
      toast.error("Failed to delete car");
    }
  };

  const handleToggleAvailable = async (carId: Id<"cars">, current: boolean) => {
    await updateCar({ carId, isAvailable: !current });
    toast.success(`Car ${!current ? "enabled" : "disabled"}`);
  };

  const f = (k: keyof CarForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Cars</h2>
          <p className="text-muted-foreground text-sm">{cars?.length ?? 0} total vehicles</p>
        </div>
        <Button onClick={openCreate} className="cursor-pointer">
          <Plus className="h-4 w-4 mr-2" /> Add Car
        </Button>
      </div>

      <Input
        placeholder="Search by make, model, plate..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs"
      />

      {cars === undefined ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Car className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No cars found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((car) => (
            <Card key={car._id} className="border-border/50 bg-card/60">
              <CardContent className="p-4 flex items-center gap-4">
                <img
                  src={car.imageUrl ?? "https://images.unsplash.com/photo-1679891647402-330589ea9309?w=120&q=80"}
                  alt={`${car.make} ${car.model}`}
                  className="w-20 h-14 object-cover rounded-lg shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{car.year} {car.make} {car.model}</span>
                    <Badge className="text-[10px] capitalize">{car.category}</Badge>
                    <Badge className={car.isAvailable ? "bg-primary/20 text-primary border-primary/30 text-[10px]" : "bg-destructive/20 text-destructive border-destructive/30 text-[10px]"}>
                      {car.isAvailable ? "Available" : "Unavailable"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{car.color} · {car.transmission} · ${car.dailyRate}/day · {car.licensePlate}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={car.isAvailable}
                    onCheckedChange={() => handleToggleAvailable(car._id, car.isAvailable)}
                    className="cursor-pointer"
                  />
                  <Button variant="ghost" size="icon" onClick={() => openEdit(car)} className="cursor-pointer">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(car._id)} className="cursor-pointer text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Car" : "Add New Car"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {([["make", "Make *"], ["model", "Model *"], ["year", "Year *"], ["dailyRate", "Daily Rate ($) *"]] as const).map(([key, label]) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs">{label}</Label>
                <Input value={form[key]} onChange={f(key)} placeholder={label.replace(" *", "")} />
              </div>
            ))}
            <div className="space-y-1">
              <Label className="text-xs">Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v as CarCategory }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["economy","compact","sedan","suv","luxury","sports","van"] as const).map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Transmission</Label>
              <Select value={form.transmission} onValueChange={(v) => setForm((p) => ({ ...p, transmission: v as Transmission }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatic">Automatic</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fuel Type</Label>
              <Select value={form.fuelType} onValueChange={(v) => setForm((p) => ({ ...p, fuelType: v as FuelType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["gasoline","diesel","electric","hybrid"] as const).map((f) => (
                    <SelectItem key={f} value={f} className="capitalize">{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Location *</Label>
              <Select value={form.locationId} onValueChange={(v) => setForm((p) => ({ ...p, locationId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>
                  {(locations ?? []).map((loc) => (
                    <SelectItem key={loc._id} value={loc._id}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {([["color", "Color"], ["licensePlate", "License Plate"], ["seats", "Seats"], ["mileage", "Mileage (km)"]] as const).map(([key, label]) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs">{label}</Label>
                <Input value={form[key]} onChange={f(key)} placeholder={label} />
              </div>
            ))}
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Image URL</Label>
              <Input value={form.imageUrl} onChange={f("imageUrl")} placeholder="https://..." />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Features (comma-separated)</Label>
              <Input value={form.features} onChange={f("features")} placeholder="AC, Bluetooth, GPS..." />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Description</Label>
              <textarea
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                rows={2}
                value={form.description}
                onChange={f("description")}
                placeholder="Short description..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleSave} disabled={loading} className="cursor-pointer">
              {loading ? "Saving..." : "Save Car"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
