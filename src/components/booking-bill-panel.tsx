import { useState, type ReactNode } from "react";
import type { BillEntry, BillSummary } from "@/types/index.ts";
import { formatMoney } from "@/lib/billing.ts";
import { BookingActorValue } from "@/components/booking-actor-value.tsx";
import { actorFromBillEntry } from "@/lib/bookingActor.ts";
import { BillEntryStatusBadge } from "@/components/bill-entry-status-badge.tsx";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible.tsx";
import { cn } from "@/lib/utils.ts";
import { ChevronDown, CreditCard, FileText, Package, Receipt, Tags } from "lucide-react";

function formatUnitRate(amount: number) {
  if (Number.isInteger(amount)) return String(amount);
  return amount.toFixed(2).replace(/\.?0+$/, "");
}

function extraMileageLabel(km: number, chargePerKm: number) {
  return `Extra Mileage (${km} × $${formatUnitRate(chargePerKm)})`;
}

function ChargeRow({
  label,
  value,
  valueClassName,
  sublabel,
}: {
  label: ReactNode;
  value: ReactNode;
  valueClassName?: string;
  sublabel?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/20 px-3 py-2.5 text-sm last:border-0">
      <div className="min-w-0">
        <span className="text-muted-foreground leading-snug">{label}</span>
        {sublabel && <div className="mt-0.5 text-[11px] text-muted-foreground/80">{sublabel}</div>}
      </div>
      <span className={cn("shrink-0 font-medium tabular-nums text-foreground text-right", valueClassName)}>
        {value}
      </span>
    </div>
  );
}

function SectionTotalRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border/20 bg-muted/20 px-3 py-2.5">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  emphasized,
  valueClassName,
}: {
  label: string;
  value: ReactNode;
  emphasized?: boolean;
  valueClassName?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b border-border/20 px-4 py-3 last:border-0",
        emphasized && "bg-muted/30",
      )}
    >
      <span className={cn("text-sm", emphasized ? "font-semibold" : "font-medium text-muted-foreground")}>
        {label}
      </span>
      <span
        className={cn(
          "tabular-nums",
          emphasized ? "text-base font-bold text-foreground" : "text-sm font-semibold",
          valueClassName,
        )}
      >
        {value}
      </span>
    </div>
  );
}

