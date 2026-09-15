import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { carsApi } from "@/api/cars.api.ts";
import { uploadFile } from "@/api/upload.api.ts";
import type { Car, CarCategory } from "@/types/index.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { AdminDataTable, type AdminTableColumn } from "@/components/admin-data-table.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { getApiErrorMessage } from "@/api/client.ts";
import { patchOptionalNumber, patchStringList, patchText } from "@/lib/patchPayload.ts";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Car as CarIcon, Upload, X, ImageIcon, CalendarDays } from "lucide-react";
import { Hint } from "@/components/ui/tooltip.tsx";
import { useAuth } from "@/hooks/use-auth.ts";
import { canDeleteRecords } from "@/lib/roles.ts";
import { formatCarName } from "@/lib/displayName.ts";
import { carImageUrls, carPrimaryImage, resolveMediaUrl } from "@/lib/mediaUrl.ts";
import {
  VEHICLE_TYPE_FILTER_OPTIONS,
  formatVehicleCategoryLabel,
  type DisplayVehicleCategory,
} from "@/lib/vehicleCategories.ts";

type Transmission = Car["transmission"];
type FuelType = Car["fuelType"];

interface CarForm {
  make: string; model: string; year: string; category: CarCategory;
  color: string; licensePlate: string; vin: string; dailyRate: string;
  dailyMileageLimit: string; chargePerExtraKm: string;
  seats: string; transmission: Transmission; fuelType: FuelType;
  mileage: string; description: string;
  features: string;
}

const EMPTY_FORM: CarForm = {
  make: "", model: "", year: "", category: "sedan",
  color: "", licensePlate: "", vin: "", dailyRate: "",
  dailyMileageLimit: "", chargePerExtraKm: "",
  seats: "5", transmission: "automatic", fuelType: "gasoline",
  mileage: "", description: "",
  features: "",
};

const CAR_IMAGES: Record<string, string> = {
  economy: "https://images.unsplash.com/photo-1690278289651-895463644114?w=200&q=70",
  sedan: "https://images.unsplash.com/photo-1679891647402-330589ea9309?w=200&q=70",
  suv: "https://images.unsplash.com/photo-1742869246328-847a516cd30a?w=200&q=70",
  luxury: "https://images.unsplash.com/photo-1650716748498-a2ce13ed0f2d?w=200&q=70",
  sports: "https://images.unsplash.com/photo-1683916138305-98a86efc9fc9?w=200&q=70",
  compact: "https://images.unsplash.com/photo-1647708790575-05985b7f670c?w=200&q=70",
  van: "https://images.unsplash.com/photo-1701918190763-3851cf361f96?w=200&q=70",
};

