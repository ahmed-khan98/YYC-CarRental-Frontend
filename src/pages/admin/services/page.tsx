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
import { Plus, Pencil, Trash2, Shield } from "lucide-react";

type ServiceCategory = "equipment" | "driver" | "insurance" | "other";
interface SvcForm { name: string; description: string; dailyRate: string; category: ServiceCategory; }
const EMPTY: SvcForm = { name: "", description: "", dailyRate: "", category: "equipment" };

const CATEGORY_COLORS: Record<string, string> = {
  equipment: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  driver: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  insurance: "bg-green-500/20 text-green-400 border-green-500/30",
  other: "bg-secondary text-secondary-foreground",
};

export default function AdminServicesPage() {
  const services = useQuery(api.services.list, {});
  const create = useMutation(api.services.create);
  const update = useMutation(api.services.update);
  const remove = useMutation(api.services.remove);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<Id<"additionalServices"> | null>(null);
  const [form, setForm] = useState<SvcForm>(EMPTY);
  const [loading, setLoading] = useState(false);

  const f = (k: "name" | "description" | "dailyRate") => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const openCreate = () => { setForm(EMPTY); setEditId(null); setOpen(true); };
  const openEdit = (svc: NonNullable<typeof services>[number]) => {
    setForm({ name: svc.name, description: svc.description, dailyRate: String(svc.dailyRate), category: svc.category });
    setEditId(svc._id);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.dailyRate) { toast.error("Fill required fields"); return; }
    setLoading(true);
    try {
      if (editId) {
        await update({ serviceId: editId, name: form.name, description: form.description, dailyRate: Number(form.dailyRate) });
        toast.success("Service updated");
      } else {
        await create({ name: form.name, description: form.description, dailyRate: Number(form.dailyRate), category: form.category });
        toast.success("Service added");
      }
      setOpen(false);
    } catch { toast.error("Failed to save"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: Id<"additionalServices">) => {
    if (!confirm("Delete this service?")) return;
    try { await remove({ serviceId: id }); toast.success("Deleted"); }
    catch { toast.error("Failed to delete"); }
  };

  const handleToggle = async (id: Id<"additionalServices">, current: boolean) => {
    await update({ serviceId: id, isActive: !current });
    toast.success(`Service ${!current ? "activated" : "deactivated"}`);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Additional Services</h2>
          <p className="text-muted-foreground text-sm">{services?.length ?? 0} services</p>
        </div>
        <Button onClick={openCreate} className="cursor-pointer"><Plus className="h-4 w-4 mr-2" />Add Service</Button>
      </div>

      {services === undefined ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : services.length === 0 ? (
        <div className="text-center py-16">
          <Shield className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No services yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((svc) => (
            <Card key={svc._id} className="border-border/50 bg-card/60">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{svc.name}</span>
                    <Badge className={`text-[10px] border capitalize ${CATEGORY_COLORS[svc.category] ?? ""}`}>{svc.category}</Badge>
                    <Badge className={svc.isActive ? "bg-primary/20 text-primary border-primary/30 text-[10px]" : "bg-destructive/20 text-destructive border-destructive/30 text-[10px]"}>
                      {svc.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{svc.description}</p>
                  <p className="text-xs text-primary font-semibold mt-0.5">+${svc.dailyRate}/day</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch checked={svc.isActive} onCheckedChange={() => handleToggle(svc._id, svc.isActive)} className="cursor-pointer" />
                  <Button variant="ghost" size="icon" onClick={() => openEdit(svc)} className="cursor-pointer"><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(svc._id)} className="cursor-pointer text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit Service" : "Add Service"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Name *</Label>
              <Input value={form.name} onChange={f("name")} placeholder="e.g. Baby Car Seat" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v as ServiceCategory }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["equipment","driver","insurance","other"] as const).map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Daily Rate ($) *</Label>
              <Input type="number" value={form.dailyRate} onChange={f("dailyRate")} placeholder="15" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <textarea
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Short description of the service..."
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
