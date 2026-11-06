import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth.ts";
import { formatActorDisplayName } from "@/lib/displayName.ts";
import { roleBadgeClass, roleLabel } from "@/lib/roles.ts";
import { Badge } from "@/components/ui/badge.tsx";
import { User } from "lucide-react";

function ProfileField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] items-start gap-4 px-4 py-3 sm:grid-cols-[9rem_1fr]">
      <p className="text-xs text-muted-foreground pt-0.5">{label}</p>
      <div className="min-w-0 text-sm font-medium break-all">{children}</div>
    </div>
  );
}

export default function AdminProfilePage() {
  const { user } = useAuth();
  const name = formatActorDisplayName(user?.name, user?.role, "—");
  const email = user?.email?.trim() || "—";
  const role = roleLabel(user?.role);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Profile</h2>
        <p className="text-muted-foreground text-sm mt-1">Your account</p>
      </div>

      <div className="max-w-lg overflow-hidden rounded-xl border border-border/50">
        <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Account</span>
        </div>
        <ProfileField label="Name">{name}</ProfileField>
        <ProfileField label="Email">{email}</ProfileField>
        <ProfileField label="Role">
          <Badge className={roleBadgeClass(user?.role)}>{role}</Badge>
        </ProfileField>
      </div>
    </div>
  );
}
