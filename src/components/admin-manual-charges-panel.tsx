import { useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingsApi } from "@/api/bookings.api.ts";
import type { BillEntry, BillEntryStatus, BillPaidVia, SecurityDepositSummary } from "@/types/index.ts";
import {
  formatMoney,
  getBillEntryTotals,
  resolveEntryPhase,
  BILL_ENTRY_STATUS_LABELS,
} from "@/lib/billing.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import {
  BookingDetailCard,
  BookingDetailCardContent,
  BookingDetailCardHeader,
  SectionTitle,
} from "@/components/booking-detail-ui.tsx";
import {
  BillEntryStatusBadge,
  BillEntryStatusControl,
  BILL_ENTRY_STATUS_OPTIONS,
} from "@/components/bill-entry-status-badge.tsx";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/api/client.ts";
import { Plus, Trash2, DollarSign, CreditCard, FilePlus, Pencil, Paperclip } from "lucide-react";
import { BookingActorValue } from "@/components/booking-actor-value.tsx";
import { actorFromBillEntry } from "@/lib/bookingActor.ts";
import { persistBrowserFile, resolveMediaUrl } from "@/lib/mediaUrl.ts";
import { UploadProgressStatus } from "@/components/upload-progress.tsx";
import { Hint } from "@/components/ui/tooltip.tsx";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group.tsx";
import { cn } from "@/lib/utils.ts";
import {
  BILL_PAID_VIA_LABELS,
  canPayFromDeposit,
  chargeAmountDue,
  isDepositPaymentEnabled,
  remainingDepositForEntry,
} from "@/lib/securityDeposit.ts";
import { useAuth } from "@/hooks/use-auth.ts";
import { canDeleteRecords } from "@/lib/roles.ts";

const STATUS_OPTIONS = BILL_ENTRY_STATUS_OPTIONS;
const MAX_ATTACHMENT_BYTES = 50 * 1024 * 1024;

type AdminManualChargesPanelProps = {
  bookingId: string;
  billEntries: BillEntry[];
  securityDeposit?: SecurityDepositSummary;
};

type DeleteTarget = {
  id: string;
  title: string;
  type: "charge" | "payment";
};

function isExtraMileageCharge(entry: BillEntry) {
  return (
    entry.entryType === "charge" &&
    (entry.systemKey === "extra_mileage" || /extra\s*mileage|excess\s*km/i.test(entry.title ?? ""))
  );
}

function hasCheckOutPayment(entries: BillEntry[]) {
  return entries.some(
    (entry) =>
      entry.entryType === "payment" &&
      entry.status !== "refund" &&
      /check[\s-]?out/i.test(entry.title ?? ""),
  );
}

function PaymentMethodFields({
  value,
  onChange,
  remaining,
  depositEnabled,
  amountDue,
  variant = "collect",
}: {
  value: BillPaidVia;
  onChange: (value: BillPaidVia) => void;
  remaining: number;
  depositEnabled: boolean;
  amountDue: number;
  variant?: "create" | "collect";
}) {
  const depositExceeds = depositEnabled && amountDue - remaining > 0.001;
  const isCreate = variant === "create";

  return (
    <div className="space-y-2">
      <Label className="text-xs">{isCreate ? "Payment method *" : "Payment method"}</Label>
      <RadioGroup
        value={value}
        onValueChange={(next) => onChange(next as BillPaidVia)}
        className="gap-2"
      >
        <label className="flex items-start gap-2.5 rounded-lg border border-border/50 bg-background/70 px-3 py-2 cursor-pointer">
          <RadioGroupItem value="e_transfer" className="mt-0.5" />
          <div>
            <p className="text-sm font-medium">E-Transfer</p>
            <p className="text-[11px] text-muted-foreground">
              {isCreate
                ? "Customer must pay by e-transfer. Charge stays unpaid until marked paid."
                : "Customer paid outside deposit"}
            </p>
          </div>
        </label>
        <label
          className={cn(
            "flex items-start gap-2.5 rounded-lg border border-border/50 bg-background/70 px-3 py-2",
            depositEnabled ? "cursor-pointer" : "opacity-60 cursor-not-allowed",
          )}
        >
          <RadioGroupItem value="deposit" className="mt-0.5" disabled={!depositEnabled} />
          <div>
            <p className="text-sm font-medium">{isCreate ? "Pre-authorized" : "From Deposit"}</p>
            <p className="text-[11px] text-muted-foreground">
              {isCreate
                ? `Charge tax-inclusive total from the $800 security deposit · remaining ${formatMoney(remaining)}`
                : `Deduct from the $800 hold · remaining ${formatMoney(remaining)}`}
            </p>
            {depositExceeds && (
              <p className="text-[11px] text-destructive mt-0.5">
                Charge of {formatMoney(amountDue)} exceeds remaining deposit of {formatMoney(remaining)}.
              </p>
            )}
          </div>
        </label>
      </RadioGroup>
    </div>
  );
}

