import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { servicesApi } from "@/api/services.api.ts";
import type { AdditionalService, ServiceCategory, ServiceChargeType } from "@/types/index.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { AdminDataTable, type AdminTableColumn } from "@/components/admin-data-table.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { toast } from "sonner";
import { formatServiceRateLabel } from "@/lib/serviceCharge.ts";
import { patchText } from "@/lib/patchPayload.ts";
import { Plus, Pencil, Trash2, Shield } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { Hint } from "@/components/ui/tooltip.tsx";
import { useAuth } from "@/hooks/use-auth.ts";
import { canDeleteRecords } from "@/lib/roles.ts";

interface SvcForm {
  name: string;
  description: string;
  dailyRate: string;
  chargeType: ServiceChargeType;
  category: ServiceCategory;
  allowQuantity: boolean;
}
const EMPTY: SvcForm = {
  name: "",
  description: "",
  dailyRate: "",
  chargeType: "per_day",
  category: "equipment",
  allowQuantity: false,
};

const CATEGORY_BADGE: Record<string, string> = {
  equipment: "bg-blue-50 text-blue-700 border-blue-200",
  driver: "bg-violet-50 text-violet-700 border-violet-200",
  insurance: "bg-amber-50 text-amber-800 border-amber-200",
  other: "bg-slate-50 text-slate-700 border-slate-200",
};

function chargeTypeLabel(chargeType?: ServiceChargeType) {
  return chargeType === "per_trip" ? "Per trip" : "Per day";
}

function truncateWords(text: string, maxWords = 8) {
  if (!text) return "—";
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return `${words.slice(0, maxWords).join(" ")}...`;
}

