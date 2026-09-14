import { cn } from "@/lib/utils.ts";

const LOGO_SRC = "/yyc-logo.png";

export function BrandLogo({
  variant = "header",
  className,
}: {
  variant?: "header" | "footer" | "auth" | "sidebar";
  className?: string;
}) {
  if (variant === "sidebar") {
    return (
      <img
        src={LOGO_SRC}
        alt="YYC Car Rental"
        className={cn("h-12 w-auto", className)}
      />
    );
  }

  if (variant === "auth") {
    return (
      <img
        src={LOGO_SRC}
        alt="YYC Car Rental"
        className={cn("h-16 w-auto sm:h-[4.5rem]", className)}
      />
    );
  }

  if (variant === "header") {
    return (
      <img
        src={LOGO_SRC}
        alt="YYC Car Rental"
        className={cn("h-20 w-auto", className)}
      />
    );
  }

  return (
    <img
      src={LOGO_SRC}
      alt="YYC Car Rental"
      className={cn("h-28 w-auto", className)}
    />
  );
}
