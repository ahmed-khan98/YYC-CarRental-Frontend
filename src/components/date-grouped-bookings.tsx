import { format } from "date-fns";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogIn,
  LogOut,
  Gauge,
  Fuel,
  FileText,
  Camera,
  ExternalLink,
  Eye,
} from "lucide-react";
import type { Booking, VehicleInspection } from "@/types/index.ts";
import type { DateGroup, DateGroupItem } from "@/lib/bookingDateGroups.ts";
import { BookingDropoffCell, BookingPickupCell } from "@/components/booking-schedule-cell.tsx";
import { InspectionMediaGallery } from "@/components/inspection-media.tsx";
import { inspectionMediaUrls } from "@/lib/mediaUrl.ts";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";

function InspectionDateRow({
  inspection,
  booking,
  customerLabel,
}: {
  inspection: VehicleInspection;
  booking: Booking;
  customerLabel?: string;
}) {
  const navigate = useNavigate();
  const isCheckIn = inspection.type === "check_in";

  return (
    <Card className="border-border/50 bg-muted/10">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {isCheckIn ? (
                <LogIn className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <LogOut className="h-4 w-4 text-blue-400 shrink-0" />
              )}
              <span className="text-sm font-semibold">
                {isCheckIn ? "Check-In" : "Check-Out"}
              </span>
              <Badge
                variant="outline"
                className={`text-xs capitalize ${
                  isCheckIn
                    ? "border-primary/30 text-primary"
                    : "border-blue-500/30 text-blue-400"
                }`}
              >
                {inspection.type.replace("_", " ")}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {format(new Date(inspection._creationTime), "h:mm a")}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <span className="font-mono">#{booking._id.slice(-8)}</span>
              {customerLabel && <span>· {customerLabel}</span>}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Gauge className="h-3 w-3 shrink-0" />
                <span>
                  Mileage:{" "}
                  <span className="text-foreground">
                    {inspection.mileage.toLocaleString()} km
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Fuel className="h-3 w-3 shrink-0" />
                <span>
                  Fuel:{" "}
                  <span className="text-foreground capitalize">
                    {inspection.fuelLevel.replace("_", " ")}
                  </span>
                </span>
              </div>
              {inspection.notes && (
                <div className="col-span-2 flex items-start gap-1">
                  <FileText className="h-3 w-3 shrink-0 mt-0.5" />
                  <span>
                    Notes:{" "}
                    <span className="text-foreground">{inspection.notes}</span>
                  </span>
                </div>
              )}
            </div>
            {inspectionMediaUrls(inspection).length > 0 && (
                <InspectionMediaGallery
                  urls={inspectionMediaUrls(inspection)}
                  altPrefix="Inspection"
                  thumbClassName="h-12 w-16 object-cover rounded hover:opacity-80 transition-opacity"
                />
              )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs cursor-pointer text-primary hover:text-primary hover:bg-primary/10 shrink-0"
            onClick={() => navigate(`/admin/bookings/${booking._id}`)}
          >
            <ExternalLink className="h-3 w-3 mr-1" /> Booking
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function itemKey(item: DateGroupItem): string {
  if (item.kind === "booking") {
    return `booking-${item.booking._id}-${item.sortTime}`;
  }
  return `inspection-${item.inspection._id}`;
}

export function DateGroupedBookingsTable({
  groups,
  getCustomerLabel,
  getCustomerEmail,
  getPickupLocationName,
  getDropoffLocationName,
  onViewBooking,
  statusColors,
  paymentColors,
}: {
  groups: DateGroup[];
  getCustomerLabel?: (booking: Booking) => string | undefined;
  getCustomerEmail?: (booking: Booking) => string | undefined;
  getPickupLocationName?: (booking: Booking) => string | undefined;
  getDropoffLocationName?: (booking: Booking) => string | undefined;
  onViewBooking: (bookingId: string) => void;
  statusColors: Record<string, string>;
  paymentColors: Record<string, string>;
}) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => {
        const bookingItems = group.items.filter((item) => item.kind === "booking");
        const inspectionItems = group.items.filter((item) => item.kind !== "booking");

        return (
          <section key={group.dateKey}>
            <h2 className="text-sm font-semibold text-foreground pb-1 mb-2 border-b border-border/50">
              {group.label}
            </h2>
            {bookingItems.length > 0 && (
              <div className="rounded-xl border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="min-w-[90px]">Booking ID</TableHead>
                      <TableHead className="min-w-[140px]">Customer</TableHead>
                      <TableHead className="min-w-[150px]">Pickup</TableHead>
                      <TableHead className="min-w-[150px] hidden sm:table-cell">Drop-off</TableHead>
                      <TableHead className="min-w-[90px]">Status</TableHead>
                      <TableHead className="min-w-[90px] hidden md:table-cell">Payment</TableHead>
                      <TableHead className="min-w-[70px]">Total</TableHead>
                      <TableHead className="min-w-[70px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookingItems.map((item) => {
                      const booking = item.booking;
                      const customerName = getCustomerLabel?.(booking);
                      const customerEmail = getCustomerEmail?.(booking);
                      return (
                        <TableRow key={itemKey(item)}>
                          <TableCell className="font-mono text-xs">
                            #{booking._id.slice(-8).toUpperCase()}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium truncate max-w-[140px]">
                              {customerName ?? "—"}
                            </div>
                            {customerEmail && (
                              <div className="text-xs text-muted-foreground truncate max-w-[140px]">
                                {customerEmail}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-normal">
                            <BookingPickupCell
                              booking={booking}
                              locationName={getPickupLocationName?.(booking)}
                            />
                          </TableCell>
                          <TableCell className="hidden sm:table-cell whitespace-normal">
                            <BookingDropoffCell
                              booking={booking}
                              locationName={getDropoffLocationName?.(booking)}
                            />
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`text-[10px] border capitalize ${statusColors[booking.status] ?? ""}`}
                            >
                              {booking.status.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge
                              variant="outline"
                              className={`text-[10px] capitalize ${paymentColors[booking.paymentStatus ?? "pending"] ?? ""}`}
                            >
                              {booking.paymentStatus ?? "pending"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-primary text-sm">
                            ${booking.totalAmount}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 cursor-pointer"
                              onClick={() => onViewBooking(booking._id)}
                            >
                              <Eye className="h-4 w-4 mr-1" /> View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            {inspectionItems.length > 0 && (
              <div className="space-y-2 mt-2">
                {inspectionItems.map((item) => (
                  <InspectionDateRow
                    key={itemKey(item)}
                    inspection={item.inspection}
                    booking={item.booking}
                    customerLabel={getCustomerLabel?.(item.booking)}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

export function DateGroupedBookingsList({
  groups,
  renderBooking,
  getCustomerLabel,
}: {
  groups: DateGroup[];
  renderBooking: (booking: Booking, dateKey: string) => ReactNode;
  getCustomerLabel?: (booking: Booking) => string | undefined;
}) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.dateKey} className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground pb-1 border-b border-border/50">
            {group.label}
          </h2>
          <div className="space-y-3">
            {group.items.map((item) => {
              if (item.kind === "booking") {
                return (
                  <div key={itemKey(item)}>
                    {renderBooking(item.booking, group.dateKey)}
                  </div>
                );
              }
              return (
                <InspectionDateRow
                  key={itemKey(item)}
                  inspection={item.inspection}
                  booking={item.booking}
                  customerLabel={getCustomerLabel?.(item.booking)}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export { InspectionDateRow };
