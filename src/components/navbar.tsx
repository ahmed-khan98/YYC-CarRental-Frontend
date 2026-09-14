import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Authenticated, Unauthenticated } from "@/components/auth-gate.tsx";
import { useAuth } from "@/hooks/use-auth.ts";
import { isStaffRole } from "@/lib/roles.ts";
import { Menu, X, User, LayoutDashboard, ShieldCheck } from "lucide-react";
import { memo, useState } from "react";
import { cn } from "@/lib/utils.ts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { BrandLogo } from "@/components/brand-logo.tsx";

function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  const links = [
    { href: "/cars", label: "Browse Cars" },
    { href: "/about", label: "About" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-xl shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex cursor-pointer items-start pt-1 shrink-0">
            <BrandLogo variant="header" />
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary cursor-pointer",
                  pathname === link.href ? "text-primary" : "text-muted-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Unauthenticated>
              <SignInButton />
            </Unauthenticated>
            <Authenticated>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2 cursor-pointer">
                    <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                      {user?.name?.[0]?.toUpperCase() ?? "U"}
                    </div>
                    <span className="text-sm">{user?.name ?? "Account"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      My Bookings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  {isStaffRole(user?.role) && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logout()}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Authenticated>
          </div>

          <button
            className="md:hidden cursor-pointer p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-3">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setOpen(false)}
              className="block text-sm font-medium text-muted-foreground hover:text-primary cursor-pointer py-1"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2">
            <Unauthenticated>
              <SignInButton />
            </Unauthenticated>
            <Authenticated>
              <div className="space-y-2">
                <Link to="/dashboard" onClick={() => setOpen(false)} className="block text-sm text-muted-foreground hover:text-primary cursor-pointer py-1">My Bookings</Link>
                {isStaffRole(user?.role) && (
                  <Link to="/admin" onClick={() => setOpen(false)} className="block text-sm text-muted-foreground hover:text-primary cursor-pointer py-1">Admin Panel</Link>
                )}
                <button onClick={() => logout()} className="block text-sm text-destructive cursor-pointer py-1">Sign Out</button>
              </div>
            </Authenticated>
          </div>
        </div>
      )}
    </nav>
  );
}

export default memo(Navbar);
