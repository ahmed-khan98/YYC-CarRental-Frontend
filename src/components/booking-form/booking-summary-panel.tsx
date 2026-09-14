import { memo, useState } from "react";
import { Calendar, ChevronDown, FileText } from "lucide-react";
import type { BookingQuote } from "@/lib/bookingQuote.ts";
import { formatMoney } from "@/lib/rentalPricing.ts";
import { formatTime12h } from "@/lib/timeFormat.ts";
import { Button } from "@/components/ui/button.tsx";
import {
  BookingDetailCard,
  BookingDetailCardContent,
  BookingDetailCardHeader,
  SectionTitle,
} from "@/components/booking-detail-ui.tsx";
import { cn } from "@/lib/utils.ts";

type BookingSummaryPanelProps = {
  quote: BookingQuote;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  loading: boolean;
  onSubmit: () => void;
};

export const BookingSummaryPanel = memo(function BookingSummaryPanel({
  quote,
  pickupDate,
  pickupTime,
  returnDate,
  returnTime,
  loading,
  onSubmit,
}: BookingSummaryPanelProps) {
  const hasQuote = quote.days > 0;
  const hasServices = quote.serviceLines.length > 0;
  const [servicesOpen, setServicesOpen] = useState(true);

  return (
    <div className="sticky top-24 space-y-4">
      <BookingDetailCard>
        <BookingDetailCardHeader>
          <SectionTitle icon={<FileText className="h-4 w-4" />} title="Booking Summary" />
        </BookingDetailCardHeader>
        <BookingDetailCardContent className="space-y-3">
          <div className="rounded-lg bg-secondary/30 p-3 space-y-1.5 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3 w-3 shrink-0" />
              <span>
                Pickup:{" "}
                <span className="font-medium text-foreground">
                  {pickupDate} at {formatTime12h(pickupTime)}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3 w-3 shrink-0" />
              <span>
                Drop-off:{" "}
                <span className="font-medium text-foreground">
                  {returnDate} at {formatTime12h(returnTime)}
                </span>
              </span>
            </div>
          </div>

          <div className="divide-y divide-border/40">
            <div className="py-1">
              <p className="text-sm font-semibold">Car Rent</p>
              <div className="mt-0.5 flex items-start justify-between gap-3 text-sm">
                <span className="text-muted-foreground">{quote.carRateLabel}</span>
                <span className="shrink-0 font-medium tabular-nums min-w-[3.5rem] text-right">
                  {hasQuote ? formatMoney(quote.carTotal) : "—"}
                </span>
              </div>
            </div>

            {hasServices && (
              <div className="py-1">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 text-left cursor-pointer group"
                  onClick={() => setServicesOpen((open) => !open)}
                  aria-expanded={servicesOpen}
                >
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold">Additional Services</p>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform duration-200",
                        servicesOpen && "rotate-180",
                      )}
                    />
                  </div>
                  {!servicesOpen && hasQuote ? (
                    <span className="text-sm font-medium text-primary tabular-nums shrink-0">
                      {formatMoney(quote.servicesTotal)}
                    </span>
                  ) : null}
                </button>
                {servicesOpen && (
                  <div className="mt-1 space-y-1">
                    {quote.serviceLines.map((line) => (
                      <div key={line.id} className="flex items-start justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <p className="text-muted-foreground">{line.name}</p>
                          <p className="text-xs text-muted-foreground/80">{line.breakdown}</p>
                        </div>
                        <span className="shrink-0 font-medium text-primary tabular-nums min-w-[3.5rem] text-right">
                          {hasQuote ? formatMoney(line.amount) : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1 py-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium tabular-nums min-w-[3.5rem] text-right">
                  {hasQuote ? formatMoney(quote.subtotal) : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tax (5%)</span>
                <span className="font-medium tabular-nums text-primary min-w-[3.5rem] text-right">
                  {hasQuote ? formatMoney(quote.taxAmount) : "—"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-base font-semibold">Total</span>
              <span className="text-xl font-bold text-primary tabular-nums min-w-[4rem] text-right">
                {hasQuote ? formatMoney(quote.total) : "—"}
              </span>
            </div>
          </div>

          <Button
            className="w-full cursor-pointer"
            size="lg"
            onClick={onSubmit}
            disabled={loading || !hasQuote}
          >
            {loading ? "Confirming..." : "Confirm Booking"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Free cancellation: 72+ hours before pick-up (1 day fee due). Within 72 hours: full amount due. Payment collected at check-in.
          </p>
        </BookingDetailCardContent>
      </BookingDetailCard>
    </div>
  );
});
