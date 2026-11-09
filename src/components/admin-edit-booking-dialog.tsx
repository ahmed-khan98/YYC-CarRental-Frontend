import { useCallback, useEffect, useMemo, useState } from "react";
import { useAutoSelectSingleLocation } from "@/hooks/use-auto-select-single-location.ts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bookingsApi } from "@/api/bookings.api.ts";
import { usersApi } from "@/api/users.api.ts";
import { carsApi } from "@/api/cars.api.ts";
import { locationsApi } from "@/api/locations.api.ts";
import { servicesApi } from "@/api/services.api.ts";
import { BookingServicesSection } from "@/components/booking-form/booking-services-section.tsx";
import { AdminEditBillingPanel } from "@/components/admin-edit-billing-panel.tsx";
import type { Booking, BookingStatus, User } from "@/types/index.ts";
import { Button } from "@/components/ui/button.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/api/client.ts";
import { listItems } from "@/lib/pagination.ts";
import { isValidRentalPeriod } from "@/lib/rentalPricing.ts";
import { todayYmd } from "@/lib/bookingWindow.ts";
import { patchText } from "@/lib/patchPayload.ts";
import {
  buildServicesPayload,
  setBookingExtraDriverName,
  setBookingServiceQuantity,
  toggleBookingService,
  validateBookingExtraDrivers,
} from "@/lib/bookingServicesState.ts";
import { computeAdminEditBookingQuote } from "@/lib/adminEditBookingQuote.ts";
import { formatTime12h } from "@/lib/timeFormat.ts";
import { formatCustomerLabel } from "@/lib/customerLabel.ts";
import {
  ADMIN_BOOKING_STATUS_OPTIONS,
  ADMIN_EDIT_PAYMENT_OPTIONS,
  ADMIN_EDIT_STATUS_OPTIONS,
  ADMIN_EDIT_TIME_OPTIONS,
  bookingToEditForm,
  type AdminEditBookingForm,
} from "@/lib/adminEditBookingForm.ts";

