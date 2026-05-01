import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { cn } from "@/lib/utils.ts";
import {
  LayoutDashboard, Car, CalendarCheck, Users, MapPin, Shield, Wrench,
  ChevronRight, CarFront,
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
];

function AdminContent() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const currentUser = useQuery(api.users.getCurrentUser, {});

  if (currentUser === undefined) {
    return <div className="p-8"><Skeleton className="h-32 w-full" /></div>;
  }

  if (!currentUser || currentUser.role !== "admin") {
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

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 flex-col border-r border-border/50 bg-sidebar shrink-0">
        <div className="p-4 border-b border-border/50">
          <p className="text-xs font-mono text-muted-foreground">ADMIN PANEL</p>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
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
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
                {isActive && <ChevronRight className="h-3 w-3 ml-auto" />}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-sidebar border-t border-border/50 flex justify-around px-2 py-2">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg cursor-pointer transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[9px]">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        <Outlet />
      </main>
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
