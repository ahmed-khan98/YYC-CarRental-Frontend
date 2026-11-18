import type { ReactNode } from "react";
import { cn } from "@/lib/utils.ts";

export function CarPhoto({
  src,
  alt,
  className,
  children,
}: {
  src: string;
  alt: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      <img
        src={src}
        alt={alt}
        className="size-full object-cover object-center"
      />
      {children ? <div className="absolute inset-0 z-10">{children}</div> : null}
    </div>
  );
}
