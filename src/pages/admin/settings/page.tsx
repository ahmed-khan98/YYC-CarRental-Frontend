import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { configApi } from "@/api/config.api.ts";
import { getApiErrorMessage } from "@/api/client.ts";
import { DEFAULT_PRE_AUTHORIZED_AMOUNT } from "@/config/appConfig.ts";
import { AdminDataTable, type AdminTableColumn } from "@/components/admin-data-table.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Hint } from "@/components/ui/tooltip.tsx";
import { toast } from "sonner";
import { formatMoney } from "@/lib/rentalPricing.ts";
import { Pencil, SlidersHorizontal } from "lucide-react";

type ConfigRow = {
  id: string;
  name: string;
  value: number;
};

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const { data: config, isLoading } = useQuery({
    queryKey: ["config"],
    queryFn: configApi.get,
  });
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const current = config?.preAuthorizedAmount ?? DEFAULT_PRE_AUTHORIZED_AMOUNT;
  const rows = useMemo<ConfigRow[]>(
    () => [
      {
        id: "preAuthorizedAmount",
        name: "Pre-authorized amount",
        value: current,
      },
    ],
    [current],
  );

  const save = useMutation({
    mutationFn: (preAuthorizedAmount: number) => configApi.update({ preAuthorizedAmount }),
    onSuccess: (next) => {
      queryClient.setQueryData(["config"], next);
      toast.success("Pre-authorized amount updated");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const openEdit = (row: ConfigRow) => {
    setAmount(String(row.value));
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await save.mutateAsync(Number(amount));
      setOpen(false);
    } catch {
      // toast handled by mutation
    } finally {
      setSaving(false);
    }
  };

  const columns: AdminTableColumn<ConfigRow>[] = [
    {
      id: "name",
      header: "Setting",
      cell: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      id: "value",
      header: "Value",
      cell: (row) => <span className="tabular-nums">{formatMoney(row.value)}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      className: "text-right",
      headClassName: "text-right",
      cell: (row) => (
        <div className="flex items-center justify-end">
          <Hint label="Edit amount">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openEdit(row)}
              className="cursor-pointer h-8 w-8"
              aria-label="Edit pre-authorized amount"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </Hint>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Config</h2>
        <p className="text-muted-foreground text-sm mt-1">App config</p>
      </div>

      <AdminDataTable
        columns={columns}
        data={rows}
        getRowKey={(row) => row.id}
        isLoading={isLoading}
        loadingRows={1}
        emptyIcon={SlidersHorizontal}
        emptyMessage="No config yet"
      />

      <p className="text-xs text-muted-foreground">
        This hold is snapshotted onto each booking when it is created. Changing it here does not
        update existing bookings.
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit pre-authorized amount</DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            <Label className="text-xs">Amount</Label>
            <Input
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="tabular-nums"
            />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)} className="cursor-pointer">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !amount} className="cursor-pointer">
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
