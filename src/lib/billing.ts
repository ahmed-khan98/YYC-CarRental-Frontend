import { calculateTaxAmount, calculateGrandTotal, formatMoney } from "@/lib/rentalPricing.ts";
import type { BillEntry, BillEntryPhase, BillEntryStatus } from "@/types/index.ts";

export interface BillSummary {
  chargeSubtotal: number;
  taxAmount: number;
  totalBill: number;
  totalPaid: number;
  totalUnpaid: number;
}

function resolveEntryStatus(entry: BillEntry): BillEntryStatus {
  return entry.status ?? "unpaid";
}

/** Per-line totals for manual charges (amount is pre-tax subtotal). */
export function getBillEntryTotals(amount: number) {
  const subtotal = Math.round(Number(amount) * 100) / 100;
  const taxAmount = calculateTaxAmount(subtotal);
  const totalAmount = calculateGrandTotal(subtotal);
  return { subtotal, taxAmount, totalAmount };
}

export function resolveBillEntryTotalAmount(entry: BillEntry): number {
  if (entry.totalAmount != null) return entry.totalAmount;
  if (entry.entryType !== "charge") return entry.amount;
  return getBillEntryTotals(entry.amount).totalAmount;
}
export function computeBillSummary(entries: BillEntry[] = []): BillSummary {
  const charges = entries.filter((e) => e.entryType === "charge");
  const payments = entries.filter((e) => e.entryType === "payment");

  const chargeSubtotal = charges.reduce((sum, e) => sum + e.amount, 0);
  const taxAmount = calculateTaxAmount(chargeSubtotal);
  const totalBill = calculateGrandTotal(chargeSubtotal);

  const paymentTotal = payments
    .filter((e) => resolveEntryStatus(e) === "paid")
    .reduce((sum, e) => sum + e.amount, 0);
  const manualPaidCharges = charges
    .filter((e) => e.source === "manual" && resolveEntryStatus(e) === "paid")
    .reduce((sum, e) => sum + resolveBillEntryTotalAmount(e), 0);  const refundTotal = entries
    .filter((e) => resolveEntryStatus(e) === "refund")
    .reduce((sum, e) => sum + e.amount, 0);

  const netPayments = Math.max(0, Math.round((paymentTotal - refundTotal) * 100) / 100);
  const unpaidAfterPayments = Math.max(0, Math.round((totalBill - netPayments) * 100) / 100);
  const chargeCredit = Math.min(manualPaidCharges, unpaidAfterPayments);
  const totalPaid = Math.round((netPayments + chargeCredit) * 100) / 100;
  const totalUnpaid = Math.max(0, Math.round((totalBill - totalPaid) * 100) / 100);

  return { chargeSubtotal, taxAmount, totalBill, totalPaid, totalUnpaid };
}

export type CheckoutBalancePreview = {
  totalPaid: number;
  balanceBeforeExtra: number;
  extraMileageCharge: number;
  extraMileageTax: number;
  extraMileageTotal: number;
  pendingChargeSubtotal: number;
  pendingChargeTax: number;
  pendingChargeTotal: number;
  addedTax: number;
  totalUnpaid: number;
};

function projectedChargeEntry(
  id: string,
  title: string,
  amount: number,
  source: BillEntry["source"],
  systemKey?: string,
): BillEntry {
  return {
    _id: id,
    title,
    amount,
    entryType: "charge",
    status: "unpaid",
    source,
    systemKey,
    _creationTime: 0,
  };
}

/** Project balance due at check-out, including extra mileage and draft charges not yet on the bill. */
export function projectCheckoutBalance(
  entries: BillEntry[] = [],
  extraMileageCharge = 0,
  pendingManualCharges: { title?: string; amount: number }[] = [],
): CheckoutBalancePreview {
  const current = computeBillSummary(entries);
  const emptyPreview: CheckoutBalancePreview = {
    totalPaid: current.totalPaid,
    balanceBeforeExtra: current.totalUnpaid,
    extraMileageCharge: 0,
    extraMileageTax: 0,
    extraMileageTotal: 0,
    pendingChargeSubtotal: 0,
    pendingChargeTax: 0,
    pendingChargeTotal: 0,
    addedTax: 0,
    totalUnpaid: current.totalUnpaid,
  };

  const mileageEntries =
    extraMileageCharge > 0
      ? [projectedChargeEntry("projected-extra-mileage", "Extra Mileage", extraMileageCharge, "system", "extra_mileage")]
      : [];
  const pendingEntries = pendingManualCharges
    .filter((charge) => Number(charge.amount) > 0)
    .map((charge, index) =>
      projectedChargeEntry(
        `projected-pending-charge-${index}`,
        charge.title?.trim() || "Charge",
        Number(charge.amount),
        "manual",
      ),
    );

  if (mileageEntries.length === 0 && pendingEntries.length === 0) {
    return emptyPreview;
  }

  const withMileage = computeBillSummary([...entries, ...mileageEntries]);
  const projected = computeBillSummary([...entries, ...mileageEntries, ...pendingEntries]);

  return {
    totalPaid: current.totalPaid,
    balanceBeforeExtra: current.totalUnpaid,
    extraMileageCharge: extraMileageCharge > 0 ? extraMileageCharge : 0,
    extraMileageTax: Math.round((withMileage.taxAmount - current.taxAmount) * 100) / 100,
    extraMileageTotal: Math.round((withMileage.totalBill - current.totalBill) * 100) / 100,
    pendingChargeSubtotal: pendingEntries.reduce((sum, entry) => sum + entry.amount, 0),
    pendingChargeTax: Math.round((projected.taxAmount - withMileage.taxAmount) * 100) / 100,
    pendingChargeTotal: Math.round((projected.totalBill - withMileage.totalBill) * 100) / 100,
    addedTax: Math.round((projected.taxAmount - current.taxAmount) * 100) / 100,
    totalUnpaid: projected.totalUnpaid,
  };
}

