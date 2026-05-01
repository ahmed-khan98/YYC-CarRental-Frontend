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
import { toast } from "sonner";
import { Plus, Pencil, Wrench } from "lucide-react";
import { format } from "date-fns";

type MaintenanceStatus = "scheduled" | "in_progress" | "completed";
interface MaintForm {
  carId: string; type: string; description: string; scheduledDate: string; cost: string; notes: string;
}
const EMPTY: MaintForm = { carId: "", type: "", description: "", scheduledDate: "", cost: "", notes: "" };

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
};

export default function AdminMaintenancePage() {
  const cars = useQuery(api.cars.list, {});
  const maintenanceScheduled = useQuery(api.maintenance.listByStatus, { status: "scheduled" });
  const maintenanceInProgress = useQuery(api.maintenance.listByStatus, { status: "in_progress" });
  const maintenanceCompleted = useQuery(api.maintenance.listByStatus, { status: "completed" });

  const createMaint = useMutation(api.maintenance.create);
  const updateMaint = useMutation(api.maintenance.update);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<Id<"maintenance"> | null>(null);
  const [form, setForm] = useState<MaintForm>(EMPTY);
  const [loading, setLoading] = useState(false);

  const allMaintenance = [
    ...(maintenanceScheduled ?? []),
    ...(maintenanceInProgress ?? []),
    ...(maintenanceCompleted ?? []),
  ].sort((a, b) => b._creationTime - a._creationTime);

  const f = (k: keyof MaintForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const openCreate = () => { setForm(EMPTY); setEditId(null); setOpen(true); };

  const handleSave = async () => {
    if (!form.carId || !form.type || !form.scheduledDate) { toast.error("Fill required fields"); return; }
    setLoading(true);
    try {
      if (editId) {
        await updateMaint({
          maintenanceId: editId,
          notes: form.notes || undefined,
          cost: form.cost ? Number(form.cost) : undefined,
        });
        toast.success("Maintenance updated");
      } else {
        await createMaint({
          carId: form.carId as Id<"cars">,
          type: form.type,
          description: form.description,
          scheduledDate: new Date(form.scheduledDate).toISOString(),
          cost: form.cost ? Number(form.cost) : undefined,
          notes: form.notes || undefined,
        });
        toast.success("Maintenance scheduled");
      }
      setOpen(false);
    } catch { toast.error("Failed to save"); }
    finally { setLoading(false); }
  };

  const handleMarkComplete = async (id: Id<"maintenance">) => {
    try {
      await updateMaint({ maintenanceId: id, status: "completed", completedDate: new Date().toISOString() });
      toast.success("Marked as completed");
    } catch { toast.error("Failed to update"); }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Maintenance</h2>
          <p className="text-muted-foreground text-sm">{allMaintenance.length} records</p>
        </div>
        <Button onClick={openCreate} className="cursor-pointer"><Plus className="h-4 w-4 mr-2" />Schedule Maintenance</Button>
      </div>

      {maintenanceScheduled === undefined ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : allMaintenance.length === 0 ? (
        <div className="text-center py-16">
          <Wrench className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No maintenance records</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allMaintenance.map((m) => {
            const car = (cars ?? []).find((c) => c._id === m.carId);
            return (
              <Card key={m._id} className="border-border/50 bg-card/60">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{m.type}</span>
                        <Badge className={`text-[10px] border capitalize ${STATUS_COLORS[m.status] ?? ""}`}>{m.status.replace("_", " ")}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {car ? `${car.make} ${car.model} (${car.licensePlate})` : "Loading..."}
                      </p>
                      <p className="text-xs text-muted-foreground">{m.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Scheduled: {format(new Date(m.scheduledDate), "MMM d, yyyy")}
                        {m.cost ? ` · $${m.cost}` : ""}
                      </p>
                    </div>
                    {m.status !== "completed" && (
                      <Button size="sm" variant="secondary" onClick={() => handleMarkComplete(m._id)} className="cursor-pointer text-xs">
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Schedule Maintenance</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Vehicle *</Label>
              <Select value={form.carId} onValueChange={(v) => setForm((p) => ({ ...p, carId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  {(cars ?? []).map((c) => (
                    <SelectItem key={c._id} value={c._id}>{c.year} {c.make} {c.model} — {c.licensePlate}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {([["type","Type (e.g. Oil Change) *"],["scheduledDate","Scheduled Date *"],["cost","Estimated Cost ($)"]] as const).map(([key, label]) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs">{label}</Label>
                <Input
                  type={key === "scheduledDate" ? "date" : key === "cost" ? "number" : "text"}
                  value={form[key]}
                  onChange={f(key)}
                  placeholder={label.replace(" *","")}
                />
              </div>
            ))}
            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <textarea
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                rows={2}
                value={form.description}
                onChange={f("description")}
                placeholder="Describe the maintenance work..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleSave} disabled={loading} className="cursor-pointer">{loading ? "Saving..." : "Schedule"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
