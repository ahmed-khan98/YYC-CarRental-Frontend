import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Loader2,
  Plus,
  Search,
  ArrowUpDown,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { Hint } from "@/components/ui/tooltip.tsx";
import { bookingVehicle, formatCarName, formatDisplayName } from "@/lib/displayName.ts";
import { useAuth } from "@/hooks/use-auth.ts";
import { canDeleteRecords } from "@/lib/roles.ts";
import { ADMIN_LIST_LIMIT, listItems, listMeta } from "@/lib/pagination.ts";
import { AdminListPagination } from "@/components/admin-list-pagination.tsx";
import { cn } from "@/lib/utils.ts";

type DatePreset = "today" | "week" | "month" | "custom";

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "custom", label: "Custom" },
];

function formatInputDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function rangeForPreset(preset: Exclude<DatePreset, "custom">): { start: string; end: string } {
  const now = new Date();
  if (preset === "today") {
    const key = formatInputDate(now);
    return { start: key, end: key };
  }
  if (preset === "week") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start: formatInputDate(start), end: formatInputDate(end) };
  }
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: formatInputDate(start), end: formatInputDate(end) };
}

function pickupDateKey(value: string): string {
  const raw = String(value ?? "");
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return formatInputDate(d);
}

function orderedDateRange(start: string, end: string): { from: string; to: string } {
  if (start && end && start > end) return { from: end, to: start };
  return { from: start, to: end };
}

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

