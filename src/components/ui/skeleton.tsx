import { cn } from "@/lib/utils.ts";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "rounded-md bg-[length:200%_100%] animate-[skeleton-shimmer_1.5s_ease-in-out_infinite]",
        "bg-[linear-gradient(90deg,var(--muted)_0%,color-mix(in_oklab,var(--foreground)_9%,var(--muted))_50%,var(--muted)_100%)]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
