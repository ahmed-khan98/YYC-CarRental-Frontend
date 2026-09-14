import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth.ts";
import { BrandLogo } from "@/components/brand-logo.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/api/client.ts";
import { getPostLoginPath } from "@/lib/roles.ts";
import { getRedirectFromSearch } from "@/lib/authRedirect.ts";
import { cn } from "@/lib/utils.ts";
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = getRedirectFromSearch(searchParams);
  const { login, register, isAuthenticated, user } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("overflow-hidden");
    document.body.classList.add("overflow-hidden");
    return () => {
      document.documentElement.classList.remove("overflow-hidden");
      document.body.classList.remove("overflow-hidden");
    };
  }, []);

  useEffect(() => {
    setShowPassword(false);
  }, [mode]);

  useEffect(() => {
    if (!isAuthenticated) return;
    navigate(getPostLoginPath(user?.role, redirect), { replace: true });
  }, [isAuthenticated, navigate, redirect, user?.role]);

  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const authedUser =
        mode === "login"
          ? await login(email, password)
          : await register(name, email, password);
      toast.success(mode === "login" ? "Welcome back!" : "Account created successfully!");
      navigate(getPostLoginPath(authedUser.role, redirect), { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-svh flex-col overflow-hidden bg-background px-4 py-4 sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.55_0.22_27_/_0.08),_transparent_55%)]"
      />

      <div className="relative mx-auto w-full max-w-[420px] shrink-0">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-md px-1 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>

      <div className="relative mx-auto flex w-full max-w-[420px] min-h-0 flex-1 flex-col justify-center py-2">
        <div className="mb-5 text-center">
          <Link to="/" className="mb-4 inline-flex cursor-pointer rounded-xl transition-opacity hover:opacity-90">
            <BrandLogo variant="auth" className="h-14 sm:h-16" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight sm:text-[1.65rem]">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {mode === "login"
              ? "Sign in to manage bookings and rentals."
              : "Join YYC Car Rental and book your next ride."}
          </p>
        </div>

        <div className="mb-5 grid grid-cols-2 rounded-xl border border-border/50 bg-muted/40 p-1">
          {(["login", "register"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setMode(tab)}
              className={cn(
                "cursor-pointer rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                mode === tab
                  ? "bg-background text-foreground shadow-sm ring-1 ring-border/60"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/95 p-5 shadow-lg shadow-black/[0.04] backdrop-blur-sm sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Smith"
                    className="h-11 pl-10"
                    autoComplete="name"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-11 pl-10"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="h-11 pr-11 pl-10"
                  minLength={6}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {showPassword ? "Password is visible" : "Use at least 6 characters"}
              </p>
            </div>

            <Button
              type="submit"
              className="mt-1 h-11 w-full cursor-pointer text-sm font-semibold shadow-sm"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Please wait...
                </>
              ) : mode === "login" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
          By continuing, you agree to our{" "}
          <Link to="/terms" className="font-medium text-primary hover:underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="font-medium text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
