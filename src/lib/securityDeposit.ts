import { DEFAULT_PRE_AUTHORIZED_AMOUNT } from "@/config/appConfig.ts";
import type { BillEntry, BillPaidVia, SecurityDepositStatus, SecurityDepositSummary } from "@/types/index.ts";
import { getBillEntryTotals } from "@/lib/billing.ts";
import { formatAppDate } from "@/lib/timeFormat.ts";

export const SECURITY_DEPOSIT_AMOUNT = DEFAULT_PRE_AUTHORIZED_AMOUNT;
export const SECURITY_DEPOSIT_HOLD_DAYS = 15;

export const SECURITY_DEPOSIT_STATUS_LABELS: Record<SecurityDepositStatus, string> = {
  held: "Held",
  partially_used: "Partially Used",
  refunded: "Refunded",
};

export const SECURITY_DEPOSIT_STATUS_STYLES: Record<SecurityDepositStatus, string> = {
  held: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  partially_used: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  refunded: "bg-green-500/20 text-green-400 border-green-500/30",
};

export function formatDepositDate(value?: string | null) {
  if (!value) return null;
  const formatted = formatAppDate(value);
  return formatted === "—" ? null : formatted;
}

export const BILL_PAID_VIA_LABELS: Record<BillPaidVia, string> = {
  e_transfer: "E-Transfer",
  deposit: "From Deposit",
};

export function chargeAmountDue(entry: Pick<BillEntry, "amount" | "totalAmount" | "entryType">) {
  if (entry.entryType === "charge") {
    return entry.totalAmount ?? getBillEntryTotals(entry.amount).totalAmount;
  }
  return entry.amount;
}

export function remainingDepositForEntry(
  deposit: SecurityDepositSummary | undefined,
  entry?: Pick<BillEntry, "amount" | "totalAmount" | "entryType" | "status" | "paidVia">,
) {
  const remaining = deposit?.remainingAmount ?? 0;
  if (entry?.paidVia === "deposit" && entry.status === "paid") {
    return Math.round((remaining + chargeAmountDue(entry)) * 100) / 100;
  }
  return remaining;
}

export function isDepositPaymentEnabled(deposit: SecurityDepositSummary | undefined) {
  return Boolean(deposit?.collected && deposit.status !== "refunded");
}

export function canPayFromDeposit(
  deposit: SecurityDepositSummary | undefined,
  amount: number,
  entry?: Pick<BillEntry, "amount" | "totalAmount" | "entryType" | "status" | "paidVia">,
) {
  if (!isDepositPaymentEnabled(deposit)) return false;
  return remainingDepositForEntry(deposit, entry) + 0.001 >= amount;
}
