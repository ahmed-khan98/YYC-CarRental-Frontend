import type { BillEntryStatus } from "@/types/index.ts";
import { BILL_ENTRY_STATUS_LABELS } from "@/lib/billing.ts";
import { cn } from "@/lib/utils.ts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { ChevronDown } from "lucide-react";

const STATUS_OPTIONS: BillEntryStatus[] = ["unpaid", "paid", "refund"];

const STATUS_STYLES: Record<
  BillEntryStatus,
  { badge: string; dot: string; menuActive: string }
> = {
  unpaid: {
    badge: "border-amber-200 bg-amber-50 text-amber-800",
    dot: "bg-amber-500",
    menuActive: "bg-amber-50 text-amber-800",
  },
  paid: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-800",
    dot: "bg-emerald-500",
    menuActive: "bg-emerald-50 text-emerald-800",
  },
  refund: {
    badge: "border-sky-200 bg-sky-50 text-sky-800",
    dot: "bg-sky-500",
    menuActive: "bg-sky-50 text-sky-800",
  },
};

type BillEntryStatusBadgeProps = {
  status: BillEntryStatus;
  className?: string;
};

/** Read-only custom status pill — no native browser styling. */
export function BillEntryStatusBadge({ status, className }: BillEntryStatusBadgeProps) {
  const styles = STATUS_STYLES[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        styles.badge,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", styles.dot)} />
      {BILL_ENTRY_STATUS_LABELS[status]}
    </span>
  );
}

type BillEntryStatusControlProps = {
  status: BillEntryStatus;
  disabled?: boolean;
  onChange: (status: BillEntryStatus) => void;
  className?: string;
};

/** Clickable custom badge + dropdown menu (replaces native select look). */
export function BillEntryStatusControl({
  status,
  disabled,
  onChange,
  className,
}: BillEntryStatusControlProps) {
  const styles = STATUS_STYLES[status];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          type="button"
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold uppercase tracking-wide transition-colors cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            "disabled:cursor-not-allowed disabled:opacity-50",
            styles.badge,
            className,
          )}
        >
          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", styles.dot)} />
          {BILL_ENTRY_STATUS_LABELS[status]}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[8.5rem]">
        {STATUS_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option}
            className={cn(
              "cursor-pointer text-xs font-medium uppercase tracking-wide",
              status === option && STATUS_STYLES[option].menuActive,
            )}
            onClick={() => onChange(option)}
          >
            <span
              className={cn(
                "mr-2 inline-block h-1.5 w-1.5 rounded-full",
                STATUS_STYLES[option].dot,
              )}
            />
            {BILL_ENTRY_STATUS_LABELS[option]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { STATUS_OPTIONS as BILL_ENTRY_STATUS_OPTIONS };
