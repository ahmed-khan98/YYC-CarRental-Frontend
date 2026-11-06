import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/api/users.api.ts";
import { getApiErrorMessage } from "@/api/client.ts";
import { roleLabel, isStaffRole, roleBadgeClass } from "@/lib/roles.ts";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { AdminDataTable, type AdminTableColumn } from "@/components/admin-data-table.tsx";
import { AdminListPagination } from "@/components/admin-list-pagination.tsx";
import { toast } from "sonner";
import { Plus, Users } from "lucide-react";
import type { User } from "@/types/index.ts";
import { formatDisplayName } from "@/lib/displayName.ts";
import { ADMIN_LIST_LIMIT, listItems, listMeta } from "@/lib/pagination.ts";
import { EMAIL_ERROR, isValidEmail } from "@/lib/email.ts";

export default function AdminCustomersPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const { data: usersResult, isLoading } = useQuery({
    queryKey: ["users", { page, limit: ADMIN_LIST_LIMIT }],
    queryFn: () => usersApi.listUsers({ page, limit: ADMIN_LIST_LIMIT }),
  });
  const users = listItems(usersResult);
  const usersMeta = listMeta(usersResult, page, ADMIN_LIST_LIMIT);
  const customers = users.filter((user) => !isStaffRole(user.role));

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
      setEmailError(null);
      setPhoneError(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const handleCreate = () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password) {
      if (!phone.trim()) setPhoneError("Phone is required.");
      toast.error("Please fill in name, email, phone, and password");
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError(EMAIL_ERROR);
      return;
    }
    setEmailError(null);
    setPhoneError(null);
    createMutation.mutate({
      name: name.trim(),
      email: email.trim(),
      password,
      phone: phone.trim(),
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
          <p className="text-muted-foreground text-sm">{usersMeta.total} registered customers</p>
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
      {!isLoading && (
        <AdminListPagination
          page={usersMeta.page}
          totalPages={usersMeta.totalPages}
          total={usersMeta.total}
          limit={usersMeta.limit}
          onPageChange={setPage}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Customer Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="customer-name">Full Name *</Label>
              <Input
                id="customer-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customer-email">Email *</Label>
              <Input
                id="customer-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                required
                aria-invalid={Boolean(emailError)}
              />
              {emailError ? <p className="text-[11px] text-destructive">{emailError}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customer-phone">Phone *</Label>
              <Input
                id="customer-phone"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (phoneError) setPhoneError(null);
                }}
                required
                aria-invalid={Boolean(phoneError)}
              />
              {phoneError ? <p className="text-[11px] text-destructive">{phoneError}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customer-password">Temporary Password *</Label>
              <Input
                id="customer-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