type AdminEditBookingDialogProps = {
  booking: Booking | null;
  customer?: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function AdminEditBookingDialog({
  booking,
  customer: customerProp,
  open,
  onOpenChange,
  onSuccess,
}: AdminEditBookingDialogProps) {
  const queryClient = useQueryClient();
  const today = todayYmd();
  const [editForm, setEditForm] = useState<AdminEditBookingForm | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: usersResult } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.listUsers(),
    enabled: open && !customerProp,
  });
  const { data: carsResult } = useQuery({
    queryKey: ["cars", { includeDeactivated: true }],
    queryFn: () => carsApi.list({ includeDeactivated: true }),
    enabled: open,
  });
  const { data: locationsResult } = useQuery({
    queryKey: ["locations", { activeOnly: true }],
    queryFn: () => locationsApi.list(true),
    enabled: open,
  });
  const { data: servicesResult } = useQuery({
    queryKey: ["services", { activeOnly: true }],
    queryFn: () => servicesApi.list(true),
    enabled: open,
  });
  const users = listItems(usersResult);
  const cars = listItems(carsResult);
  const locations = listItems(locationsResult);
  const services = listItems(servicesResult);

  const adminUpdate = useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: string; data: Parameters<typeof bookingsApi.adminUpdate>[1] }) =>
      bookingsApi.adminUpdate(bookingId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookings"] }),
  });

  useEffect(() => {
    if (open && booking) {
      setEditForm(bookingToEditForm(booking));
    } else if (!open) {
      setEditForm(null);
    }
  }, [open, booking]);

  const setEditPickupLocation = useCallback((id: string) => {
    setEditForm((f) => f && { ...f, pickupLocationId: f.pickupLocationId || id });
  }, []);
  const setEditDropoffLocation = useCallback((id: string) => {
    setEditForm((f) => f && { ...f, dropoffLocationId: f.dropoffLocationId || id });
  }, []);
  useAutoSelectSingleLocation(
    locations,
    editForm?.pickupLocationId ?? "",
    editForm?.dropoffLocationId ?? "",
    setEditPickupLocation,
    setEditDropoffLocation,
  );

  const serviceList = services ?? [];

  const editSelectedIds = useMemo(
    () => new Set(editForm?.additionalServiceIds ?? []),
    [editForm?.additionalServiceIds],
  );

  const editBillingQuote = useMemo(() => {
    if (!editForm || !booking) return null;
    return computeAdminEditBookingQuote({
      editForm,
      booking,
      cars: cars ?? [],
      services: services ?? [],
    });
  }, [editForm, booking, cars, services]);

  const customerLabel = useMemo(() => {
    if (customerProp) return formatCustomerLabel(customerProp);
    if (!booking) return "—";
    return formatCustomerLabel((users ?? []).find((u) => u._id === booking.userId));
  }, [booking, customerProp, users]);

  const handleToggleService = useCallback(
    (serviceId: string) => {
      setEditForm((form) =>
        form ? { ...form, ...toggleBookingService(form, serviceId, serviceList) } : form,
      );
    },
    [serviceList],
  );

  const handleServiceQuantityChange = useCallback(
    (serviceId: string, count: number) => {
      setEditForm((form) =>
        form ? { ...form, ...setBookingServiceQuantity(form, serviceId, count, serviceList) } : form,
      );
    },
    [serviceList],
  );

  const handleExtraDriverNameChange = useCallback((index: number, name: string) => {
    setEditForm((form) => (form ? { ...form, ...setBookingExtraDriverName(form, index, name) } : form));
  }, []);

  const saveEdit = async () => {
    if (!booking || !editForm) return;
    if (!isValidRentalPeriod(editForm.pickupDate, editForm.pickupTime, editForm.returnDate, editForm.returnTime)) {
      toast.error("Drop-off must be after pickup date and time");
      return;
    }
    const servicesError = validateBookingExtraDrivers(editForm, services ?? []);
    if (servicesError) {
      toast.error(servicesError);
      return;
    }
    setSaving(true);
    try {
      const servicesPayload = buildServicesPayload(editForm, services ?? []);
      await adminUpdate.mutateAsync({
        bookingId: booking._id,
        data: {
          carId: editForm.carId,
          pickupLocationId: editForm.pickupLocationId,
          dropoffLocationId: editForm.dropoffLocationId,
          pickupDate: editForm.pickupDate,
          pickupTime: editForm.pickupTime,
          returnDate: editForm.returnDate,
          returnTime: editForm.returnTime,
          ...servicesPayload,
          notes: patchText(editForm.notes),
          paymentStatus: editForm.paymentStatus,
          status: ADMIN_EDIT_STATUS_OPTIONS.includes(editForm.status as typeof ADMIN_EDIT_STATUS_OPTIONS[number])
            ? editForm.status
            : undefined,
        },
      });
      toast.success("Booking updated");
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dismissible={false} className="flex w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl lg:max-w-5xl max-h-[min(92vh,880px)]">
        <DialogHeader className="shrink-0 px-4 pt-5 pb-3 sm:px-6 sm:pt-6 sm:pb-4">
          <DialogTitle>Edit Booking</DialogTitle>
        </DialogHeader>
        {editForm && (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-y border-border/50 lg:flex-row">
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 min-w-0">
                  <Label className="text-xs">Vehicle</Label>
                  <Select value={editForm.carId} onValueChange={(v) => setEditForm((f) => f && { ...f, carId: v })}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(cars ?? [])
                        .filter((c) => c.status !== "deactive" || c._id === editForm.carId)
                        .map((c) => (
                        <SelectItem key={c._id} value={c._id}>{c.year} {c.make} {c.model}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 min-w-0">
                  <Label className="text-xs">Customer</Label>
                  <Input readOnly value={customerLabel} className="w-full bg-muted/40" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 min-w-0">
                  <Label className="text-xs">Pickup Location</Label>
                  <Select value={editForm.pickupLocationId} onValueChange={(v) => setEditForm((f) => f && { ...f, pickupLocationId: v })}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(locations ?? []).map((loc) => <SelectItem key={loc._id} value={loc._id}>{loc.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 min-w-0">
                  <Label className="text-xs">Drop-off Location</Label>
                  <Select value={editForm.dropoffLocationId} onValueChange={(v) => setEditForm((f) => f && { ...f, dropoffLocationId: v })}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(locations ?? []).map((loc) => <SelectItem key={loc._id} value={loc._id}>{loc.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 min-w-0">
                  <Label className="text-xs">Pickup Date</Label>
                  <Input type="date" className="w-full" min={today} value={editForm.pickupDate} onChange={(e) => setEditForm((f) => f && { ...f, pickupDate: e.target.value })} />
                </div>
                <div className="space-y-1.5 min-w-0">
                  <Label className="text-xs">Pickup Time</Label>
                  <Select
                    value={editForm.pickupTime || "10:00"}
                    onValueChange={(v) => setEditForm((f) => f && { ...f, pickupTime: v })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>{formatTime12h(editForm.pickupTime || "10:00")}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>{ADMIN_EDIT_TIME_OPTIONS.map((t) => <SelectItem key={t} value={t}>{formatTime12h(t)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 min-w-0">
                  <Label className="text-xs">Drop-off Date</Label>
                  <Input type="date" className="w-full" min={editForm.pickupDate} value={editForm.returnDate} onChange={(e) => setEditForm((f) => f && { ...f, returnDate: e.target.value })} />
                </div>
                <div className="space-y-1.5 min-w-0">
                  <Label className="text-xs">Drop-off Time</Label>
                  <Select
                    value={editForm.returnTime || "10:00"}
                    onValueChange={(v) => setEditForm((f) => f && { ...f, returnTime: v })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>{formatTime12h(editForm.returnTime || "10:00")}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>{ADMIN_EDIT_TIME_OPTIONS.map((t) => <SelectItem key={t} value={t}>{formatTime12h(t)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 min-w-0">
                  <Label className="text-xs">Booking Status</Label>
                  <Select
                    value={editForm.status}
                    onValueChange={(v) => setEditForm((f) => f && { ...f, status: v as BookingStatus })}
                  >
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ADMIN_BOOKING_STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s} disabled={s === "checked_in" || s === "checked_out"} className="capitalize">
                          {s.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 min-w-0">
                  <Label className="text-xs">Payment Status</Label>
                  <Select
                    value={editForm.paymentStatus}
                    onValueChange={(v) => setEditForm((f) => f && { ...f, paymentStatus: v as AdminEditBookingForm["paymentStatus"] })}
                  >
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ADMIN_EDIT_PAYMENT_OPTIONS.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {(services ?? []).length > 0 && (
                <BookingServicesSection
                  embedded
                  services={services ?? []}
                  selectedIds={editSelectedIds}
                  serviceQuantities={editForm.serviceQuantities}
                  extraDriverNames={editForm.extraDriverNames}
                  onToggleService={handleToggleService}
                  onServiceQuantityChange={handleServiceQuantityChange}
                  onExtraDriverNameChange={handleExtraDriverNameChange}
                />
              )}
              <div className="space-y-1.5">
                <Label className="text-xs">Notes</Label>
                <textarea
                  className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm resize-none"
                  rows={2}
                  value={editForm.notes}
                  onChange={(e) => setEditForm((f) => f && { ...f, notes: e.target.value })}
                />
              </div>
            </div>
            {editBillingQuote && (
              <aside className="hidden lg:flex lg:w-80 xl:w-[22rem] shrink-0 flex-col overflow-y-auto border-l border-border/50 bg-muted/15 px-4 py-4">
                <AdminEditBillingPanel quote={editBillingQuote} layout="sidebar" />
              </aside>
            )}
          </div>
        )}
        {editBillingQuote && (
          <div className="shrink-0 border-t border-border/50 bg-background lg:hidden">
            <AdminEditBillingPanel quote={editBillingQuote} layout="drawer" />
          </div>
        )}
        <DialogFooter className="shrink-0 gap-2 px-4 py-3 sm:px-6 sm:py-4">
          <Button variant="secondary" onClick={() => onOpenChange(false)} className="cursor-pointer">Cancel</Button>
          <Button onClick={saveEdit} disabled={saving} className="cursor-pointer">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
