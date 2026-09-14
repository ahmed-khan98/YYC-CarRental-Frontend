import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { AlertTriangle, CalendarClock, ShieldCheck } from "lucide-react";
import { bookingsApi } from "@/api/bookings.api.ts";
import { getApiErrorMessage } from "@/api/client.ts";
import {
  BookingDetailCard,
  BookingDetailCardContent,
  BookingDetailCardHeader,
  InfoRow,
  SectionTitle,
} from "@/components/booking-detail-ui.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { formatMoney } from "@/lib/rentalPricing.ts";
import {
  SECURITY_DEPOSIT_AMOUNT,
  SECURITY_DEPOSIT_STATUS_LABELS,
} from "@/lib/securityDeposit.ts";
import type { SecurityDepositSummary, SecurityDepositStatus } from "@/types/index.ts";
import { toast } from "sonner";

const STATUS_STYLES: Record<SecurityDepositStatus, string> = {
  held: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  partially_used: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  refunded: "bg-green-500/20 text-green-400 border-green-500/30",
};

function formatDepositDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return format(date, "MMM d, yyyy");
}

type AdminSecurityDepositPanelProps = {
  bookingId: string;
  deposit?: SecurityDepositSummary;
};

export function AdminSecurityDepositPanel({ bookingId, deposit }: AdminSecurityDepositPanelProps) {
  const queryClient = useQueryClient();
  const amount = deposit?.amount ?? SECURITY_DEPOSIT_AMOUNT;
  const collected = deposit?.collected ?? false;
  const status = deposit?.status ?? null;
  const refundedOn = formatDepositDate(deposit?.refundedAt);
  const refundDueOn = formatDepositDate(deposit?.refundAvailableAt);
  const checkedOut = Boolean(deposit?.checkOutAt);
  const refundDueNow =
    collected &&
    checkedOut &&
    status !== "refunded" &&
    Boolean(deposit?.refundAvailableAt) &&
    new Date() >= new Date(deposit!.refundAvailableAt!);

  const refund = useMutation({
    mutationFn: () => bookingsApi.refundSecurityDeposit(bookingId),
    onSuccess: () => {
      toast.success("Security deposit marked as refunded");
      queryClient.invalidateQueries({ queryKey: ["bookings", bookingId, "detail"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const refundDisabledReason = !collected
    ? "Collected at check-in."
    : status === "refunded"
      ? null
      : !checkedOut
        ? "Available 15 days after check-out is complete."
        : refundDueOn && !deposit?.canRefund
          ? `Available on ${refundDueOn}.`
          : null;

  return (
    <BookingDetailCard>
      <BookingDetailCardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <SectionTitle icon={<ShieldCheck className="h-4 w-4" />} title="Security Deposit" />
          {status ? (
            <Badge className={`text-xs border capitalize h-7 px-2.5 ${STATUS_STYLES[status]}`}>
              {SECURITY_DEPOSIT_STATUS_LABELS[status]}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs h-7 px-2.5 text-muted-foreground">
              Not collected
            </Badge>
          )}
        </div>
      </BookingDetailCardHeader>
      <BookingDetailCardContent className="space-y-3">
        {!collected && (
          <p className="text-xs text-muted-foreground">
            A ${SECURITY_DEPOSIT_AMOUNT} pre-authorization is collected at check-in. It is separate from the rental payment.
          </p>
        )}

        <InfoRow label="Total Deposit Amount" value={formatMoney(amount)} />
        <InfoRow
          label="Amount Deducted"
          value={formatMoney(collected ? deposit?.deductedAmount ?? 0 : 0)}
        />
        <InfoRow
          label="Remaining Deposit Balance"
          value={formatMoney(collected ? deposit?.remainingAmount ?? amount : amount)}
        />
        {status === "refunded" && (
          <InfoRow
            label="Refunded Amount"
            value={formatMoney(deposit?.refundedAmount ?? 0)}
          />
        )}
        {refundedOn && <InfoRow label="Refunded on" value={refundedOn} />}

        {collected && checkedOut && status !== "refunded" && (
          <div
            className={`rounded-lg border px-3 py-2.5 text-xs flex items-start gap-2 ${
              refundDueNow
                ? "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                : "border-border/50 bg-muted/20 text-muted-foreground"
            }`}
          >
            {refundDueNow ? (
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            ) : (
              <CalendarClock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            )}
            <span>
              {refundDueNow
                ? "Deposit refund is due"
                : refundDueOn
                  ? `Refund due on ${refundDueOn}`
                  : "Refund is due 15 days after check-out."}
            </span>
          </div>
        )}

        {collected && status !== "refunded" && (
          <div className="pt-1 space-y-1.5">
            <Button
              type="button"
              size="sm"
              className="cursor-pointer"
              disabled={!deposit?.canRefund || refund.isPending}
              onClick={() => refund.mutate()}
            >
              {refund.isPending ? "Refunding..." : "Refund deposit"}
            </Button>
            {refundDisabledReason && (
              <p className="text-[11px] text-muted-foreground">{refundDisabledReason}</p>
            )}
          </div>
        )}
      </BookingDetailCardContent>
    </BookingDetailCard>
  );
}
