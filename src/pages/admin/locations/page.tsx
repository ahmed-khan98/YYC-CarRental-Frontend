import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { locationsApi } from "@/api/locations.api.ts";
import type { Location } from "@/types/index.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { AdminDataTable, type AdminTableColumn } from "@/components/admin-data-table.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog.tsx";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { Hint } from "@/components/ui/tooltip.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { patchText } from "@/lib/patchPayload.ts";
import { useAuth } from "@/hooks/use-auth.ts";
import { canDeleteRecords } from "@/lib/roles.ts";
import { cn } from "@/lib/utils.ts";

interface LocForm { name: string; address: string; city: string; phone: string; }
const EMPTY: LocForm = { name: "", address: "", city: "", phone: "" };

export default function AdminLocationsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canDelete = canDeleteRecords(user?.role);
  const { data: locations, isLoading } = useQuery({
    queryKey: ["locations"],
    queryFn: () => locationsApi.list(),
  });
  const create = useMutation({
    mutationFn: locationsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["locations"] }),
  });
  const update = useMutation({
    mutationFn: ({ locationId, data }: { locationId: string; data: Partial<Location> }) =>
      locationsApi.update(locationId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["locations"] }),
  });
  const remove = useMutation({
    mutationFn: locationsApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["locations"] }),
  });

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<LocForm>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Location | null>(null);

  const f = (k: keyof LocForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const openCreate = () => { setForm(EMPTY); setEditId(null); setOpen(true); };
  const openEdit = (loc: Location) => {
    setForm({ name: loc.name, address: loc.address, city: loc.city, phone: loc.phone ?? "" });
    setEditId(loc._id);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.address || !form.city) { toast.error("Fill required fields"); return; }
    setLoading(true);
    try {
      if (editId) {
        await update.mutateAsync({
          locationId: editId,
          data: { name: form.name, address: form.address, city: form.city, phone: patchText(form.phone) },
        });
        toast.success("Location updated");
      } else {
        await create.mutateAsync({ name: form.name, address: form.address, city: form.city, phone: patchText(form.phone) || undefined });
        toast.success("Location added");
      }
      setOpen(false);
    } catch { toast.error("Failed to save"); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await remove.mutateAsync(deleteTarget._id);
      toast.success("Deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    await update.mutateAsync({ locationId: id, data: { isActive: !current } });
    toast.success(`Location ${!current ? "activated" : "deactivated"}`);
  };

  const locationColumns: AdminTableColumn<Location>[] = [
    {
      id: "name",
      header: "Name",
      cell: (loc) => (
        <div className="flex items-center gap-2 min-w-[140px]">
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          <span className="font-medium">{loc.name}</span>
        </div>
      ),
    },
    {
      id: "address",
      header: "Address",
      className: "hidden sm:table-cell",
      headClassName: "hidden sm:table-cell",
      cell: (loc) => <span className="text-sm">{loc.address}</span>,
    },
    {
      id: "city",
      header: "City",
      cell: (loc) => loc.city,
    },
    {
      id: "phone",
      header: "Phone",
      className: "hidden md:table-cell",
      headClassName: "hidden md:table-cell",
      cell: (loc) => loc.phone ?? "—",
    },
    {
      id: "status",
      header: "Status",
      cell: (loc) => (
        <Badge
          variant="outline"
          className={cn(
            "text-[11px] font-medium border",
            loc.isActive
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-red-50 text-red-700 border-red-200",
          )}
        >
          {loc.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "active",
      header: "Active",
      className: "hidden lg:table-cell",
      headClassName: "hidden lg:table-cell",
      cell: (loc) => (
        <Switch checked={loc.isActive} onCheckedChange={() => handleToggle(loc._id, loc.isActive)} className="cursor-pointer" />
      ),
    },
    {
      id: "actions",
      header: "Actions",
      className: "text-right",
      headClassName: "text-right",
      cell: (loc) => (
        <div className="flex items-center justify-end gap-1">
          <Hint label="Edit location">
            <Button variant="ghost" size="icon" onClick={() => openEdit(loc)} className="cursor-pointer h-8 w-8" aria-label="Edit location">
              <Pencil className="h-4 w-4" />
            </Button>
          </Hint>
          {canDelete && (
          <Hint label="Delete location">
            <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(loc)} className="cursor-pointer h-8 w-8 text-destructive hover:text-destructive" aria-label="Delete location">
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
          <h2 className="text-2xl font-bold">Locations</h2>
          <p className="text-muted-foreground text-sm">{locations?.length ?? 0} pickup locations</p>
        </div>
        <Button onClick={openCreate} className="cursor-pointer"><Plus className="h-4 w-4 mr-2" />Add Location</Button>
      </div>

      <AdminDataTable
        columns={locationColumns}
        data={locations ?? []}
        getRowKey={(loc) => loc._id}
        isLoading={isLoading}
        emptyIcon={MapPin}
        emptyMessage="No locations yet"
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit Location" : "Add Location"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {([["name","Name *"],["address","Address *"],["city","City *"],["phone","Phone"]] as const).map(([key, label]) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs">{label}</Label>
                <Input value={form[key]} onChange={f(key)} placeholder={label.replace(" *","")} />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleSave} disabled={loading} className="cursor-pointer">{loading ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(next) => !next && setDeleteTarget(null)}
        title="Delete this location?"
        description={
          deleteTarget
            ? `This will permanently remove "${deleteTarget.name}". This action cannot be undone.`
            : ""
        }
        loading={remove.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
