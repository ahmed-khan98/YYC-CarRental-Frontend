import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/api/users.api.ts";
import { getApiErrorMessage } from "@/api/client.ts";
import { roleLabel, isStaffRole } from "@/lib/roles.ts";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { AdminDataTable, type AdminTableColumn } from "@/components/admin-data-table.tsx";
import { toast } from "sonner";
import { Plus, Users } from "lucide-react";
import type { User } from "@/types/index.ts";
import { formatDisplayName } from "@/lib/displayName.ts";

function roleBadgeClass(role?: string) {
  if (role === "admin") return "bg-primary/20 text-primary border-primary/30 text-xs";
  if (role === "sub_admin") return "bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs";
  return "bg-secondary text-secondary-foreground text-xs";
}

export default function AdminCustomersPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.listUsers(),
  });
  const customers = (users ?? []).filter((user) => !isStaffRole(user.role));

  const createMutation = useMutation({
    mutationFn: usersApi.createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Customer account created");
      setOpen(false);
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const handleCreate = () => {
    if (!name.trim() || !email.trim() || !password) {
      toast.error("Please fill in name, email, and password");
      return;
    }
    createMutation.mutate({
      name: name.trim(),
      email: email.trim(),
      password,
      phone: phone.trim() || undefined,
    });
  };

  const customerColumns: AdminTableColumn<User>[] = [
    {
      id: "name",
      header: "Customer",
      cell: (user) => (
        <div className="flex items-center gap-3 min-w-[160px]">
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0 text-sm">
            {user.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <span className="font-medium">{formatDisplayName(user.name, "Anonymous")}</span>
        </div>
      ),
    },
    {
      id: "email",
      header: "Email",
      cell: (user) => <span className="text-sm text-muted-foreground">{user.email ?? "No email"}</span>,
    },
    {
      id: "phone",
      header: "Phone",
      className: "hidden md:table-cell",
      headClassName: "hidden md:table-cell",
      cell: (user) => user.phone ?? "—",
    },
    {
      id: "role",
      header: "Role",
      cell: (user) => (
        <Badge className={roleBadgeClass(user.role)}>
          {roleLabel(user.role)}
        </Badge>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Customers</h2>
          <p className="text-muted-foreground text-sm">{customers.length} registered customers</p>
        </div>
        <Button onClick={() => setOpen(true)} className="cursor-pointer">
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <AdminDataTable
        columns={customerColumns}
        data={customers}
        getRowKey={(user) => user._id}
        isLoading={isLoading}
        emptyIcon={Users}
        emptyMessage="No customers yet"
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Customer Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="customer-name">Full Name</Label>
              <Input
                id="customer-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customer-email">Email</Label>
              <Input
                id="customer-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customer-phone">Phone (optional)</Label>
              <Input
                id="customer-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 403 555 0100"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customer-password">Temporary Password</Label>
              <Input
                id="customer-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                minLength={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)} className="cursor-pointer">
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="cursor-pointer"
            >
              {createMutation.isPending ? "Creating..." : "Create Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