function PaidViaBadge({ paidVia }: { paidVia?: BillPaidVia }) {
  if (!paidVia) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        paidVia === "deposit"
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-sky-200 bg-sky-50 text-sky-800",
      )}
    >
      {BILL_PAID_VIA_LABELS[paidVia]}
    </span>
  );
}

function FinanceCard({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "payment";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-2.5 space-y-1.5",
        tone === "payment"
          ? "border-green-500/20 bg-green-500/5"
          : "border-border/40 bg-muted/20",
      )}
    >
      {children}
    </div>
  );
}

export function AdminManualChargesPanel({
  bookingId,
  billEntries,
  securityDeposit,
}: AdminManualChargesPanelProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canDelete = canDeleteRecords(user?.role);
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [newPaidVia, setNewPaidVia] = useState<BillPaidVia>("e_transfer");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editStatus, setEditStatus] = useState<BillEntryStatus>("unpaid");
  const [editPaidVia, setEditPaidVia] = useState<BillPaidVia>("e_transfer");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [payTarget, setPayTarget] = useState<BillEntry | null>(null);
  const [payVia, setPayVia] = useState<BillPaidVia>("e_transfer");
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);

  const extraMileageCharges = billEntries.filter(isExtraMileageCharge);
  const checkoutPaymentCollected = hasCheckOutPayment(billEntries);
  const manualCharges = billEntries.filter((e) => e.entryType === "charge" && e.source === "manual");
  const payments = billEntries.filter((e) => e.entryType === "payment");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["bookings", bookingId, "detail"] });
    queryClient.invalidateQueries({ queryKey: ["bookings"] });
  };

  const addEntry = useMutation({
    mutationFn: () =>
      bookingsApi.addBillEntry(bookingId, {
        title: title.trim(),
        description: description.trim() || undefined,
        amount: Number(amount),
        entryType: "charge",
        paidVia: newPaidVia,
        attachment,
        onUploadProgress: (progress) => setUploadPercent(progress.percent),
      }),
    onSuccess: () => {
      toast.success("Charge added");
      setTitle("");
      setDescription("");
      setAmount("");
      setNewPaidVia("e_transfer");
      setAttachment(null);
      setUploadPercent(null);
      setShowAddForm(false);
      invalidate();
    },
    onError: (err) => {
      setUploadPercent(null);
      toast.error(getApiErrorMessage(err));
    },
  });

  const updateEntryStatus = useMutation({
    mutationFn: ({
      entryId,
      status,
      paidVia,
    }: {
      entryId: string;
      status: BillEntryStatus;
      paidVia?: BillPaidVia;
    }) => bookingsApi.updateBillEntry(bookingId, entryId, { status, paidVia }),
    onSuccess: () => {
      setPayTarget(null);
      setPayVia("e_transfer");
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const saveEditedEntry = useMutation({
    mutationFn: (entryId: string) =>
      bookingsApi.updateBillEntry(bookingId, entryId, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        amount: Number(editAmount),
        status: editStatus,
        ...(editStatus === "paid" ? { paidVia: editPaidVia } : {}),
      }),
    onSuccess: () => {
      toast.success("Charge updated");
      setEditingEntryId(null);
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const deleteEntry = useMutation({
    mutationFn: (entryId: string) => bookingsApi.deleteBillEntry(bookingId, entryId),
    onSuccess: () => {
      toast.success("Entry removed");
      setDeleteTarget(null);
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const startEditing = (entry: BillEntry) => {
    setEditingEntryId(entry._id);
    setEditTitle(entry.title);
    setEditDescription(entry.description ?? "");
    setEditAmount(String(entry.amount));
    setEditStatus(entry.status);
    setEditPaidVia(entry.paidVia ?? "e_transfer");
    setShowAddForm(false);
  };

  const cancelEditing = () => {
    setEditingEntryId(null);
    setEditTitle("");
    setEditDescription("");
    setEditAmount("");
    setEditStatus("unpaid");
    setEditPaidVia("e_transfer");
  };

  const handleSaveEdit = () => {
    if (!editTitle.trim() || !editAmount || Number(editAmount) < 0) {
      toast.error("Enter a title and valid amount");
      return;
    }
    if (!editingEntryId) return;
    const due = getBillEntryTotals(Number(editAmount)).totalAmount;
    if (editStatus === "paid" && editPaidVia === "deposit") {
      const editing = billEntries.find((entry) => entry._id === editingEntryId);
      if (!canPayFromDeposit(securityDeposit, due, editing)) {
        toast.error(
          `Charge of ${formatMoney(due)} exceeds remaining security deposit of ${formatMoney(remainingDepositForEntry(securityDeposit, editing))}`,
        );
        return;
      }
    }
    saveEditedEntry.mutate(editingEntryId);
  };

  const resetAddForm = () => {
    setTitle("");
    setDescription("");
    setAmount("");
    setNewPaidVia("e_transfer");
    setAttachment(null);
    setUploadPercent(null);
    setShowAddForm(false);
  };

  const handleAdd = () => {
    if (!title.trim() || !amount || Number(amount) < 0) {
      toast.error("Enter a title and valid amount");
      return;
    }
    if (newPaidVia !== "e_transfer" && newPaidVia !== "deposit") {
      toast.error("Select a payment method");
      return;
    }
    if (attachment && attachment.size > MAX_ATTACHMENT_BYTES) {
      toast.error("Attachment must be 50MB or smaller");
      return;
    }
    const due = getBillEntryTotals(Number(amount)).totalAmount;
    if (newPaidVia === "deposit" && !canPayFromDeposit(securityDeposit, due)) {
      toast.error(
        `Charge of ${formatMoney(due)} exceeds remaining security deposit of ${formatMoney(remainingDepositForEntry(securityDeposit))}`,
      );
      return;
    }
    addEntry.mutate();
  };

  const confirmPayFromMethod = () => {
    if (!payTarget) return;
    const due = chargeAmountDue(payTarget);
    if (payVia === "deposit" && !canPayFromDeposit(securityDeposit, due, payTarget)) {
      toast.error(
        `Charge of ${formatMoney(due)} exceeds remaining security deposit of ${formatMoney(remainingDepositForEntry(securityDeposit, payTarget))}`,
      );
      return;
    }
    updateEntryStatus.mutate({ entryId: payTarget._id, status: "paid", paidVia: payVia });
  };

  const renderStatusControl = (entry: BillEntry) => (
    <BillEntryStatusControl
      status={entry.status}
      disabled={updateEntryStatus.isPending}
      onChange={(value) => {
        if (entry.entryType === "charge" && value === "paid" && entry.status !== "paid") {
          setPayVia("e_transfer");
          setPayTarget(entry);
          return;
        }
        updateEntryStatus.mutate({ entryId: entry._id, status: value });
      }}
    />
  );

  return (
    <BookingDetailCard>
      <BookingDetailCardHeader>
        <SectionTitle icon={<FilePlus className="h-4 w-4" />} title="Additional Charges" />
      </BookingDetailCardHeader>
      <BookingDetailCardContent className="space-y-3">
        <p className="text-xs text-muted-foreground leading-snug">
          Every new charge emails the customer an invoice. Pre-authorized charges are paid from the security deposit; e-transfer charges stay unpaid until you mark them paid.
        </p>

        {extraMileageCharges.length > 0 && (
          <div className="space-y-2">
            {extraMileageCharges.map((entry) => {
              const lineTotals = getBillEntryTotals(entry.amount);
              const totalDue = entry.totalAmount ?? lineTotals.totalAmount;
              const taxAmount = entry.taxAmount ?? lineTotals.taxAmount;
              const displayStatus =
                entry.status === "paid" || checkoutPaymentCollected ? "paid" : entry.status;

              return (
                <FinanceCard key={entry._id}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-snug break-words">{entry.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          On check-out invoice
                        </span>
                        <BillEntryStatusBadge status={displayStatus} />
                      </div>
                    </div>
                    <p className="text-sm font-semibold tabular-nums shrink-0">{formatMoney(totalDue)}</p>
                  </div>
                  {entry.description && (
                    <p className="text-xs text-muted-foreground leading-snug break-words">{entry.description}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    Subtotal {formatMoney(entry.amount)} + tax {formatMoney(taxAmount)} ={" "}
                    <span className="font-medium text-foreground">{formatMoney(totalDue)} due</span>
                  </p>
                </FinanceCard>
              );
            })}
          </div>
        )}

        {manualCharges.length > 0 && (
          <div className="space-y-2">
            {manualCharges.map((entry) => {
              const lineTotals = getBillEntryTotals(entry.amount);
              const totalDue = entry.totalAmount ?? lineTotals.totalAmount;
              const taxAmount = entry.taxAmount ?? lineTotals.taxAmount;
              const isEditing = editingEntryId === entry._id;
              const actor = actorFromBillEntry(entry);

              if (isEditing) {
                return (
                  <div
                    key={entry._id}
                    className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-3"
                  >
                    <p className="text-xs font-medium flex items-center gap-1.5">
                      <Pencil className="h-3.5 w-3.5" />
                      Edit charge
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-xs">Title *</Label>
                        <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-xs">Description</Label>
                        <Input
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Optional details"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Amount ($, before tax) *</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                        />
                        {editAmount && Number(editAmount) > 0 && (
                          <p className="text-[11px] text-muted-foreground">
                            Total with 5% tax:{" "}
                            {formatMoney(getBillEntryTotals(Number(editAmount)).totalAmount)}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Status</Label>
                        <Select
                          value={editStatus}
                          onValueChange={(v) => setEditStatus(v as BillEntryStatus)}
                        >
                          <SelectTrigger className="cursor-pointer">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((status) => (
                              <SelectItem key={status} value={status} className="cursor-pointer">
                                {BILL_ENTRY_STATUS_LABELS[status]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {editStatus === "paid" && (
                        <div className="sm:col-span-2">
                          <PaymentMethodFields
                            value={editPaidVia}
                            onChange={setEditPaidVia}
                            remaining={remainingDepositForEntry(
                              securityDeposit,
                              billEntries.find((item) => item._id === entry._id),
                            )}
                            depositEnabled={isDepositPaymentEnabled(securityDeposit)}
                            amountDue={getBillEntryTotals(Number(editAmount) || 0).totalAmount}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="cursor-pointer"
                        onClick={cancelEditing}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="cursor-pointer"
                        disabled={saveEditedEntry.isPending}
                        onClick={handleSaveEdit}
                      >
                        {saveEditedEntry.isPending ? "Saving..." : "Save changes"}
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <FinanceCard key={entry._id}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-snug break-words">{entry.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        {resolveEntryPhase(entry) === "check_out" && (
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            On check-out invoice
                          </span>
                        )}
                        <PaidViaBadge paidVia={entry.paidVia} />
                      </div>
                    </div>
                    <p className="text-sm font-semibold tabular-nums shrink-0">{formatMoney(totalDue)}</p>
                  </div>
                  {entry.description && (
                    <p className="text-xs text-muted-foreground leading-snug break-words">{entry.description}</p>
                  )}
                  {actor && (
                    <BookingActorValue
                      actor={actor}
                      compact
                      className="items-start text-left"
                    />
                  )}
                  {entry.attachmentUrl && (
                    <a
                      href={resolveMediaUrl(entry.attachmentUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                    >
                      <Paperclip className="h-3 w-3" />
                      {entry.attachmentName || "Attachment"}
                    </a>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    Subtotal {formatMoney(entry.amount)} + tax {formatMoney(taxAmount)} ={" "}
                    <span className="font-medium text-foreground">{formatMoney(totalDue)} due</span>
                  </p>
                  <div className="flex items-center justify-end gap-0.5 pt-0.5">
                    {renderStatusControl(entry)}
                    <Hint label="Edit charge">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                        aria-label="Edit charge"
                        onClick={() => startEditing(entry)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </Hint>
                    {canDelete && (
                    <Hint label="Delete charge">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive cursor-pointer"
                        aria-label="Delete charge"
                        onClick={() =>
                          setDeleteTarget({ id: entry._id, title: entry.title, type: "charge" })
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </Hint>
                    )}
                  </div>
                </FinanceCard>
              );
            })}
          </div>
        )}

        {payments.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Payment Records
            </p>
            {payments.map((entry) => (
              <FinanceCard key={entry._id} tone="payment">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-snug break-words flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-green-600 shrink-0" />
                      {entry.title}
                    </p>
                    <span className="mt-1 inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-800">
                      Payment
                    </span>
                  </div>
                  <p
                    className={`text-sm font-semibold tabular-nums shrink-0 ${
                      entry.status === "refund" ? "text-blue-600" : "text-green-600"
                    }`}
                  >
                    {entry.status === "refund" ? "+" : "−"}
                    {formatMoney(entry.amount)}
                  </p>
                </div>
                {entry.description && (
                  <p className="text-xs text-muted-foreground leading-snug break-words">{entry.description}</p>
                )}
                <div className="flex items-center justify-end gap-0.5 pt-0.5">
                  {renderStatusControl(entry)}
                  {canDelete && (
                  <Hint label="Delete payment">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive cursor-pointer"
                      aria-label="Delete payment"
                      onClick={() =>
                        setDeleteTarget({ id: entry._id, title: entry.title, type: "payment" })
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </Hint>
                  )}
                </div>
              </FinanceCard>
            ))}
          </div>
        )}

        {!showAddForm ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={() => {
              cancelEditing();
              setShowAddForm(true);
            }}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add charge (e.g. traffic violation)
          </Button>
        ) : (
          <div className="rounded-xl border border-border/50 p-2.5 sm:p-4 space-y-3 bg-muted/10">
            <p className="text-xs font-medium flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" />
              New charge
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Title *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Traffic Violation"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional details — this is emailed to the customer"
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Amount ($, before tax) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
                {amount && Number(amount) > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    Total with 5% tax: {formatMoney(getBillEntryTotals(Number(amount)).totalAmount)}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Attachment</Label>
                <Input
                  type="file"
                  accept="image/*,.pdf,application/pdf"
                  className="cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    if (file && file.size > MAX_ATTACHMENT_BYTES) {
                      toast.error("Attachment must be 50MB or smaller");
                      e.target.value = "";
                      setAttachment(null);
                      return;
                    }
                    setAttachment(file ? persistBrowserFile(file, "charge") : null);
                  }}
                />
                <p className="text-[11px] text-muted-foreground">
                  Photo or PDF of a ticket, up to 50MB
                  {attachment ? ` · ${attachment.name}` : ""}
                </p>
              </div>
              <div className="sm:col-span-2">
                <PaymentMethodFields
                  variant="create"
                  value={newPaidVia}
                  onChange={setNewPaidVia}
                  remaining={remainingDepositForEntry(securityDeposit)}
                  depositEnabled={isDepositPaymentEnabled(securityDeposit)}
                  amountDue={getBillEntryTotals(Number(amount) || 0).totalAmount}
                />
              </div>
            </div>
            {addEntry.isPending && attachment && (
              <UploadProgressStatus label="Uploading attachment" percent={uploadPercent ?? 0} />
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="cursor-pointer"
                onClick={resetAddForm}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="cursor-pointer"
                disabled={
                  addEntry.isPending ||
                  (newPaidVia === "deposit" &&
                    !canPayFromDeposit(
                      securityDeposit,
                      getBillEntryTotals(Number(amount) || 0).totalAmount,
                    ))
                }
                onClick={() => {
                  if (attachment) setUploadPercent(0);
                  handleAdd();
                }}
              >
                {addEntry.isPending ? (attachment ? "Uploading attachment..." : "Adding...") : "Add charge"}
              </Button>
            </div>
          </div>
        )}
      </BookingDetailCardContent>

      <AlertDialog
        open={Boolean(payTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setPayTarget(null);
            setPayVia("e_transfer");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark charge as paid</AlertDialogTitle>
            <AlertDialogDescription>
              {payTarget
                ? `Choose how ${formatMoney(chargeAmountDue(payTarget))} was collected for "${payTarget.title}".`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {payTarget && (
            <PaymentMethodFields
              value={payVia}
              onChange={setPayVia}
              remaining={remainingDepositForEntry(securityDeposit, payTarget)}
              depositEnabled={isDepositPaymentEnabled(securityDeposit)}
              amountDue={chargeAmountDue(payTarget)}
            />
          )}
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer"
              disabled={
                updateEntryStatus.isPending ||
                (payTarget != null &&
                  payVia === "deposit" &&
                  !canPayFromDeposit(securityDeposit, chargeAmountDue(payTarget), payTarget))
              }
              onClick={(event) => {
                if (
                  payTarget &&
                  payVia === "deposit" &&
                  !canPayFromDeposit(securityDeposit, chargeAmountDue(payTarget), payTarget)
                ) {
                  event.preventDefault();
                  confirmPayFromMethod();
                  return;
                }
                confirmPayFromMethod();
              }}
            >
              {updateEntryStatus.isPending ? "Saving..." : "Mark paid"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete bill entry?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `This will permanently remove "${deleteTarget.title}" from this booking. This action cannot be undone.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteEntry.isPending}
              onClick={() => deleteTarget && deleteEntry.mutate(deleteTarget.id)}
            >
              {deleteEntry.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </BookingDetailCard>
  );
}
