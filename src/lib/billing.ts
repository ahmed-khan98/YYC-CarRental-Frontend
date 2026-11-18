import { calculateTaxAmount, calculateGrandTotal, formatMoney } from "@/lib/rentalPricing.ts";
import type { BillEntry, BillEntryPhase, BillEntryStatus, BillSummary } from "@/types/index.ts";

export function isDiscountEntry(entry: Pick<BillEntry, "entryType" | "systemKey" | "title">) {
  if (entry.systemKey === "discount") return true;
  return entry.entryType === "charge" && /^discount$/i.test(String(entry.title ?? "").trim());
}

/** Discount color — amber, so it stays distinct from paid green. */
export const DISCOUNT_TEXT_CLASS = "text-amber-700";
export const DISCOUNT_SURFACE_CLASS = "bg-amber-50";
export const DISCOUNT_BORDER_CLASS = "border-amber-200";

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

/** Paid deposit/e-transfer charges settle the bill without a payment line. */
export function isStandalonePaidCharge(entry: BillEntry) {
  if (entry.entryType !== "charge" || entry.source !== "manual") return false;
  if (isDiscountEntry(entry)) return false;
  if (resolveEntryStatus(entry) !== "paid") return false;
  return entry.paidVia === "deposit" || entry.paidVia === "e_transfer";
}
export function computeBillSummary(entries: BillEntry[] = []): BillSummary {
  const charges = entries.filter((e) => e.entryType === "charge" && !isDiscountEntry(e));
  const payments = entries.filter((e) => e.entryType === "payment");
  const discountAmount =
    Math.round(
      entries
        .filter((e) => isDiscountEntry(e) && resolveEntryStatus(e) !== "refund")
        .reduce((sum, e) => sum + e.amount, 0) * 100,
    ) / 100;

  const chargeSubtotal =
    Math.round(charges.reduce((sum, e) => sum + e.amount, 0) * 100) / 100;
  const appliedDiscount = Math.min(discountAmount, Math.max(0, chargeSubtotal));
  const taxable = Math.round((chargeSubtotal - appliedDiscount) * 100) / 100;
  const taxAmount = calculateTaxAmount(taxable);
  const totalBill = calculateGrandTotal(taxable);

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

  return { chargeSubtotal, taxAmount, discountAmount: appliedDiscount, totalBill, totalPaid, totalUnpaid };
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
  discountAmount: number;
  totalUnpaidBeforeDiscount: number;
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
  discountAmount = 0,
): CheckoutBalancePreview {
  const current = computeBillSummary(entries);
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
  const requestedDiscount = Math.max(0, Math.round(Number(discountAmount || 0) * 100) / 100);
  const discountEntries =
    requestedDiscount > 0
      ? [projectedChargeEntry("projected-discount", "Discount", requestedDiscount, "manual", "discount")]
      : [];

  const withMileage = computeBillSummary([...entries, ...mileageEntries]);
  const projectedNoDiscount = computeBillSummary([...entries, ...mileageEntries, ...pendingEntries]);
  const projected = computeBillSummary([
    ...entries,
    ...mileageEntries,
    ...pendingEntries,
    ...discountEntries,
  ]);
  const checkoutChargeSubtotal =
    Math.round(
      ((extraMileageCharge > 0 ? extraMileageCharge : 0) +
        pendingEntries.reduce((sum, entry) => sum + entry.amount, 0)) *
        100,
    ) / 100;
  const maxDiscount = Math.max(
    0,
    Math.round((checkoutChargeSubtotal + current.totalUnpaid) * 100) / 100,
  );

  return {
    totalPaid: current.totalPaid,
    balanceBeforeExtra: current.totalUnpaid,
    extraMileageCharge: extraMileageCharge > 0 ? extraMileageCharge : 0,
    extraMileageTax: Math.round((withMileage.taxAmount - current.taxAmount) * 100) / 100,
    extraMileageTotal: Math.round((withMileage.totalBill - current.totalBill) * 100) / 100,
    pendingChargeSubtotal: pendingEntries.reduce((sum, entry) => sum + entry.amount, 0),
    pendingChargeTax: Math.round((projectedNoDiscount.taxAmount - withMileage.taxAmount) * 100) / 100,
    pendingChargeTotal: Math.round((projectedNoDiscount.totalBill - withMileage.totalBill) * 100) / 100,
    addedTax: Math.round((projected.taxAmount - current.taxAmount) * 100) / 100,
    discountAmount: projected.discountAmount,
    totalUnpaidBeforeDiscount: maxDiscount,
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
    entry.systemKey !== "extra_mileage" &&
    !isDiscountEntry(entry)
  ) {
    return "post";
  }
  if (entry.phase === "check_in" || entry.phase === "check_out" || entry.phase === "post") {
    return entry.phase;
  }
  if (entry.systemKey === "extra_mileage" || /extra\s*mileage|excess\s*km/i.test(entry.title ?? "")) {
    return "check_out";
  }
  if (isDiscountEntry(entry)) return "check_out";
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
  if (entry.systemKey === "extra_mileage" || isDiscountEntry(entry)) return false;
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

export function hasCheckOutPayment(entries: BillEntry[]) {
  return entries.some(
    (entry) =>
      entry.entryType === "payment" &&
      entry.status !== "refund" &&
      /check[\s-]?out/i.test(entry.title ?? ""),
  );
}

export function invoiceKindLabel(invoice: BookingInvoice) {
  if (invoice.kind === "payment") return "Payment";
  if (invoice.kind === "charge") return "Charge";
  return "Account";
}

export { formatMoney };