export default function AdminServicesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canDelete = canDeleteRecords(user?.role);
  const { data: services, isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: () => servicesApi.list(),
  });
  const create = useMutation({
    mutationFn: servicesApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services"] }),
  });
  const update = useMutation({
    mutationFn: ({ serviceId, data }: { serviceId: string; data: Partial<AdditionalService> }) =>
      servicesApi.update(serviceId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services"] }),
  });
  const remove = useMutation({
    mutationFn: servicesApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services"] }),
  });

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<SvcForm>(EMPTY);
  const [loading, setLoading] = useState(false);

  const f = (k: "name" | "description" | "dailyRate") => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const openCreate = () => { setForm(EMPTY); setEditId(null); setOpen(true); };
  const openEdit = (svc: AdditionalService) => {
    setForm({
      name: svc.name,
      description: svc.description ?? "",
      dailyRate: String(svc.dailyRate),
      chargeType: svc.chargeType ?? "per_day",
      category: svc.category,
      allowQuantity: svc.allowQuantity ?? false,
    });
    setEditId(svc._id);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.dailyRate) { toast.error("Fill required fields"); return; }
    setLoading(true);
    try {
      if (editId) {
        await update.mutateAsync({
          serviceId: editId,
          data: {
            name: form.name,
            description: patchText(form.description),
            dailyRate: Number(form.dailyRate),
            chargeType: form.chargeType,
            category: form.category,
            allowQuantity: form.allowQuantity,
          },
        });
        toast.success("Service updated");
      } else {
        await create.mutateAsync({
          name: form.name,
          description: patchText(form.description),
          dailyRate: Number(form.dailyRate),
          chargeType: form.chargeType,
          category: form.category,
          allowQuantity: form.allowQuantity,
        });
        toast.success("Service added");
      }
      setOpen(false);
    } catch { toast.error("Failed to save"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    try { await remove.mutateAsync(id); toast.success("Deleted"); }
    catch { toast.error("Failed to delete"); }
  };

  const handleToggle = async (id: string, current: boolean) => {
    await update.mutateAsync({ serviceId: id, data: { isActive: !current } });
    toast.success(`Service ${!current ? "activated" : "deactivated"}`);
  };

  const serviceColumns: AdminTableColumn<AdditionalService>[] = useMemo(
    () => [
      {
        id: "name",
        header: "Service",
        className: "max-w-[240px] whitespace-normal",
        headClassName: "whitespace-normal",
        cell: (svc) => (
          <div className="max-w-[240px]">
            <p className="font-medium truncate">{svc.name}</p>
            <Hint label={svc.description}>
              <p className="text-xs text-muted-foreground truncate">{truncateWords(svc.description ?? "")}</p>
            </Hint>
          </div>
        ),
      },
      {
        id: "category",
        header: "Category",
        cell: (svc) => (
          <Badge
            variant="outline"
            className={cn(
              "capitalize text-[11px] font-medium border",
              CATEGORY_BADGE[svc.category] ?? CATEGORY_BADGE.other,
            )}
          >
            {svc.category}
          </Badge>
        ),
      },
      {
        id: "chargeType",
        header: "Charge",
        cell: (svc) => (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {chargeTypeLabel(svc.chargeType)}
          </span>
        ),
      },
      {
        id: "price",
        header: "Price",
        className: "whitespace-nowrap",
        headClassName: "whitespace-nowrap",
        cell: (svc) => (
          <span className="text-sm font-semibold text-primary whitespace-nowrap">
            {formatServiceRateLabel(svc)}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: (svc) => (
          <Badge
            variant="outline"
            className={cn(
              "text-[11px] font-medium border",
              svc.isActive
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-red-50 text-red-700 border-red-200",
            )}
          >
            {svc.isActive ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        id: "active",
        header: "Active",
        className: "hidden lg:table-cell",
        headClassName: "hidden lg:table-cell",
        cell: (svc) => (
          <Switch
            checked={svc.isActive}
            onCheckedChange={() => handleToggle(svc._id, svc.isActive)}
            className="cursor-pointer"
          />
        ),
      },
      {
        id: "actions",
        header: "Actions",
        className: "text-right",
        headClassName: "text-right",
        cell: (svc) => (
          <div className="flex items-center justify-end gap-1">
            <Hint label="Edit service">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openEdit(svc)}
                className="cursor-pointer h-8 w-8"
                aria-label="Edit service"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </Hint>
            {canDelete && (
              <Hint label="Delete service">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(svc._id)}
                  className="cursor-pointer h-8 w-8 text-destructive hover:text-destructive"
                  aria-label="Delete service"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Hint>
            )}
          </div>
        ),
      },
    ],
    [canDelete],
  );

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Additional Services</h2>
          <p className="text-muted-foreground text-sm">{services?.length ?? 0} services</p>
        </div>
        <Button onClick={openCreate} className="cursor-pointer"><Plus className="h-4 w-4 mr-2" />Add Service</Button>
      </div>

      <AdminDataTable
        columns={serviceColumns}
        data={services ?? []}
        getRowKey={(svc) => svc._id}
        isLoading={isLoading}
        emptyIcon={Shield}
        emptyMessage="No services yet"
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit Service" : "Add Service"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Name *</Label>
              <Input value={form.name} onChange={f("name")} placeholder="e.g. Baby Car Seat" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v as ServiceCategory }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["equipment","driver","insurance","other"] as const).map((c) => (
                      <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Charge Type</Label>
                <Select
                  value={form.chargeType}
                  onValueChange={(v) => setForm((p) => ({ ...p, chargeType: v as ServiceChargeType }))}
                >
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_day">Per day</SelectItem>
                    <SelectItem value="per_trip">Per trip</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Price ($) *</Label>
              <Input type="number" value={form.dailyRate} onChange={f("dailyRate")} placeholder="15" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description (optional)</Label>
              <textarea
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Short description of the service..."
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-3">
              <Label className="text-sm">Enable quantity counter</Label>
              <Switch
                checked={form.allowQuantity}
                onCheckedChange={(checked) => setForm((p) => ({ ...p, allowQuantity: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleSave} disabled={loading} className="cursor-pointer">{loading ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