export default function AdminCarsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canDelete = canDeleteRecords(user?.role);
  const { data: cars, isLoading: carsLoading } = useQuery({
    queryKey: ["cars"],
    queryFn: () => carsApi.list(),
  });
  const createCar = useMutation({
    mutationFn: carsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cars"] }),
  });
  const updateCar = useMutation({
    mutationFn: ({ carId, data }: { carId: string; data: Partial<Car> }) => carsApi.update(carId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cars"] }),
  });
  const removeCar = useMutation({
    mutationFn: carsApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cars"] }),
  });

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CarForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | DisplayVehicleCategory>("all");

  // Image upload state
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string>("");
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [additionalPreviews, setAdditionalPreviews] = useState<string[]>([]);
  // Existing storage IDs when editing
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);

  const mainImageRef = useRef<HTMLInputElement>(null);
  const additionalImagesRef = useRef<HTMLInputElement>(null);

  const filtered = (cars ?? []).filter((c) => {
    const matchesSearch = `${c.make} ${c.model} ${c.licensePlate}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || c.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const resetImageState = () => {
    setMainImage(null);
    setMainImagePreview("");
    setAdditionalImages([]);
    setAdditionalPreviews([]);
    setExistingImageUrls([]);
    if (mainImageRef.current) mainImageRef.current.value = "";
    if (additionalImagesRef.current) additionalImagesRef.current.value = "";
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    resetImageState();
    setOpen(true);
  };

  const openEdit = (car: Car) => {
    if (!car) return;
    setForm({
      make: car.make, model: car.model, year: String(car.year), category: car.category,
      color: car.color, licensePlate: car.licensePlate ?? "", vin: car.vin ?? "", dailyRate: String(car.dailyRate),
      dailyMileageLimit: car.dailyMileageLimit != null ? String(car.dailyMileageLimit) : "",
      chargePerExtraKm: car.chargePerExtraKm != null ? String(car.chargePerExtraKm) : "",
      seats: String(car.seats), transmission: car.transmission, fuelType: car.fuelType,
      mileage: car.mileage ? String(car.mileage) : "",
      description: car.description ?? "",
      features: car.features?.join(", ") ?? "",
    });
    resetImageState();
    const stored = car.imageUrls?.length ? car.imageUrls : car.imageUrl ? [car.imageUrl] : [];
    const previews = carImageUrls(car);
    setExistingImageUrls(stored);
    setMainImagePreview(previews[0] ?? "");
    setAdditionalPreviews(previews.slice(1));
    setEditId(car._id);
    setOpen(true);
  };

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMainImage(file);
    setMainImagePreview(URL.createObjectURL(file));
  };

  const handleAdditionalImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 3);
    setAdditionalImages(files);
    setAdditionalPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const handleSave = async () => {
    if (!form.make || !form.model || !form.year || !form.dailyRate || !form.vin.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);
    try {
      // Upload new images if selected
      let imageUrls: string[] = [...existingImageUrls];

      if (mainImage || additionalImages.length > 0) {
        const [mainUrl, ...additionalUrls] = await Promise.all([
          mainImage ? uploadFile(mainImage, "cars") : Promise.resolve(null),
          ...additionalImages.map((f) => uploadFile(f, "cars")),
        ]);
        if (mainUrl) {
          imageUrls = [mainUrl, ...imageUrls.slice(1)];
        }
        if (additionalImages.length > 0) {
          imageUrls = [imageUrls[0], ...additionalUrls].filter(Boolean);
        }
      }

      const payload = {
        make: form.make, model: form.model, year: Number(form.year),
        category: form.category, color: form.color, licensePlate: form.licensePlate,
        vin: form.vin.trim(),
        dailyRate: Number(form.dailyRate), seats: Number(form.seats),
        dailyMileageLimit: patchOptionalNumber(form.dailyMileageLimit),
        chargePerExtraKm: patchOptionalNumber(form.chargePerExtraKm),
        transmission: form.transmission, fuelType: form.fuelType,
        mileage: patchOptionalNumber(form.mileage),
        description: patchText(form.description),
        features: patchStringList(form.features),
        imageUrls: imageUrls.map((url) => resolveMediaUrl(url)).filter(Boolean),
      };

      if (editId) {
        await updateCar.mutateAsync({ carId: editId, data: payload });
        toast.success("Car updated");
      } else {
        await createCar.mutateAsync(payload as Parameters<typeof carsApi.create>[0]);
        toast.success("Car added");
      }
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (carId: string) => {
    if (!confirm("Delete this car?")) return;
    try {
      await removeCar.mutateAsync(carId);
      toast.success("Car deleted");
    } catch {
      toast.error("Failed to delete car");
    }
  };

  const handleToggleAvailable = async (carId: string, current: boolean) => {
    await updateCar.mutateAsync({ carId, data: { isAvailable: !current } });
    toast.success(`Car ${!current ? "enabled" : "disabled"}`);
  };

  const f = (k: keyof CarForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const carColumns: AdminTableColumn<Car>[] = [
    {
      id: "vehicle",
      header: "Vehicle",
      cell: (car) => {
        const imgSrc = carPrimaryImage(car, CAR_IMAGES[car.category]);
        return (
          <div className="flex items-center gap-3 min-w-[180px]">
            <img
              src={resolveMediaUrl(imgSrc ?? CAR_IMAGES.sedan)}
              alt={formatCarName(car, { includeYear: false })}
              className="w-14 h-10 object-cover rounded-md shrink-0"
            />
            <div className="min-w-0">
              <p className="font-medium truncate">{formatCarName(car)}</p>
              <p className="text-xs text-muted-foreground capitalize">{car.color} · {car.transmission}</p>
            </div>
          </div>
        );
      },
    },
    {
      id: "category",
      header: "Category",
      className: "hidden sm:table-cell",
      headClassName: "hidden sm:table-cell",
      cell: (car) => <Badge className="text-[10px] capitalize">{car.category}</Badge>,
    },
    {
      id: "plate",
      header: "Plate",
      className: "hidden md:table-cell",
      headClassName: "hidden md:table-cell",
      cell: (car) => <span className="font-mono text-xs">{car.licensePlate}</span>,
    },
    {
      id: "rate",
      header: "Rate",
      cell: (car) => <span className="font-semibold text-primary">${car.dailyRate}/day</span>,
    },
    {
      id: "status",
      header: "Status",
      cell: (car) => (
        <Badge className={car.isAvailable ? "bg-primary/20 text-primary border-primary/30 text-[10px]" : "bg-destructive/20 text-destructive border-destructive/30 text-[10px]"}>
          {car.isAvailable ? "Available" : "Unavailable"}
        </Badge>
      ),
    },
    {
      id: "available",
      header: "Available",
      className: "hidden lg:table-cell",
      headClassName: "hidden lg:table-cell",
      cell: (car) => (
        <Switch
          checked={car.isAvailable}
          onCheckedChange={() => handleToggleAvailable(car._id, car.isAvailable)}
          className="cursor-pointer"
        />
      ),
    },
    {
      id: "actions",
      header: "Actions",
      className: "text-right",
      headClassName: "text-right",
      cell: (car) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs cursor-pointer"
            onClick={() => navigate(`/admin/cars/${car._id}/bookings`)}
          >
            <CalendarDays className="h-3 w-3 mr-1" /> Bookings
          </Button>
          <Hint label="Edit car">
            <Button variant="ghost" size="icon" onClick={() => openEdit(car)} className="cursor-pointer h-8 w-8" aria-label="Edit car">
              <Pencil className="h-4 w-4" />
            </Button>
          </Hint>
          {canDelete && (
          <Hint label="Delete car">
            <Button variant="ghost" size="icon" onClick={() => handleDelete(car._id)} className="cursor-pointer h-8 w-8 text-destructive hover:text-destructive" aria-label="Delete car">
              <Trash2 className="h-4 w-4" />
            </Button>
          </Hint>
          )}
        </div>
      ),
    },
  ];

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

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <Input
          placeholder="Search by make, model, plate..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={categoryFilter}
          onValueChange={(value) => setCategoryFilter(value as "all" | DisplayVehicleCategory)}
        >
          <SelectTrigger className="w-full sm:w-40 cursor-pointer">
            <SelectValue placeholder="Car type" />
          </SelectTrigger>
          <SelectContent>
            {VEHICLE_TYPE_FILTER_OPTIONS.map((type) => (
              <SelectItem key={type} value={type} className="cursor-pointer">
                {type === "all" ? "All types" : formatVehicleCategoryLabel(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {carsLoading ? (
        <AdminDataTable columns={carColumns} data={[]} getRowKey={(c) => c._id} isLoading />
      ) : (
        <AdminDataTable
          columns={carColumns}
          data={filtered}
          getRowKey={(c) => c._id}
          emptyIcon={CarIcon}
          emptyMessage="No cars found"
        />
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Car" : "Add New Car"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {([["make", "Make *"], ["model", "Model *"], ["year", "Year *"], ["dailyRate", "Daily Rate ($) *"]] as const).map(([key, label]) => (
              <div key={key} className="min-w-0 space-y-1">
                <Label className="text-xs">{label}</Label>
                <Input value={form[key]} onChange={f(key)} placeholder={label.replace(" *", "")} className="w-full" />
              </div>
            ))}
            <div className="min-w-0 space-y-1">
              <Label className="text-xs">Daily Mileage Limit (km/day)</Label>
              <Input
                type="number"
                min={0}
                value={form.dailyMileageLimit}
                onChange={f("dailyMileageLimit")}
                placeholder="e.g. 100"
                className="w-full"
              />
            </div>
            <div className="min-w-0 space-y-1">
              <Label className="text-xs">Charge per Extra Km ($)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.chargePerExtraKm}
                onChange={f("chargePerExtraKm")}
                placeholder="e.g. 0.50"
                className="w-full"
              />
            </div>
            <div className="min-w-0 space-y-1">
              <Label className="text-xs">Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v as CarCategory }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["economy","compact","sedan","suv","luxury","sports","van"] as const).map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 space-y-1">
              <Label className="text-xs">Transmission</Label>
              <Select value={form.transmission} onValueChange={(v) => setForm((p) => ({ ...p, transmission: v as Transmission }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatic">Automatic</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 space-y-1">
              <Label className="text-xs">Fuel Type</Label>
              <Select value={form.fuelType} onValueChange={(v) => setForm((p) => ({ ...p, fuelType: v as FuelType }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["gasoline","diesel","electric","hybrid"] as const).map((ft) => (
                    <SelectItem key={ft} value={ft} className="capitalize">{ft}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {([["color", "Color"], ["licensePlate", "License Plate"], ["vin", "VIN *"], ["seats", "Seats"], ["mileage", "Mileage (km)"]] as const).map(([key, label]) => (
              <div key={key} className="min-w-0 space-y-1">
                <Label className="text-xs">{label}</Label>
                <Input
                  value={form[key]}
                  onChange={f(key)}
                  placeholder={label.replace(" *", "")}
                  className="w-full"
                  required={key === "vin"}
                />
              </div>
            ))}

            {/* Main Image Upload */}
            <div className="col-span-2 space-y-2">
              <Label className="text-xs flex items-center gap-1">
                <ImageIcon className="h-3 w-3" /> Main Image
              </Label>
              <div
                className="border-2 border-dashed border-border/50 rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => mainImageRef.current?.click()}
              >
                {mainImagePreview ? (
                  <div className="relative">
                    <img src={mainImagePreview} alt="Main" className="w-full h-36 object-cover rounded-lg" />
                    <button
                      onClick={(e) => { e.stopPropagation(); setMainImage(null); setMainImagePreview(""); if (mainImageRef.current) mainImageRef.current.value = ""; }}
                      className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="py-4 text-muted-foreground">
                    <Upload className="h-6 w-6 mx-auto mb-2" />
                    <p className="text-sm">Click to upload main image</p>
                    <p className="text-xs mt-0.5">JPG, PNG, WebP</p>
                  </div>
                )}
              </div>
              <input ref={mainImageRef} type="file" accept="image/*" className="hidden" onChange={handleMainImageChange} />
            </div>

            {/* Additional Images Upload */}
            <div className="col-span-2 space-y-2">
              <Label className="text-xs flex items-center gap-1">
                <ImageIcon className="h-3 w-3" /> Additional Images (up to 3)
              </Label>
              <div
                className="border-2 border-dashed border-border/50 rounded-xl p-4 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => additionalImagesRef.current?.click()}
              >
                {additionalPreviews.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {additionalPreviews.map((src, i) => (
                      <img key={i} src={src} alt={`Additional ${i + 1}`} className="w-full h-20 object-cover rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <div className="py-3 text-center text-muted-foreground">
                    <Upload className="h-5 w-5 mx-auto mb-1" />
                    <p className="text-xs">Click to upload additional images (up to 3)</p>
                  </div>
                )}
              </div>
              <input ref={additionalImagesRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAdditionalImagesChange} />
              {additionalPreviews.length > 0 && (
                <button
                  onClick={() => { setAdditionalImages([]); setAdditionalPreviews([]); if (additionalImagesRef.current) additionalImagesRef.current.value = ""; }}
                  className="text-xs text-muted-foreground hover:text-destructive cursor-pointer"
                >
                  Clear additional images
                </button>
              )}
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
