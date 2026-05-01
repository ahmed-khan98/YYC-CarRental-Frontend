import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { motion } from "motion/react";
import { Car, CalendarCheck, Users, MapPin, TrendingUp, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-primary/20 text-primary border-primary/30",
  checked_in: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  checked_out: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function AdminOverview() {
  const cars = useQuery(api.cars.list, {});
  const bookings = useQuery(api.bookings.adminList, {});
  const users = useQuery(api.users.listUsers, {});
  const locations = useQuery(api.locations.list, {});

  const stats = {
    totalCars: cars?.length ?? 0,
    availableCars: cars?.filter((c) => c.isAvailable).length ?? 0,
    totalBookings: bookings?.length ?? 0,
    pendingBookings: bookings?.filter((b) => b.status === "pending").length ?? 0,
    revenue: bookings?.filter((b) => b.status !== "cancelled").reduce((s, b) => s + b.totalAmount, 0) ?? 0,
    customers: users?.length ?? 0,
  };

  const recentBookings = (bookings ?? []).slice().sort((a, b) => b._creationTime - a._creationTime).slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Overview</h2>
        <p className="text-muted-foreground text-sm mt-1">Dashboard summary</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: Car, label: "Total Cars", value: stats.totalCars, sub: `${stats.availableCars} available`, color: "text-primary" },
          { icon: CalendarCheck, label: "Total Bookings", value: stats.totalBookings, sub: `${stats.pendingBookings} pending`, color: "text-blue-400" },
          { icon: TrendingUp, label: "Revenue", value: `$${stats.revenue.toLocaleString()}`, sub: "all time", color: "text-green-400" },
          { icon: Users, label: "Customers", value: stats.customers, sub: "registered", color: "text-purple-400" },
          { icon: MapPin, label: "Locations", value: locations?.length ?? 0, sub: "active", color: "text-yellow-400" },
          { icon: Clock, label: "Active Rentals", value: bookings?.filter((b) => b.status === "checked_in").length ?? 0, sub: "checked in", color: "text-orange-400" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <Card className="border-border/50 bg-card/60">
              <CardContent className="p-4">
                <stat.icon className={`h-5 w-5 ${stat.color} mb-2`} />
                {cars === undefined ? (
                  <Skeleton className="h-7 w-16 mb-1" />
                ) : (
                  <div className="text-2xl font-bold">{stat.value}</div>
                )}
                <div className="text-xs text-muted-foreground">{stat.label}</div>
                <div className="text-[10px] text-muted-foreground/70 mt-0.5">{stat.sub}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Bookings */}
      <Card className="border-border/50 bg-card/30">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Recent Bookings</CardTitle>
          <Link to="/admin/bookings">
            <Button variant="ghost" size="sm" className="text-xs cursor-pointer">View All</Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {bookings === undefined
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
            : recentBookings.length === 0
            ? <p className="text-muted-foreground text-sm text-center py-4">No bookings yet</p>
            : recentBookings.map((b) => (
                <div key={b._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium font-mono">{b._id.slice(-8)}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(b.pickupDate), "MMM d")} — ${b.totalAmount}</p>
                  </div>
                  <Badge className={`text-xs border capitalize ${STATUS_COLORS[b.status] ?? ""}`}>
                    {b.status.replace("_", " ")}
                  </Badge>
                </div>
              ))}
        </CardContent>
      </Card>
    </div>
  );
}
