import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { bookingsApi } from "@/api/bookings.api.ts";
import { AdminEditBookingDialog } from "@/components/admin-edit-booking-dialog.tsx";
import type { Booking } from "@/types/index.ts";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { BookingsTableSkeleton } from "@/components/page-skeleton.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/api/client.ts";
import { BookingDropoffCell, BookingPickupCell } from "@/components/booking-schedule-cell.tsx";
import { formatMoney } from "@/lib/rentalPricing.ts";
import {
  isCancelledWithBalanceDue,
  resolveBookingBalanceDue,
} from "@/components/cancelled-amount-due.tsx";
import {
  CalendarCheck,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { Hint } from "@/components/ui/tooltip.tsx";
import { formatCarName, formatDisplayName } from "@/lib/displayName.ts";
import { useAuth } from "@/hooks/use-auth.ts";
import { canDeleteRecords } from "@/lib/roles.ts";

const PAGE_SIZE = 10;
const STATUS_OPTIONS = ["pending", "confirmed", "checked_in", "checked_out", "completed", "cancelled"] as const;
const PAYMENT_OPTIONS = ["pending", "paid", "refunded"] as const;
const STATUS_ORDER: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  checked_in: 2,
  checked_out: 3,
  completed: 4,
  cancelled: 5,
};
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-primary/20 text-primary border-primary/30",
  checked_in: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  checked_out: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};
const PAYMENT_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-500 border-yellow-500/25",
  paid: "bg-green-500/15 text-green-500 border-green-500/25",
  refunded: "bg-muted text-muted-foreground border-border",
};

type SortField = "pickupDate" | "status" | "created";
type SortDir = "asc" | "desc";

