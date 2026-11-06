import { memo } from "react";
import type { Booking } from "@/types/index.ts";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { TableCell, TableRow } from "@/components/ui/table.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { BookingDropoffCell, BookingPickupCell } from "@/components/booking-schedule-cell.tsx";
import { Eye, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { bookingVehicle, formatCarName, formatDisplayName } from "@/lib/displayName.ts";
import { PAYMENT_COLORS, STATUS_COLORS } from "./bookingListFilters.ts";

export const AdminBookingRow = memo(function AdminBookingRow({
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
