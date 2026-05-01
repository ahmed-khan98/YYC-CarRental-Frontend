import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge.tsx";

interface LocForm { name: string; address: string; city: string; phone: string; }
const EMPTY: LocForm = { name: "", address: "", city: "", phone: "" };

export default function AdminLocationsPage() {
  const locations = useQuery(api.locations.list, {});
  const create = useMutation(api.locations.create);
  const update = useMutation(api.locations.update);
  const remove = useMutation(api.locations.remove);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<Id<"locations"> | null>(null);
  const [form, setForm] = useState<LocForm>(EMPTY);
  const [loading, setLoading] = useState(false);

  const f = (k: keyof LocForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const openCreate = () => { setForm(EMPTY); setEditId(null); setOpen(true); };
  const openEdit = (loc: NonNullable<typeof locations>[number]) => {
    setForm({ name: loc.name, address: loc.address, city: loc.city, phone: loc.phone ?? "" });
    setEditId(loc._id);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.address || !form.city) { toast.error("Fill required fields"); return; }
    setLoading(true);
    try {
      if (editId) {
        await update({ locationId: editId, name: form.name, address: form.address, city: form.city, phone: form.phone || undefined });
        toast.success("Location updated");
      } else {
        await create({ name: form.name, address: form.address, city: form.city, phone: form.phone || undefined });
        toast.success("Location added");
      }
      setOpen(false);
    } catch { toast.error("Failed to save"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: Id<"locations">) => {
    if (!confirm("Delete this location?")) return;
    try { await remove({ locationId: id }); toast.success("Deleted"); }
    catch { toast.error("Failed to delete"); }
  };

  const handleToggle = async (id: Id<"locations">, current: boolean) => {
    await update({ locationId: id, isActive: !current });
    toast.success(`Location ${!current ? "activated" : "deactivated"}`);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Locations</h2>
          <p className="text-muted-foreground text-sm">{locations?.length ?? 0} pickup locations</p>
        </div>
        <Button onClick={openCreate} className="cursor-pointer"><Plus className="h-4 w-4 mr-2" />Add Location</Button>
      </div>

      {locations === undefined ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : locations.length === 0 ? (
        <div className="text-center py-16">
          <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No locations yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {locations.map((loc) => (
            <Card key={loc._id} className="border-border/50 bg-card/60">
              <CardContent className="p-4 flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{loc.name}</span>
                    <Badge className={loc.isActive ? "bg-primary/20 text-primary border-primary/30 text-[10px]" : "bg-destructive/20 text-destructive border-destructive/30 text-[10px]"}>
                      {loc.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{loc.address}, {loc.city}</p>
                  {loc.phone && <p className="text-xs text-muted-foreground">{loc.phone}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch checked={loc.isActive} onCheckedChange={() => handleToggle(loc._id, loc.isActive)} className="cursor-pointer" />
                  <Button variant="ghost" size="icon" onClick={() => openEdit(loc)} className="cursor-pointer"><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(loc._id)} className="cursor-pointer text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
    </div>
  );
}