const AdminBookingRow = memo(function AdminBookingRow({
  booking,
  canDelete,
  onView,
  onEdit,
  onCancel,
}: {
  booking: Booking;
  canDelete: boolean;
  onView: (bookingId: string) => void;
  onEdit: (booking: Booking) => void;
  onCancel: (booking: Booking) => void;
}) {
  const customer = booking.user;
  const car = bookingVehicle(booking);
  return (
    <TableRow
      className="cursor-pointer"
      onClick={() => onView(booking._id)}
    >
      <TableCell className="font-mono text-[10px]">#{booking._id.slice(-8).toUpperCase()}</TableCell>
      <TableCell className="hidden sm:table-cell">
        <div className="text-xs font-medium truncate max-w-[140px]">{formatDisplayName(customer?.name)}</div>
        <div className="text-[10px] text-muted-foreground truncate max-w-[140px]">{customer?.email ?? ""}</div>
      </TableCell>
      <TableCell className="hidden md:table-cell text-xs">
        {formatCarName(car, { includeYear: false })}
      </TableCell>
      <TableCell className="whitespace-normal">
        <BookingPickupCell
          booking={booking}
          locationName={booking.pickupLocation?.name}
          compact
        />
      </TableCell>
      <TableCell className="hidden lg:table-cell whitespace-normal">
        <BookingDropoffCell
          booking={booking}
          locationName={booking.dropoffLocation?.name}
          compact
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
      <TableCell className="font-semibold text-primary text-[13px]">${booking.totalAmount}</TableCell>
      <TableCell className="w-px px-1 text-center" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="cursor-pointer" onClick={() => onView(booking._id)}>
              <Eye className="h-4 w-4 mr-2" /> View
            </DropdownMenuItem>
            {booking.status !== "completed" && booking.status !== "cancelled" && (
              <DropdownMenuItem className="cursor-pointer" onClick={() => onEdit(booking)}>
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </DropdownMenuItem>
            )}
            {canDelete && booking.status !== "cancelled" && booking.status !== "completed" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={() => onCancel(booking)}
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
});

export default function AdminBookingsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canDelete = canDeleteRecords(user?.role);

  const [page, setPage] = useState(1);
  const [datePreset, setDatePreset] = useState<DatePreset>("today");
  const [startDateFilter, setStartDateFilter] = useState(() => rangeForPreset("today").start);
  const [endDateFilter, setEndDateFilter] = useState(() => rangeForPreset("today").end);
  const [appliedRange, setAppliedRange] = useState(() => {
    const range = rangeForPreset("today");
    return orderedDateRange(range.start, range.end);
  });
  const pickupRange = appliedRange;

  const commitCustomRange = useCallback((start: string, end: string) => {
    if (!start || !end) return;
    const next = orderedDateRange(start, end);
    setAppliedRange((prev) => {
      if (prev.from === next.from && prev.to === next.to) return prev;
      return next;
    });
    setPage(1);
  }, []);

  const customCommitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queueCustomRange = useCallback((start: string, end: string) => {
    if (customCommitTimer.current) clearTimeout(customCommitTimer.current);
    customCommitTimer.current = setTimeout(() => {
      commitCustomRange(start, end);
      customCommitTimer.current = null;
    }, 350);
  }, [commitCustomRange]);

  const flushCustomRange = useCallback((start: string, end: string) => {
    if (customCommitTimer.current) {
      clearTimeout(customCommitTimer.current);
      customCommitTimer.current = null;
    }
    commitCustomRange(start, end);
  }, [commitCustomRange]);

  useEffect(() => () => {
    if (customCommitTimer.current) clearTimeout(customCommitTimer.current);
  }, []);
  const { data: bookingsResult, isLoading, isFetching } = useQuery({
    queryKey: ["bookings", "admin", { page, limit: ADMIN_LIST_LIMIT, pickupFrom: pickupRange.from, pickupTo: pickupRange.to }],
    queryFn: () => bookingsApi.adminList({
      page,
      limit: ADMIN_LIST_LIMIT,
      pickupFrom: pickupRange.from || undefined,
      pickupTo: pickupRange.to || undefined,
    }),
    placeholderData: keepPreviousData,
  });
  const isRefreshing = isFetching && !isLoading;
  const bookings = listItems(bookingsResult);
  const bookingsMeta = listMeta(bookingsResult, page, ADMIN_LIST_LIMIT);

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
  const [sortField, setSortField] = useState<SortField>("pickupDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

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
        const pickupKey = pickupDateKey(b.pickupDate);
        if (pickupRange.from && pickupKey && pickupKey < pickupRange.from) return false;
        if (pickupRange.to && pickupKey && pickupKey > pickupRange.to) return false;
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
  }, [bookings, statusFilter, paymentFilter, pickupRange.from, pickupRange.to, search, sortField, sortDir]);

  const paginated = filtered;

  const handleViewBooking = useCallback((bookingId: string) => {
    navigate(`/admin/bookings/${bookingId}`);
  }, [navigate]);

  const handleEditBooking = useCallback((booking: Booking) => {
    setEditBooking(booking);
  }, []);

  const handleOpenCancel = useCallback((booking: Booking) => {
    setActiveBooking(booking);
    setCancelReason("");
    setCancelOpen(true);
  }, []);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "status" ? "asc" : "desc");
    }
  };

  const applyDatePreset = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset === "custom") return;
    const range = rangeForPreset(preset);
    setStartDateFilter(range.start);
    setEndDateFilter(range.end);
    setAppliedRange(orderedDateRange(range.start, range.end));
    setPage(1);
  };

  const clearFilters = () => {
    const range = rangeForPreset("today");
    setSearch("");
    setStatusFilter("all");
    setPaymentFilter("all");
    setDatePreset("today");
    setStartDateFilter(range.start);
    setEndDateFilter(range.end);
    setAppliedRange(orderedDateRange(range.start, range.end));
    setPage(1);
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

  const todayRange = rangeForPreset("today");
  const hasFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    paymentFilter !== "all" ||
    datePreset !== "today" ||
    startDateFilter !== todayRange.start ||
    endDateFilter !== todayRange.end;

  return (
    <div className="p-3 sm:p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Booking Management</h2>
          <p className="text-muted-foreground text-sm inline-flex items-center gap-1.5">
            {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {bookingsMeta.total} booking{bookingsMeta.total !== 1 ? "s" : ""}
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
      <div className="rounded-xl border border-border/50 bg-card/60 p-2.5 space-y-2 text-xs">
        <div className="flex flex-col lg:flex-row gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8 h-8 text-xs md:text-xs"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full lg:w-36 h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>
              ))}
                </SelectContent>
              </Select>
          <Select value={paymentFilter} onValueChange={(v) => { setPaymentFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full lg:w-36 h-8 text-xs"><SelectValue placeholder="Payment" /></SelectTrigger>
                <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              {PAYMENT_OPTIONS.map((p) => (
                <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
              ))}
                </SelectContent>
              </Select>
          <div className="flex rounded-lg border border-border/50 p-0.5 shrink-0 w-full lg:w-auto">
            {DATE_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => applyDatePreset(preset.value)}
                className={cn(
                  "h-7 flex-1 lg:flex-none px-2.5 text-xs rounded-md cursor-pointer",
                  datePreset === preset.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
          {datePreset === "custom" && (
            <>
              <Hint label="Start date">
                <Input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => {
                    const start = e.target.value;
                    setStartDateFilter(start);
                    queueCustomRange(start, endDateFilter);
                  }}
                  onBlur={(e) => flushCustomRange(e.target.value, endDateFilter)}
                  className="h-8 w-full lg:w-32 text-xs md:text-xs"
                  aria-label="Start date"
                />
              </Hint>
              <Hint label="End date">
                <Input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => {
                    const end = e.target.value;
                    setEndDateFilter(end);
                    queueCustomRange(startDateFilter, end);
                  }}
                  onBlur={(e) => flushCustomRange(startDateFilter, e.target.value)}
                  className="h-8 w-full lg:w-32 text-xs md:text-xs"
                  aria-label="End date"
                />
              </Hint>
            </>
          )}
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="cursor-pointer shrink-0 h-8 px-2 text-xs">
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <BookingsTableSkeleton />
      ) : filtered.length === 0 ? (
        <div className="relative text-center py-16 rounded-xl border border-border/50">
          {isRefreshing && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/60">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          <CalendarCheck className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No bookings found</p>
        </div>
      ) : (
        <>
          <div className="relative rounded-xl border border-border/50 bg-card/60 overflow-hidden">
            {isRefreshing && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            <Table className="text-[13px] [&_th]:h-8 [&_th]:px-1.5 [&_th]:text-[13px] [&_td]:px-1.5 [&_td]:py-1">
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
                  <TableHead className="min-w-[90px]">Status</TableHead>
                  <TableHead className="min-w-[90px] hidden md:table-cell">Payment</TableHead>
                  <TableHead className="min-w-[80px]">Total</TableHead>
                  <TableHead className="w-px px-1 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((booking) => (
                  <AdminBookingRow
                    key={booking._id}
                    booking={booking}
                    canDelete={canDelete}
                    onView={handleViewBooking}
                    onEdit={handleEditBooking}
                    onCancel={handleOpenCancel}
                  />
                ))}
              </TableBody>
            </Table>
                        </div>

          <AdminListPagination
            page={bookingsMeta.page}
            totalPages={bookingsMeta.totalPages}
            total={bookingsMeta.total}
            limit={bookingsMeta.limit}
            onPageChange={setPage}
          />
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
