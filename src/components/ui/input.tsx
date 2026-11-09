import * as React from "react";
import { cn } from "@/lib/utils.ts";

function assignRef<T>(ref: React.Ref<T> | undefined, value: T) {
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  if (ref) {
    (ref as React.MutableRefObject<T>).current = value;
  }
}

function Input({ className, type, ref, ...props }: React.ComponentProps<"input">) {
  const localRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const el = localRef.current;
    if (!el) return;

    const handleWheel = (event: WheelEvent) => {
      if (el.type !== "number") return;
      if (document.activeElement !== el) return;
      event.preventDefault();
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [type]);

  return (
    <input
      type={type}
      ref={(node) => {
        localRef.current = node;
        assignRef(ref, node);
      }}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
