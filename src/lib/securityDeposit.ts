import type { BillEntry, BillPaidVia, SecurityDepositStatus, SecurityDepositSummary } from "@/types/index.ts";
import { getBillEntryTotals } from "@/lib/billing.ts";

export const SECURITY_DEPOSIT_AMOUNT = 800;
export const SECURITY_DEPOSIT_HOLD_DAYS = 15;

export const SECURITY_DEPOSIT_STATUS_LABELS: Record<SecurityDepositStatus, string> = {
  held: "Held",
  partially_used: "Partially Used",
  refunded: "Refunded",
};

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
