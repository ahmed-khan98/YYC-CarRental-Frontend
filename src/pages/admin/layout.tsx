import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { isFullAdminRole, isStaffRole, roleLabel } from "@/lib/roles.ts";
import { formatDisplayName } from "@/lib/displayName.ts";
import { Authenticated, Unauthenticated, AuthLoading } from "@/components/auth-gate.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { BrandLogo } from "@/components/brand-logo.tsx";
import { useAuth } from "@/hooks/use-auth.ts";
import { cn } from "@/lib/utils.ts";
import {
  LayoutDashboard, Car, CalendarCheck, Users, MapPin, Shield, Wrench,
  ChevronRight, CarFront, UserCog, LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/cars", label: "Cars", icon: Car },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/admin/checkinout", label: "Check In/Out", icon: CarFront },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/locations", label: "Locations", icon: MapPin },
  { href: "/admin/services", label: "Services", icon: Shield },
  { href: "/admin/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/admin/team", label: "Sub-Admins", icon: UserCog, fullAdminOnly: true },
];

function AdminContent() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout, user, isAuthenticated, isLoading: authLoading } = useAuth();
  const staffUser = user;

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  if (!staffUser) {
    if (authLoading || isAuthenticated) {
      return <div className="p-8"><Skeleton className="h-32 w-full" /></div>;
    }
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="border-border/50 text-center py-12 px-8 max-w-sm mx-auto">
          <CardContent>
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">Admin Access Required</h3>
            <p className="text-muted-foreground text-sm">
              You need admin privileges to access this panel.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isStaffRole(staffUser.role)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="border-border/50 text-center py-12 px-8 max-w-sm mx-auto">
          <CardContent>
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">Admin Access Required</h3>
            <p className="text-muted-foreground text-sm">
              You need admin privileges to access this panel.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.fullAdminOnly || isFullAdminRole(staffUser.role),
  );

  if (pathname === "/admin/team" && !isFullAdminRole(staffUser.role)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="border-border/50 text-center py-12 px-8 max-w-sm mx-auto">
          <CardContent>
            <UserCog className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">Full Admin Required</h3>
            <p className="text-muted-foreground text-sm">
              Only full admins can manage sub-admin accounts.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <aside className="hidden md:sticky md:top-0 md:h-screen md:flex w-56 flex-col border-r border-border/50 bg-sidebar shrink-0">
        <div className="space-y-3 border-b border-border/50 p-4">
          <Link to="/" className="inline-flex cursor-pointer">
            <BrandLogo variant="sidebar" />
          </Link>
          <Badge
            variant="secondary"
            className="border-primary/20 bg-primary/10 font-mono text-[10px] uppercase tracking-wide text-primary"
          >
            {roleLabel(staffUser.role)}
          </Badge>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href) && item.href !== "/admin";
            const exactActive = item.exact && pathname === item.href;
            const isActive = item.exact ? exactActive : active;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
                {isActive && <ChevronRight className="h-3 w-3 ml-auto" />}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border/50 p-3">
          <div className="mb-2 truncate px-1 text-xs text-muted-foreground">
            {formatDisplayName(staffUser.name, "")}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full cursor-pointer justify-start gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Logout
          </Button>
        </div>
      </aside>

      <nav
        aria-label="Admin navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/50 bg-sidebar overflow-x-auto overscroll-x-contain touch-pan-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex w-max min-w-full px-1 py-2">
          {visibleNavItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href) && item.href !== "/admin";
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex min-w-[4.25rem] shrink-0 flex-col items-center gap-0.5 px-2 py-1 rounded-lg cursor-pointer transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="max-w-[4rem] truncate text-center text-[9px] leading-tight">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-3 md:hidden">
          <div className="flex items-center gap-3">
            <Link to="/" className="inline-flex cursor-pointer">
              <BrandLogo variant="sidebar" className="h-10" />
            </Link>
            <Badge
              variant="secondary"
              className="border-primary/20 bg-primary/10 font-mono text-[10px] uppercase tracking-wide text-primary"
            >
              {roleLabel(staffUser.role)}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="cursor-pointer gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        <main className="flex-1 pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  return (
    <>
      <AuthLoading>
        <div className="flex items-center justify-center min-h-screen">
          <Skeleton className="h-32 w-64" />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="border-border/50 text-center py-12 px-8">
            <CardContent>
              <h3 className="text-lg font-semibold mb-2">Sign in to access admin</h3>
              <SignInButton />
            </CardContent>
          </Card>
        </div>
      </Unauthenticated>
      <Authenticated>
        <AdminContent />
      </Authenticated>
    </>
  );
}