function BillSection({
  open,
  onOpenChange,
  shellClassName,
  icon: Icon,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shellClassName?: string;
  icon: typeof Tags;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const collapsibleShell = "overflow-hidden rounded-lg border bg-muted/10";

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <div className={cn(collapsibleShell, shellClassName)}>
        <CollapsibleTrigger className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-muted/25 cursor-pointer">
          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{title}</p>
            <p className="text-[11px] text-muted-foreground">{subtitle}</p>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground/70 transition-transform",
              open && "rotate-180",
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="border-t border-border/20">
          {children}
          {footer}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

type BookingBillPanelProps = {
  billEntries: BillEntry[];
  billSummary: BillSummary;
  days: number;
  baseAmount: number;
  servicesAmount: number;
  serviceLines?: Array<{ name: string; amount: number }>;
  extraMileageCharge?: number;
  extraMileageKm?: number | null;
  chargePerExtraKm?: number | null;
  dailyRate?: number;
  isCancelled?: boolean;
};

export function BookingBillPanel({
  billEntries,
  billSummary,
  days,
  baseAmount,
  servicesAmount,
  serviceLines,
  extraMileageCharge = 0,
  extraMileageKm,
  chargePerExtraKm,
  dailyRate = 0,
  isCancelled = false,
}: BookingBillPanelProps) {
  const [rentalOpen, setRentalOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [additionalOpen, setAdditionalOpen] = useState(false);
  const [cancellationOpen, setCancellationOpen] = useState(true);
  const [paymentsOpen, setPaymentsOpen] = useState(false);

  const systemCharges = billEntries.filter(
    (entry) => entry.entryType === "charge" && entry.source === "system",
  );
  const manualCharges = billEntries.filter((e) => e.entryType === "charge" && e.source === "manual");
  const payments = billEntries.filter((e) => e.entryType === "payment");
  const paidPayments = payments.filter((e) => e.status === "paid");
  const refundPayments = payments.filter((e) => e.status === "refund");

  const cancellationSubtotal = systemCharges.reduce((sum, entry) => sum + entry.amount, 0);
  const hasCancellationCharges = isCancelled && systemCharges.length > 0;

  const extraKm = extraMileageKm ?? 0;
  const perKmRate =
    chargePerExtraKm ??
    (extraKm > 0 && extraMileageCharge > 0 ? extraMileageCharge / extraKm : null);

  const rentalSubtotal = baseAmount;
  const hasRentalCharges = rentalSubtotal > 0;
  const hasExtraMileage = extraMileageCharge > 0;

  const servicesSubtotal = servicesAmount;
  const hasServices = servicesSubtotal > 0;
  const resolvedServiceLines =
    serviceLines && serviceLines.length > 0
      ? serviceLines
      : hasServices
        ? [{ name: `Add-on Services (${days}d)`, amount: servicesSubtotal }]
        : [];

  const additionalSubtotal =
    extraMileageCharge + manualCharges.reduce((sum, entry) => sum + entry.amount, 0);
  const additionalLineCount = (hasExtraMileage ? 1 : 0) + manualCharges.length;
  const hasAdditionalCharges = additionalLineCount > 0;

  const rentalLineCount = 1;

  const showRentalBreakdown = !isCancelled && hasRentalCharges;
  const showServicesBreakdown = !isCancelled && hasServices;

  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-border/40 px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Receipt className="h-4 w-4" />
        </div>
        <h3 className="font-semibold text-sm tracking-tight flex-1">
          {isCancelled ? "Cancellation Bill" : "Billing Summary"}
        </h3>
      </div>

      <div className="space-y-2 p-3">
        {hasCancellationCharges && (
          <BillSection
            open={cancellationOpen}
            onOpenChange={setCancellationOpen}
            shellClassName="border-destructive/25"
            icon={Tags}
            title="Cancellation Charges"
            subtitle={`${systemCharges.length} ${systemCharges.length === 1 ? "entry" : "entries"} · ${formatMoney(cancellationSubtotal)}`}
            footer={<SectionTotalRow label="Charges total" value={formatMoney(cancellationSubtotal)} />}
          >
            {systemCharges.map((entry) => (
              <ChargeRow
                key={entry._id}
                label={entry.title}
                sublabel={entry.description}
                value={
                  <span className="inline-flex flex-col items-end gap-1">
                    <span>{formatMoney(entry.amount)}</span>
                    {entry.status !== "unpaid" && <BillEntryStatusBadge status={entry.status} />}
                  </span>
                }
              />
            ))}
          </BillSection>
        )}

        {showRentalBreakdown && (
          <BillSection
            open={rentalOpen}
            onOpenChange={setRentalOpen}
            shellClassName="border-primary/20"
            icon={Tags}
            title="Rental Charges"
            subtitle={`${rentalLineCount} ${rentalLineCount === 1 ? "entry" : "entries"} · ${formatMoney(rentalSubtotal)}`}
            footer={<SectionTotalRow label="Rental total" value={formatMoney(rentalSubtotal)} />}
          >
            <ChargeRow
              label={`Base Rate (${days}d × $${dailyRate}/day)`}
              value={formatMoney(baseAmount)}
            />
          </BillSection>
        )}

        {showServicesBreakdown && (
          <BillSection
            open={servicesOpen}
            onOpenChange={setServicesOpen}
            shellClassName="border-blue-500/20"
            icon={Package}
            title="Additional Services"
            subtitle={`${resolvedServiceLines.length} ${resolvedServiceLines.length === 1 ? "service" : "services"} · ${formatMoney(servicesSubtotal)}`}
            footer={<SectionTotalRow label="Services total" value={formatMoney(servicesSubtotal)} />}
          >
            {resolvedServiceLines.map((line) => (
              <ChargeRow key={line.name} label={line.name} value={formatMoney(line.amount)} />
            ))}
          </BillSection>
        )}

        {hasAdditionalCharges && (
          <BillSection
            open={additionalOpen}
            onOpenChange={setAdditionalOpen}
            shellClassName="border-amber-500/25"
            icon={FileText}
            title="Additional Charges"
            subtitle={`${additionalLineCount} ${additionalLineCount === 1 ? "charge" : "charges"} · ${formatMoney(additionalSubtotal)}`}
            footer={<SectionTotalRow label="Additional total" value={formatMoney(additionalSubtotal)} />}
          >
            {hasExtraMileage && (
              <ChargeRow
                label={
                  perKmRate != null
                    ? extraMileageLabel(extraKm, perKmRate)
                    : `Extra Mileage (${extraKm} km)`
                }
                value={formatMoney(extraMileageCharge)}
              />
            )}
            {manualCharges.map((entry) => {
              const actor = actorFromBillEntry(entry);
              return (
                <ChargeRow
                  key={entry._id}
                  label={entry.title}
                  sublabel={
                    entry.description || actor ? (
                      <>
                        {entry.description}
                        {actor && (
                          <BookingActorValue
                            actor={actor}
                            compact
                            className="items-start text-left mt-0.5"
                          />
                        )}
                      </>
                    ) : undefined
                  }
                  value={
                    <span className="inline-flex flex-col items-end gap-1">
                      <span>{formatMoney(entry.amount)}</span>
                      {entry.status !== "unpaid" && <BillEntryStatusBadge status={entry.status} />}
                    </span>
                  }
                />
              );
            })}
          </BillSection>
        )}

        {payments.length > 0 && (
          <Collapsible open={paymentsOpen} onOpenChange={setPaymentsOpen}>
            <div className="overflow-hidden rounded-lg border border-border/40 bg-muted/10">
              <CollapsibleTrigger className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-muted/25 cursor-pointer">
                <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Payments Received</p>
                  <p className="text-[11px] text-muted-foreground">
                    {payments.length} {payments.length === 1 ? "entry" : "entries"} ·{" "}
                    {formatMoney(billSummary.totalPaid)} collected
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground/70 transition-transform",
                    paymentsOpen && "rotate-180",
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="border-t border-border/20">
                <div className="px-3 py-1">
                  {paidPayments.map((entry) => (
                    <div
                      key={entry._id}
                      className="flex items-center justify-between gap-2 border-b border-border/15 py-2.5 text-sm last:border-0"
                    >
                      <span className="min-w-0 truncate text-muted-foreground">{entry.title}</span>
                      <span className="shrink-0 font-medium tabular-nums text-foreground">
                        −{formatMoney(entry.amount)}
                      </span>
                    </div>
                  ))}
                  {refundPayments.map((entry) => (
                    <div
                      key={entry._id}
                      className="flex items-center justify-between gap-2 border-b border-border/15 py-2.5 text-sm last:border-0"
                    >
                      <span className="min-w-0 truncate text-muted-foreground">
                        {entry.title} (refund)
                      </span>
                      <span className="shrink-0 font-medium tabular-nums text-foreground">
                        +{formatMoney(entry.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        )}

        <div className="overflow-hidden rounded-lg border border-border/40 bg-muted/10">
          <SummaryRow label="Subtotal" value={formatMoney(billSummary.chargeSubtotal)} />
          <SummaryRow label="Tax (5%)" value={formatMoney(billSummary.taxAmount)} />
          <SummaryRow label="Total Bill" value={formatMoney(billSummary.totalBill)} emphasized />
          {billSummary.totalPaid > 0 && (
            <>
              <SummaryRow label="Total Paid" value={formatMoney(billSummary.totalPaid)} />
              {billSummary.totalUnpaid > 0 && (
                <SummaryRow label="Balance Due" value={formatMoney(billSummary.totalUnpaid)} emphasized />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
