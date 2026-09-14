import { memo } from "react";
import { Users } from "lucide-react";
import {
  BookingDetailCard,
  BookingDetailCardContent,
  BookingDetailCardHeader,
  SectionTitle,
} from "@/components/booking-detail-ui.tsx";

type BookingNotesSectionProps = {
  notes: string;
  onNotesChange: (value: string) => void;
};

export const BookingNotesSection = memo(function BookingNotesSection({
  notes,
  onNotesChange,
}: BookingNotesSectionProps) {
  return (
    <BookingDetailCard>
      <BookingDetailCardHeader>
        <SectionTitle icon={<Users className="h-4 w-4" />} title="Additional Notes" />
      </BookingDetailCardHeader>
      <BookingDetailCardContent>
        <textarea
          className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          rows={3}
          placeholder="Any special requests or notes..."
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
        />
      </BookingDetailCardContent>
    </BookingDetailCard>
  );
});