export default function AdminBookingsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canDelete = canDeleteRecords(user?.role);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["bookings", "admin"],
    queryFn: () => bookingsApi.adminList(),
  });

  const cancelBooking = useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason?: string }) =>
      bookingsApi.cancel(bookingId, reason),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking-detail"] });
      toast.success(result.cancellationSummary?.message ?? "Booking cancelled");
    },
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("pickupDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  const [editBooking, setEditBooking] = useState<Booking | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [dialogLoading, setDialogLoading] = useState(false);

  const cancelledOutstanding = useMemo(() => {
    return (bookings ?? []).filter(isCancelledWithBalanceDue);
  }, [bookings]);

  const cancelledOutstandingTotal = useMemo(
    () => cancelledOutstanding.reduce((sum, b) => sum + resolveBookingBalanceDue(b), 0),
    [cancelledOutstanding],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (bookings ?? [])
      .filter((b) => {
        if (statusFilter !== "all" && b.status !== statusFilter) return false;
        if (paymentFilter !== "all" && (b.paymentStatus ?? "pending") !== paymentFilter) return false;
        if (startDateFilter && new Date(b.pickupDate) < new Date(startDateFilter)) return false;
        if (endDateFilter && new Date(b.pickupDate) > new Date(endDateFilter)) return false;
        if (q) {
          const name = b.user?.name?.toLowerCase() ?? "";
          const email = b.user?.email?.toLowerCase() ?? "";
          const idMatch =
            b._id.toLowerCase().includes(q) ||
            b._id.slice(-8).toLowerCase().includes(q);
          if (!idMatch && !name.includes(q) && !email.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === "pickupDate") {
          cmp = new Date(a.pickupDate).getTime() - new Date(b.pickupDate).getTime();
        } else if (sortField === "status") {
          cmp = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
        } else {
          cmp = a._creationTime - b._creationTime;
        }
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [bookings, statusFilter, paymentFilter, startDateFilter, endDateFilter, search, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "status" ? "asc" : "desc");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPaymentFilter("all");
    setStartDateFilter("");
    setEndDateFilter("");
    setPage(1);
  };

  const openEdit = (booking: Booking) => {
    setEditBooking(booking);
  };

  const openCancel = (booking: Booking) => {
    setActiveBooking(booking);
    setCancelReason("");
    setCancelOpen(true);
  };

  const handleCancel = async () => {
    if (!activeBooking) return;
    if (!cancelReason.trim()) {
      toast.error("Please provide a cancellation reason");
      return;
    }
    setDialogLoading(true);
    try {
      await cancelBooking.mutateAsync({ bookingId: activeBooking._id, reason: cancelReason });
      setCancelOpen(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setDialogLoading(false);
    }
  };

  const hasFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    paymentFilter !== "all" ||
    startDateFilter !== "" ||
    endDateFilter !== "";

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Booking Management</h2>
          <p className="text-muted-foreground text-sm">
            {filtered.length} booking{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => navigate("/admin/bookings/new")} className="cursor-pointer shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Create Booking
        </Button>
      </div>

      {cancelledOutstanding.length > 0 && (
        <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {cancelledOutstanding.length} cancelled booking{cancelledOutstanding.length !== 1 ? "s" : ""} with payment due
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Total outstanding: {formatMoney(cancelledOutstandingTotal)} — collect from customers and record in booking billing.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer shrink-0 border-amber-500/40"
            onClick={() => {
              setStatusFilter("cancelled");
              setPaymentFilter("pending");
              setPage(1);
            }}
          >
            Show cancelled · payment pending
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer name or booking ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full lg:w-40 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>
              ))}
                </SelectContent>
              </Select>
          <Select value={paymentFilter} onValueChange={(v) => { setPaymentFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full lg:w-40 h-9"><SelectValue placeholder="Payment" /></SelectTrigger>
                <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              {PAYMENT_OPTIONS.map((p) => (
                <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
              ))}
                </SelectContent>
              </Select>
          <Hint label="From date">
            <Input
              type="date"
              value={startDateFilter}
              onChange={(e) => { setStartDateFilter(e.target.value); setPage(1); }}
              className="h-9 w-full lg:w-36"
              aria-label="From date"
            />
          </Hint>
          <Hint label="To date">
            <Input
              type="date"
              value={endDateFilter}
              onChange={(e) => { setEndDateFilter(e.target.value); setPage(1); }}
              className="h-9 w-full lg:w-36"
              aria-label="To date"
            />
          </Hint>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="cursor-pointer shrink-0">
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <BookingsTableSkeleton />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-border/50">
          <CalendarCheck className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No bookings found</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="min-w-[100px]">Booking ID</TableHead>
                  <TableHead className="min-w-[140px] hidden sm:table-cell">Customer</TableHead>
                  <TableHead className="min-w-[130px] hidden md:table-cell">Vehicle</TableHead>
                  <TableHead className="min-w-[150px]">
                    <button type="button" onClick={() => toggleSort("pickupDate")} className="inline-flex items-center gap-1 cursor-pointer hover:text-foreground">
                      Pickup <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead className="min-w-[150px] hidden lg:table-cell">Drop-off</TableHead>
                  <TableHead className="min-w-[90px]">
                    <button type="button" onClick={() => toggleSort("status")} className="inline-flex items-center gap-1 cursor-pointer hover:text-foreground">
                      Status <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead className="min-w-[90px] hidden md:table-cell">Payment</TableHead>
                  <TableHead className="min-w-[80px]">Total</TableHead>
                  <TableHead className="min-w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((booking) => {
                  const customer = booking.user;
                  const car = booking.car;
            return (
                    <TableRow
                      key={booking._id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/admin/bookings/${booking._id}`)}
                    >
                      <TableCell className="font-mono text-xs">#{booking._id.slice(-8).toUpperCase()}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="text-sm font-medium truncate max-w-[140px]">{formatDisplayName(customer?.name)}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[140px]">{customer?.email ?? ""}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {formatCarName(car, { includeYear: false })}
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        <BookingPickupCell
                          booking={booking}
                          locationName={booking.pickupLocation?.name}
                        />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell whitespace-normal">
                        <BookingDropoffCell
                          booking={booking}
                          locationName={booking.dropoffLocation?.name}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] border capitalize ${STATUS_COLORS[booking.status] ?? ""}`}>
                          {booking.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className={`text-[10px] capitalize ${PAYMENT_COLORS[booking.paymentStatus ?? "pending"] ?? ""}`}>
                          {booking.paymentStatus ?? "pending"}
                            </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-primary text-sm">${booking.totalAmount}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate(`/admin/bookings/${booking._id}`)}>
                              <Eye className="h-4 w-4 mr-2" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer" onClick={() => openEdit(booking)}>
                              <Pencil className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            {canDelete && booking.status !== "cancelled" && booking.status !== "completed" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="cursor-pointer text-destructive focus:text-destructive"
                                  onClick={() => openCancel(booking)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete / Cancel
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
                        </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-2">
                          <Button
                variant="outline"
                            size="sm"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                          </Button>
              <span className="text-foreground font-medium px-2">
                Page {currentPage} of {totalPages}
              </span>
                            <Button
                variant="outline"
                              size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                      </div>
        </>
      )}

      {editBooking && (
        <AdminEditBookingDialog
          booking={editBooking}
          customer={editBooking.user}
          open
          onOpenChange={(open) => { if (!open) setEditBooking(null); }}
        />
      )}

      {/* Cancel Dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Delete / Cancel Booking</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Provide a reason — this will be visible to the customer.</p>
              <textarea
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm resize-none"
                rows={3}
              placeholder="Cancellation reason..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setCancelOpen(false)} className="cursor-pointer">Back</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={dialogLoading} className="cursor-pointer">
              {dialogLoading ? "Cancelling..." : "Confirm Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
