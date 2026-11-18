import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { configApi } from "@/api/config.api.ts";
import { getApiErrorMessage } from "@/api/client.ts";
import { AdminDataTable, type AdminTableColumn } from "@/components/admin-data-table.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Hint } from "@/components/ui/tooltip.tsx";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";
import { formatMoney } from "@/lib/rentalPricing.ts";
import { Pencil, SlidersHorizontal } from "lucide-react";

type AmountRow = {
  id: "preAuthorizedAmount";
  kind: "amount";
  name: string;
  value: number;
};

type ToggleRow = {
  id: "userBookingEnabled";
  kind: "toggle";
  name: string;
  value: boolean;
};

type ConfigRow = AmountRow | ToggleRow;

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const { data: config, isLoading } = useQuery({
    queryKey: ["config"],
    queryFn: configApi.get,
  });
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const rows = useMemo<ConfigRow[]>(() => {
    if (!config) return [];
    return [
      {
        id: "preAuthorizedAmount",
        kind: "amount",
        name: "Pre-authorized amount",
        value: config.preAuthorizedAmount,
      },
      {
        id: "userBookingEnabled",
        kind: "toggle",
        name: "User self-booking",
        value: config.userBookingEnabled,
      },
    ];
  }, [config]);

  const save = useMutation({
    mutationFn: configApi.update,
    onSuccess: (next) => {
      queryClient.setQueryData(["config"], next);
      queryClient.setQueryData(["config", "public"], {
        userBookingEnabled: next.userBookingEnabled,
      });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const openEdit = (row: AmountRow) => {
    setAmount(String(row.value));
    setOpen(true);
  };

  const handleSaveAmount = async () => {
    setSaving(true);
    try {
      await save.mutateAsync({ preAuthorizedAmount: Number(amount) });
      toast.success("Pre-authorized amount updated");
      setOpen(false);
    } catch {
      // toast handled by mutation
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBooking = async (checked: boolean) => {
    try {
      await save.mutateAsync({ userBookingEnabled: checked });
      toast.success(checked ? "User booking is on" : "User booking is off — visitors go to Contact");
    } catch {
      // toast handled by mutation
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
      cell: (row) => {
        if (row.kind === "amount") {
          return <span className="tabular-nums">{formatMoney(row.value)}</span>;
        }
        const active = row.value;
        return (
          <Badge
            variant="outline"
            className={cn(
              "text-[11px] font-medium border",
              active
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-red-50 text-red-700 border-red-200",
            )}
          >
            {active ? "Active" : "Deactive"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      className: "text-right",
      headClassName: "text-right",
      cell: (row) => (
        <div className="flex items-center justify-end">
          {row.kind === "amount" ? (
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
          ) : (
            <Switch
              checked={row.value}
              disabled={save.isPending}
              onCheckedChange={handleToggleBooking}
              className="h-6 w-11 cursor-pointer data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 data-[state=unchecked]:bg-red-500 data-[state=unchecked]:border-red-500"
              aria-label={row.value ? "Deactivate user self-booking" : "Activate user self-booking"}
            />
          )}
        </div>
      ),
    },
  ];

  return (
   <div className="p-3 sm:p-4 space-y-3">
      <div>
        <h2 className="text-2xl font-bold">App Config</h2>
      </div>

      <AdminDataTable
        columns={columns}
        data={rows}
        getRowKey={(row) => row.id}
        isLoading={isLoading}
        loadingRows={2}
        emptyIcon={SlidersHorizontal}
        emptyMessage="No config yet"
      />

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
            <Button onClick={handleSaveAmount} disabled={saving || !amount} className="cursor-pointer">
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