export function formatBillSummaryLine(summary: BillSummary) {
  return {
    totalBill: formatMoney(summary.totalBill),
    totalPaid: formatMoney(summary.totalPaid),
    totalUnpaid: formatMoney(summary.totalUnpaid),
  };
}

export function resolveEntryPhase(entry: BillEntry): BillEntryPhase {
  if (
    entry.source === "manual" &&
    entry.entryType === "charge" &&
    entry.phase === "check_in" &&
    entry.systemKey !== "extra_mileage"
  ) {
    return "post";
  }
  if (entry.phase === "check_in" || entry.phase === "check_out" || entry.phase === "post") {
    return entry.phase;
  }
  if (entry.systemKey === "extra_mileage" || /extra\s*mileage|excess\s*km/i.test(entry.title ?? "")) {
    return "check_out";
  }
  if (entry.systemKey === "rental" || String(entry.systemKey ?? "").startsWith("service:")) {
    return "check_in";
  }
  if (entry.entryType === "payment") {
    if (/check[\s-]?out/i.test(entry.title ?? "")) return "check_out";
    if (/check[\s-]?in/i.test(entry.title ?? "")) return "check_in";
    return "post";
  }
  return "post";
}

export function canHaveInvoice(entry: BillEntry) {
  if (entry.entryType === "payment") return true;
  if (entry.entryType !== "charge") return false;
  if (entry.systemKey === "cancellation_fee" || entry.systemKey === "cancellation_refund") return true;
  if (entry.systemKey === "extra_mileage") return false;
  if (resolveEntryPhase(entry) === "check_out") return false;
  return entry.source === "manual";
}

export type BookingInvoiceKind = "charge" | "payment" | "full";

export type BookingInvoice = {
  key: string;
  kind: BookingInvoiceKind;
  title: string;
  invoiceNumber: string;
  entryId?: string;
  lineLabels: string[];
};

export function listBookingInvoices(
  bookingId: string,
  entries: BillEntry[] = [],
): BookingInvoice[] {
  const suffix = bookingId.slice(-8).toUpperCase();
  const invoices: BookingInvoice[] = [];

  for (const entry of entries) {
    if (!canHaveInvoice(entry)) continue;
    const isCheckInPayment =
      entry.entryType === "payment" &&
      /check[\s-]?in/i.test(entry.title ?? "") &&
      !/check[\s-]?out/i.test(entry.title ?? "");
    const isCheckOutPayment =
      entry.entryType === "payment" && /check[\s-]?out/i.test(entry.title ?? "");
    invoices.push({
      key: entry._id,
      kind: entry.entryType,
      title: isCheckInPayment ? "Check-In Invoice" : isCheckOutPayment ? "Check-Out Invoice" : entry.title,
      invoiceNumber: entry.invoiceNumber || `${suffix}-${entry.entryType}`,
      entryId: entry._id,
      lineLabels: entry.description ? [entry.description] : [],
    });
  }

  if (entries.some((entry) => entry.entryType === "charge")) {
    invoices.push({
      key: "full",
      kind: "full",
      title: "Full Statement",
      invoiceNumber: `${suffix}-ALL`,
      lineLabels: entries.filter((entry) => entry.entryType === "charge").map((entry) => entry.title),
    });
  }

  const rank = (invoice: BookingInvoice) => {
    if (invoice.kind === "full") return 0;
    if (invoice.title === "Check-In Invoice") return 1;
    if (invoice.title === "Check-Out Invoice") return 2;
    return 3;
  };

  return invoices.sort((a, b) => rank(a) - rank(b));
}

export const BILL_ENTRY_STATUS_LABELS: Record<BillEntryStatus, string> = {
  unpaid: "Unpaid",
  paid: "Paid",
  refund: "Refund",
};

export const BILL_ENTRY_STATUS_COLORS: Record<BillEntryStatus, string> = {
  unpaid: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  paid: "bg-green-500/15 text-green-600 border-green-500/30",
  refund: "bg-blue-500/15 text-blue-600 border-blue-500/30",
};

export { formatMoney };
