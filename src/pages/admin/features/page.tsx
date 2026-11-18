import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { featuresApi } from "@/api/features.api.ts";
import type { CarFeature } from "@/types/index.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { AdminDataTable, type AdminTableColumn } from "@/components/admin-data-table.tsx";
import { AdminListPagination } from "@/components/admin-list-pagination.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog.tsx";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog.tsx";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Sparkles } from "lucide-react";
import { Hint } from "@/components/ui/tooltip.tsx";
import { useAuth } from "@/hooks/use-auth.ts";
import { canDeleteRecords } from "@/lib/roles.ts";
import { ADMIN_LIST_LIMIT, listItems, listMeta } from "@/lib/pagination.ts";
import { getApiErrorMessage } from "@/api/client.ts";

export default function AdminFeaturesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canDelete = canDeleteRecords(user?.role);
  const [page, setPage] = useState(1);
  const { data: featuresResult, isLoading } = useQuery({
    queryKey: ["features", { page, limit: ADMIN_LIST_LIMIT }],
    queryFn: () => featuresApi.list({ page, limit: ADMIN_LIST_LIMIT }),
  });
  const features = listItems(featuresResult);
  const featuresMeta = listMeta(featuresResult, page, ADMIN_LIST_LIMIT);
  const create = useMutation({
    mutationFn: featuresApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["features"] }),
  });
  const update = useMutation({
    mutationFn: ({ featureId, data }: { featureId: string; data: Partial<Pick<CarFeature, "name">> }) =>
      featuresApi.update(featureId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["features"] }),
  });
  const remove = useMutation({
    mutationFn: featuresApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["features"] }),
  });

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CarFeature | null>(null);

  const openCreate = () => {
    setName("");
    setEditId(null);
    setOpen(true);
  };
  const openEdit = (feature: CarFeature) => {
    setName(feature.name);
    setEditId(feature._id);
    setOpen(true);
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Feature name is required");
      return;
    }
    setLoading(true);
    try {
      if (editId) {
        await update.mutateAsync({ featureId: editId, data: { name: trimmed } });
        toast.success("Feature updated");
      } else {
        await create.mutateAsync({ name: trimmed });
        toast.success("Feature added");
      }
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
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

  const featureColumns: AdminTableColumn<CarFeature>[] = [
    {
      id: "name",
      header: "Name",
      cell: (feature) => <span className="font-medium">{feature.name}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      className: "text-right",
      headClassName: "text-right",
      cell: (feature) => (
        <div className="flex items-center justify-end gap-1">
          <Hint label="Edit feature">
            <Button variant="ghost" size="icon" onClick={() => openEdit(feature)} className="cursor-pointer h-8 w-8" aria-label="Edit feature">
              <Pencil className="h-4 w-4" />
            </Button>
          </Hint>
          {canDelete && (
            <Hint label="Delete feature">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteTarget(feature)}
                className="cursor-pointer h-8 w-8 text-destructive hover:text-destructive"
                aria-label="Delete feature"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Hint>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Features</h2>
          <p className="text-muted-foreground text-sm">{featuresMeta.total} car features</p>
        </div>
        <Button onClick={openCreate} className="cursor-pointer">
          <Plus className="h-4 w-4 mr-2" />
          Add Feature
        </Button>
      </div>

      <AdminDataTable
        columns={featureColumns}
        data={features}
        getRowKey={(feature) => feature._id}
        isLoading={isLoading}
        emptyIcon={Sparkles}
        emptyMessage="No features yet"
      />
      {!isLoading && (
        <AdminListPagination
          page={featuresMeta.page}
          totalPages={featuresMeta.totalPages}
          total={featuresMeta.total}
          limit={featuresMeta.limit}
          onPageChange={setPage}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Feature" : "Add Feature"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            <Label className="text-xs">Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bluetooth"
            />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)} className="cursor-pointer">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading} className="cursor-pointer">
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(next) => !next && setDeleteTarget(null)}
        title="Delete this feature?"
        description={
          deleteTarget
            ? `This will remove "${deleteTarget.name}" from the features list. Cars that already have it will keep it.`
            : ""
        }
        loading={remove.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
