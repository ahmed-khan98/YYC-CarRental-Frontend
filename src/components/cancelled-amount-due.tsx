import { AlertCircle, DollarSign } from "lucide-react";
import { formatMoney } from "@/lib/rentalPricing.ts";
import { cn } from "@/lib/utils.ts";
import type { Booking } from "@/types/index.ts";

export function resolveBookingBalanceDue(booking: Pick<Booking, "balanceDue" | "totalAmount" | "paymentStatus">) {
  if (booking.balanceDue != null) return booking.balanceDue;
  if (booking.paymentStatus === "paid") return 0;
  return booking.totalAmount ?? 0;
}

export function isCancelledWithBalanceDue(booking: Pick<Booking, "status" | "balanceDue" | "totalAmount" | "paymentStatus">) {
  if (booking.status !== "cancelled") return false;
  return resolveBookingBalanceDue(booking) > 0;
}

export function CancelledAmountDueBadge({
  amount,
  className,
}: {
  amount: number;
  className?: string;
}) {
  if (amount <= 0) {
    return (
      <span className={cn("text-xs text-muted-foreground", className)}>Paid</span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300 tabular-nums",
        className,
      )}
    >
      <DollarSign className="h-3 w-3 shrink-0" />
      {formatMoney(amount)} due
    </span>
  );
}

export function CancelledAmountDueBanner({
  booking,
  balanceDue,
  className,
  variant = "admin",
}: {
  booking: Pick<Booking, "cancellationPolicy" | "cancelledBy" | "paymentStatus">;
  balanceDue: number;
  className?: string;
  variant?: "admin" | "customer";
}) {
  if (balanceDue <= 0) return null;

  const policyLabel =
    booking.cancellationPolicy === "one_day_fee"
      ? "1-day cancellation fee"
      : booking.cancellationPolicy === "non_refundable"
        ? "Full booking amount (within 72 hours)"
        : "Cancellation charge";

  const helperText =
    variant === "customer"
      ? `${policyLabel}. This amount is due for your cancelled booking.`
      : `${policyLabel}. Record payment in the billing section below once collected from the customer.`;

  return (
    <div
      className={cn(
        "rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",
        className,
      )}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Amount due: {formatMoney(balanceDue)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {helperText}
          </p>
        </div>
      </div>
      <CancelledAmountDueBadge amount={balanceDue} className="self-start sm:self-center shrink-0" />
    </div>
  );
}
