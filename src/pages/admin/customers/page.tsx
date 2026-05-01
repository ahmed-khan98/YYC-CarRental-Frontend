import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Users } from "lucide-react";

export default function AdminCustomersPage() {
  const users = useQuery(api.users.listUsers, {});

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-2xl font-bold">Customers</h2>
        <p className="text-muted-foreground text-sm">{users?.length ?? 0} registered users</p>
      </div>

      {users === undefined ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : users.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No customers yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <Card key={user._id} className="border-border/50 bg-card/60">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                  {user.name?.[0]?.toUpperCase() ?? "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{user.name ?? "Anonymous"}</p>
                  <p className="text-xs text-muted-foreground">{user.email ?? "No email"}</p>
                </div>
                <Badge className={user.role === "admin"
                  ? "bg-primary/20 text-primary border-primary/30 text-xs"
                  : "bg-secondary text-secondary-foreground text-xs"
                }>
                  {user.role ?? "customer"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
