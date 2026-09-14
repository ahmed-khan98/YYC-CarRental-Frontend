import { AuthProvider } from "./auth.tsx";
import { QueryClientProvider } from "./query-client.tsx";
import { ThemeProvider } from "./theme.tsx";
import { Toaster } from "../ui/sonner.tsx";
import { TooltipProvider } from "../ui/tooltip.tsx";

export function DefaultProviders({ children, defaultTheme }: { children: React.ReactNode; defaultTheme?: string }) {
  return (
    <AuthProvider>
      <QueryClientProvider>
        <TooltipProvider delayDuration={200}>
          <ThemeProvider defaultTheme={defaultTheme ?? "system"}>
            <Toaster />
            {children}
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}
