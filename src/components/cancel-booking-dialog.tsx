import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import { bookingsApi } from "@/api/bookings.api.ts";
import type { Booking } from "@/types/index.ts";
import { CANCELLATION_POLICY_SUMMARY } from "@/lib/cancellation.ts";

interface CancelBookingDialogProps {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  loading?: boolean;
}

export function CancelBookingDialog({
  booking,
  open,
  onOpenChange,
  onConfirm,
  loading = false,
}: CancelBookingDialogProps) {
  const [previewMessage, setPreviewMessage] = useState<string>(CANCELLATION_POLICY_SUMMARY);
  const [canCancel, setCanCancel] = useState(true);

  useEffect(() => {
    if (!open || !booking) return;

    let cancelled = false;
    bookingsApi
      .getCancellationPreview(booking._id)
      .then((preview) => {
        if (cancelled) return;
        setPreviewMessage(preview.message);
        setCanCancel(preview.canCancel);
      })
      .catch(() => {
        if (cancelled) return;
        setPreviewMessage(CANCELLATION_POLICY_SUMMARY);
        setCanCancel(true);
      });

    return () => {
      cancelled = true;
    };
  }, [open, booking]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel booking?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>{previewMessage}</p>
              <p className="text-xs border-t border-border/50 pt-3">{CANCELLATION_POLICY_SUMMARY}</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading} className="cursor-pointer">
            Keep booking
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={loading || !canCancel}
            className="cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={async (event) => {
              event.preventDefault();
              await onConfirm();
            }}
          >
            {loading ? "Cancelling..." : "Confirm cancellation"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
