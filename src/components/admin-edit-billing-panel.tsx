import { memo, useState } from "react";
import { ChevronDown, Minus, Plus, Receipt } from "lucide-react";
import type { AdminEditBookingQuote } from "@/lib/adminEditBookingQuote.ts";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible.tsx";
import { formatMoney } from "@/lib/rentalPricing.ts";
import { cn } from "@/lib/utils.ts";

type AdminEditBillingPanelProps = {
  quote: AdminEditBookingQuote;
  layout?: "sidebar" | "drawer";
};

function BillingBreakdown({
  quote,
  servicesOpen,
  onServicesOpenChange,
  compact = false,
}: {
  quote: AdminEditBookingQuote;
  servicesOpen: boolean;
  onServicesOpenChange: (open: boolean) => void;
  compact?: boolean;
}) {
  const hasQuote = quote.isValid && quote.days > 0;
  const hasServices = quote.serviceLines.length > 0;
  const deltaPositive = quote.delta > 0;
  const deltaNegative = quote.delta < 0;
  const deltaNeutral = quote.delta === 0;

  return (
    <div className={cn("space-y-3", compact && "space-y-2")}>
      <div className="rounded-lg bg-muted/40 px-3 py-2 space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Trip duration</span>
          <span className="font-medium text-foreground">{quote.durationLabel}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Current total</span>
          <span className="font-medium tabular-nums">{formatMoney(quote.previousTotal)}</span>
        </div>
      </div>

      <div
        className={cn(
          "rounded-lg border px-3 py-2 flex items-center justify-between gap-2 text-sm",
          deltaPositive && "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
          deltaNegative && "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400",
          deltaNeutral && "border-border/50 bg-muted/30 text-muted-foreground",
        )}
      >
        <span className="font-medium">Change</span>
        <span className="inline-flex items-center gap-1 font-semibold tabular-nums">
          {deltaPositive ? <Plus className="h-3.5 w-3.5" /> : null}
          {deltaNegative ? <Minus className="h-3.5 w-3.5" /> : null}
          {deltaNeutral ? "No change" : formatMoney(Math.abs(quote.delta))}
        </span>
      </div>

      <div className="divide-y divide-border/40">
        <div className="py-1.5">
          <p className="text-sm font-semibold">Car Rent</p>
          <div className="mt-0.5 flex items-start justify-between gap-3 text-sm">
            <span className="text-muted-foreground text-xs">{quote.carRateLabel}</span>
            <span className="shrink-0 font-medium tabular-nums text-right">
              {hasQuote ? formatMoney(quote.carTotal) : "—"}
            </span>
          </div>
        </div>

        {hasServices && (
          <div className="py-1.5">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 text-left cursor-pointer"
              onClick={() => onServicesOpenChange(!servicesOpen)}
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
              <div className="mt-1 space-y-1.5">
                {quote.serviceLines.map((line) => (
                  <div key={line.id} className="flex items-start justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="text-muted-foreground text-xs">{line.name}</p>
                      <p className="text-[11px] text-muted-foreground/80">{line.breakdown}</p>
                    </div>
                    <span className="shrink-0 font-medium text-primary tabular-nums text-right">
                      {hasQuote ? formatMoney(line.amount) : "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {quote.extraMileageCharge > 0 && (
          <div className="py-1.5 flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Extra mileage</span>
            <span className="font-medium tabular-nums">{formatMoney(quote.extraMileageCharge)}</span>
          </div>
        )}

        <div className="space-y-1 py-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium tabular-nums">{hasQuote ? formatMoney(quote.subtotal) : "—"}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tax (5%)</span>
            <span className="font-medium tabular-nums text-primary">
              {hasQuote ? formatMoney(quote.taxAmount) : "—"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1.5">
          <span className="text-sm font-semibold">New total</span>
          <span className={cn("font-bold text-primary tabular-nums", compact ? "text-base" : "text-lg")}>
            {hasQuote ? formatMoney(quote.total) : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

export const AdminEditBillingPanel = memo(function AdminEditBillingPanel({
  quote,
  layout = "sidebar",
}: AdminEditBillingPanelProps) {
  const [servicesOpen, setServicesOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const hasQuote = quote.isValid && quote.days > 0;
  const deltaPositive = quote.delta > 0;
  const deltaNegative = quote.delta < 0;
  const deltaNeutral = quote.delta === 0;

  if (layout === "drawer") {
    return (
      <Collapsible open={drawerOpen} onOpenChange={setDrawerOpen}>
        <CollapsibleTrigger className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors">
          <Receipt className="h-4 w-4 text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground">Billing summary</p>
            <p className="text-base font-bold text-primary tabular-nums truncate">
              {hasQuote ? formatMoney(quote.total) : "—"}
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
              deltaPositive && "bg-amber-500/15 text-amber-700 dark:text-amber-400",
              deltaNegative && "bg-green-500/15 text-green-700 dark:text-green-400",
              deltaNeutral && "bg-muted text-muted-foreground",
            )}
          >
            {deltaNeutral
              ? "No change"
              : `${deltaPositive ? "+" : "−"}${formatMoney(Math.abs(quote.delta))}`}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
              drawerOpen && "rotate-180",
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="border-t border-border/50 bg-muted/10">
          <div className="max-h-52 overflow-y-auto px-4 py-3">
            <BillingBreakdown
              quote={quote}
              servicesOpen={servicesOpen}
              onServicesOpenChange={setServicesOpen}
              compact
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Receipt className="h-4 w-4 text-primary shrink-0" />
        <h3 className="font-semibold text-sm">Billing Detail</h3>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-4">
        <BillingBreakdown
          quote={quote}
          servicesOpen={servicesOpen}
          onServicesOpenChange={setServicesOpen}
        />
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Current total is rental and services only. Extra fees such as cancellation stay on the account.
        Locked booking rates apply until you change the vehicle or services. Date changes recalculate using saved rates.
      </p>
    </div>
  );
});
