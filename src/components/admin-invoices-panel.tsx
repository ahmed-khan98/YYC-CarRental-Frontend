import { useState } from "react";
import { bookingsApi } from "@/api/bookings.api.ts";
import type { BillEntry } from "@/types/index.ts";
import { listBookingInvoices, type BookingInvoice } from "@/lib/billing.ts";
import { Button } from "@/components/ui/button.tsx";
import {
  BookingDetailCard,
  BookingDetailCardContent,
  BookingDetailCardHeader,
  SectionTitle,
} from "@/components/booking-detail-ui.tsx";
import { toast } from "sonner";
import { Download, Loader2, Receipt } from "lucide-react";
import { Hint } from "@/components/ui/tooltip.tsx";

type AdminInvoicesPanelProps = {
  bookingId: string;
  billEntries: BillEntry[];
};

function invoiceKindLabel(invoice: BookingInvoice) {
  if (invoice.kind === "payment") return "Payment";
  if (invoice.kind === "charge") return "Charge";
  return "Account";
}

export function AdminInvoicesPanel({ bookingId, billEntries }: AdminInvoicesPanelProps) {
  const [downloadingKeys, setDownloadingKeys] = useState<string[]>([]);
  const invoices = listBookingInvoices(bookingId, billEntries);

  const handleDownload = async (invoice: BookingInvoice) => {
    if (downloadingKeys.includes(invoice.key)) return;
    setDownloadingKeys((current) => [...current, invoice.key]);
    try {
      if (invoice.kind === "full") {
        await bookingsApi.downloadFullInvoicePdf(bookingId, `invoice-${invoice.invoiceNumber}.pdf`);
      } else if (invoice.entryId) {
        await bookingsApi.downloadBillEntryInvoicePdf(
          bookingId,
          invoice.entryId,
          `invoice-${invoice.invoiceNumber}.pdf`,
        );
      }
    } catch {
      toast.error("Failed to download invoice PDF");
    } finally {
      setDownloadingKeys((current) => current.filter((key) => key !== invoice.key));
    }
  };

  return (
    <BookingDetailCard>
      <BookingDetailCardHeader>
        <SectionTitle icon={<Receipt className="h-4 w-4" />} title="Invoices" />
      </BookingDetailCardHeader>
      <BookingDetailCardContent className="space-y-2.5">
        <p className="text-xs text-muted-foreground leading-snug">
          Rental and additional services are on the check-in / check-out agreement. Invoices are only for billing entries you add or update.
        </p>
        <div className="space-y-1.5">
          {invoices.length === 0 && (
            <p className="text-sm text-muted-foreground py-2">No invoices on this booking yet.</p>
          )}
          {invoices.map((invoice) => {
            const loading = downloadingKeys.includes(invoice.key);
            return (
              <div
                key={invoice.key}
                className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/20 px-2.5 py-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm font-semibold truncate">{invoice.title}</span>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground shrink-0">
                      {invoiceKindLabel(invoice)}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {invoice.invoiceNumber}
                  </p>
                  {invoice.lineLabels.length > 0 && (
                    <p className="text-[11px] text-muted-foreground leading-snug break-words">
                      {invoice.lineLabels.join(", ")}
                    </p>
                  )}
                </div>
                <Hint label={`Download ${invoice.title}`}>
                  <span className="inline-flex">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-primary cursor-pointer"
                      aria-label={`Download ${invoice.title}`}
                      disabled={loading || (!invoice.entryId && invoice.kind !== "full")}
                      aria-busy={loading}
                      onClick={() => handleDownload(invoice)}
                    >
                      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    </Button>
                  </span>
                </Hint>
              </div>
            );
          })}
        </div>
      </BookingDetailCardContent>
    </BookingDetailCard>
  );
}
