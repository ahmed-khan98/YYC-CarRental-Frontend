import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/api/users.api.ts";
import { getApiErrorMessage } from "@/api/client.ts";
import { roleLabel } from "@/lib/roles.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { toast } from "sonner";
import { Eye, EyeOff, Pencil, Plus, ShieldCheck, Trash2, UserCog } from "lucide-react";
import { Hint } from "@/components/ui/tooltip.tsx";
import { formatDisplayName } from "@/lib/displayName.ts";
import type { User } from "@/types/index.ts";

export default function AdminTeamPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { data: subAdmins, isLoading } = useQuery({
    queryKey: ["users", "sub-admins"],
    queryFn: () => usersApi.listSubAdmins(),
  });

  const createMutation = useMutation({
    mutationFn: usersApi.createSubAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "sub-admins"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Sub-Admin account created");
      closeDialog();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: { name: string; email: string; password?: string };
    }) => usersApi.updateSubAdmin(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "sub-admins"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Sub-Admin updated");
      closeDialog();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: usersApi.deleteSubAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "sub-admins"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Sub-Admin removed");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const resetForm = () => {
    setEditing(null);
    setName("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
  };

  const closeDialog = () => {
    setOpen(false);
    resetForm();
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setName(user.name ?? "");
    setEmail(user.email ?? "");
    setPassword("");
    setShowPassword(false);
    setOpen(true);
  };

  const handleSave = () => {
    if (!name.trim() || !email.trim()) {
      toast.error("Please fill in name and email");
      return;
    }
    if (!editing && !password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password && password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (editing) {
      updateMutation.mutate({
        userId: editing._id,
        data: {
          name: name.trim(),
          email: email.trim(),
          ...(password ? { password } : {}),
        },
      });
      return;
    }
    createMutation.mutate({ name: name.trim(), email: email.trim(), password });
  };

  const handleDelete = (id: string, subAdminName?: string) => {
    if (!confirm(`Remove sub-admin ${subAdminName ?? "account"}?`)) return;
    deleteMutation.mutate(id);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <UserCog className="h-6 w-6 text-primary" />
            Sub-Admins
          </h2>
          <p className="text-muted-foreground text-sm">
            Create team members with admin panel access
          </p>
        </div>
        <Button onClick={openCreate} className="cursor-pointer">
          <Plus className="h-4 w-4 mr-2" />
          Create Sub-Admin
        </Button>
      </div>

      <Card className="border-border/50 bg-card/40">
        <CardContent className="p-4 text-sm text-muted-foreground">
          Sub-Admins can access the admin panel to manage cars, bookings, and customers.
          Only full admins can create, update, or remove sub-admin accounts.
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : !subAdmins?.length ? (
        <div className="text-center py-16">
          <ShieldCheck className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No sub-admin accounts yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {subAdmins.map((user) => (
            <Card key={user._id} className="border-border/50 bg-card/60">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold shrink-0">
                  {user.name?.[0]?.toUpperCase() ?? "S"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{formatDisplayName(user.name, "Sub-Admin")}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                  {roleLabel(user.role)}
                </Badge>
                <Hint label="Edit sub-admin">
                  <span className="inline-flex">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(user)}
                      className="cursor-pointer"
                      aria-label="Edit sub-admin"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </span>
                </Hint>
                <Hint label="Remove sub-admin">
                  <span className="inline-flex">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(user._id, user.name)}
                      className="cursor-pointer text-destructive hover:text-destructive"
                      aria-label="Remove sub-admin"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </span>
                </Hint>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (next) setOpen(true);
          else closeDialog();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Update Sub-Admin" : "Create Sub-Admin Account"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="subadmin-name">Full Name</Label>
              <Input
                id="subadmin-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subadmin-email">Email</Label>
              <Input
                id="subadmin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subadmin-password">
                {editing ? "New Password (optional)" : "Temporary Password"}
              </Label>
              <div className="relative">
                <Input
                  id="subadmin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editing ? "Leave blank to keep current password" : "Min. 6 characters"}
                  minLength={6}
                  autoComplete="new-password"
                  className="pr-11"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={closeDialog} className="cursor-pointer">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="cursor-pointer"
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : editing
                  ? "Save Changes"
                  : "Create Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
