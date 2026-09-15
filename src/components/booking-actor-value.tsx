import { format } from "date-fns";
import type { BookingActor } from "@/lib/bookingActor.ts";
import { roleLabel } from "@/lib/roles.ts";
import { Badge } from "@/components/ui/badge.tsx";
import { cn } from "@/lib/utils.ts";
import { formatActorDisplayName } from "@/lib/displayName.ts";

export function BookingActorValue({
  actor,
  timestamp,
  compact = false,
  className,
}: {
  actor?: BookingActor | null;
  timestamp?: number;
  compact?: boolean;
  className?: string;
}) {
  if (!actor?.role && !actor?.name) {
    return <span className={cn("text-muted-foreground", className)}>—</span>;
  }

  const badgeLabel = actor.role ? roleLabel(actor.role) : null;

  return (
    <span className={cn("text-right inline-flex flex-col items-end gap-0.5", className)}>
      <span className="inline-flex items-center justify-end gap-1.5 flex-wrap">
        {actor.name && (
          <span className={cn("font-medium", compact && "text-xs")}>
            {formatActorDisplayName(actor.name, actor.role, "")}
          </span>
        )}
        {badgeLabel && (
          <Badge
            variant="outline"
            className={cn(
              "font-medium",
              compact ? "text-[10px] px-1.5 py-0 h-4" : "text-[10px] px-1.5 py-0 h-5",
            )}
          >
            {badgeLabel}
          </Badge>
        )}
      </span>
      {timestamp != null && !compact && (
        <span className="block text-xs text-muted-foreground mt-0.5">
          {format(new Date(timestamp), "MMM d, yyyy 'at' h:mm a")}
        </span>
      )}
    </span>
  );
}
