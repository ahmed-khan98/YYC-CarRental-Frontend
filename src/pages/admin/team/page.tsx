import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/api/users.api.ts";
import { getApiErrorMessage } from "@/api/client.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { AdminDataTable, type AdminTableColumn } from "@/components/admin-data-table.tsx";
import { toast } from "sonner";
import { Eye, EyeOff, Pencil, Plus, Trash2, UserCog } from "lucide-react";
import { Hint } from "@/components/ui/tooltip.tsx";
import { formatDisplayName } from "@/lib/displayName.ts";
import { cn } from "@/lib/utils.ts";
import type { User } from "@/types/index.ts";

export default function AdminTeamPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
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

  const toggleMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      usersApi.updateSubAdmin(userId, { isActive }),
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ["users", "sub-admins"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(`Sub-Admin ${isActive ? "activated" : "deactivated"}`);
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

  const handleToggle = (userId: string, current: boolean) => {
    toggleMutation.mutate({ userId, isActive: !current });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget._id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const columns: AdminTableColumn<User>[] = [
    {
      id: "name",
      header: "Name",
      cell: (user) => (
        <div className="flex items-center gap-3 min-w-[160px]">
          <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold shrink-0 text-sm">
            {user.name?.[0]?.toUpperCase() ?? "S"}
          </div>
          <span className="font-medium">{formatDisplayName(user.name, "Sub-Admin")}</span>
        </div>
      ),
    },
    {
      id: "email",
      header: "Email",
      cell: (user) => <span className="text-sm text-muted-foreground">{user.email ?? "—"}</span>,
    },
    {
      id: "status",
      header: "Status",
      cell: (user) => {
        const active = user.isActive !== false;
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={active}
              onCheckedChange={() => handleToggle(user._id, active)}
              disabled={toggleMutation.isPending}
              className="cursor-pointer"
              aria-label={active ? "Deactivate sub-admin" : "Activate sub-admin"}
            />
            <Badge
              variant="outline"
              className={cn(
                "text-[11px] font-medium border",
                active
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-red-50 text-red-700 border-red-200",
              )}
            >
              {active ? "Active" : "Inactive"}
            </Badge>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      className: "text-right",
      headClassName: "text-right",
      cell: (user) => (
        <div className="flex items-center justify-end gap-1">
          <Hint label="Edit sub-admin">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openEdit(user)}
              className="cursor-pointer h-8 w-8"
              aria-label="Edit sub-admin"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </Hint>
          <Hint label="Remove sub-admin">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteTarget(user)}
              className="cursor-pointer h-8 w-8 text-destructive hover:text-destructive"
              aria-label="Remove sub-admin"
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </Hint>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Sub-Admins</h2>
          <p className="text-muted-foreground text-sm">
            {subAdmins?.length ?? 0} team member{(subAdmins?.length ?? 0) === 1 ? "" : "s"}
          </p>
        </div>
        <Button onClick={openCreate} className="cursor-pointer">
          <Plus className="h-4 w-4 mr-2" />
          Add Sub-Admin
        </Button>
      </div>

      <AdminDataTable
        columns={columns}
        data={subAdmins ?? []}
        getRowKey={(user) => user._id}
        isLoading={isLoading}
        emptyIcon={UserCog}
        emptyMessage="No sub-admin accounts yet"
      />

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

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(next) => !next && setDeleteTarget(null)}
        title="Remove this sub-admin?"
        description={
          deleteTarget
            ? `This will permanently remove ${formatDisplayName(deleteTarget.name, "this account")}. This action cannot be undone.`
            : ""
        }
        confirmLabel="Remove"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
