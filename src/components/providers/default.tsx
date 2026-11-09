import { useEffect, type ReactNode } from "react";
import { AuthProvider } from "./auth.tsx";
import { QueryClientProvider } from "./query-client.tsx";
import { ThemeProvider } from "./theme.tsx";
import { Toaster } from "../ui/sonner.tsx";
import { TooltipProvider } from "../ui/tooltip.tsx";

function DisableNumberInputScroll() {
  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement) || target.type !== "number") return;
      if (document.activeElement !== target) return;
      event.preventDefault();
    };
    document.addEventListener("wheel", onWheel, { passive: false });
    return () => document.removeEventListener("wheel", onWheel);
  }, []);
  return null;
}

export function DefaultProviders({ children, defaultTheme }: { children: ReactNode; defaultTheme?: string }) {
  return (
    <AuthProvider>
      <QueryClientProvider>
        <TooltipProvider delayDuration={200}>
          <ThemeProvider defaultTheme={defaultTheme ?? "system"}>
            <DisableNumberInputScroll />
            <Toaster />
            {children}
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}
