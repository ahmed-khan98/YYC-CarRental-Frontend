import { forwardRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { type VariantProps } from "class-variance-authority";
import { LogIn } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button.tsx";
import { buildLoginPath } from "@/lib/authRedirect.ts";

export interface SignInButtonProps
  extends Omit<React.ComponentProps<"button">, "onClick">,
    VariantProps<typeof buttonVariants> {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  showIcon?: boolean;
  signInText?: string;
  asChild?: boolean;
  /** Override return URL after login (defaults to current page) */
  redirectTo?: string;
}

export const SignInButton = forwardRef<HTMLButtonElement, SignInButtonProps>(
  (
    {
      onClick,
      showIcon = true,
      signInText = "Sign In",
      redirectTo,
      className,
      variant,
      size,
      asChild = false,
      ...props
    },
    ref,
  ) => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        const returnTo = redirectTo ?? `${location.pathname}${location.search}`;
        navigate(buildLoginPath(returnTo));
      },
      [location.pathname, location.search, navigate, onClick, redirectTo],
    );

    return (
      <Button
        ref={ref}
        onClick={handleClick}
        variant={variant}
        size={size}
        className={className}
        asChild={asChild}
        aria-label="Sign in to your account"
        {...props}
      >
        {showIcon && <LogIn className="size-4" />}
        {signInText}
      </Button>
    );
  },
);

SignInButton.displayName = "SignInButton";
