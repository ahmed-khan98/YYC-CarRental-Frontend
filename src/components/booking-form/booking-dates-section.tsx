import { memo } from "react";
import { Calendar } from "lucide-react";
import { DatePicker } from "@/components/date-picker.tsx";
import { Label } from "@/components/ui/label.tsx";
import {
  BookingDetailCard,
  BookingDetailCardContent,
  BookingDetailCardHeader,
  SectionTitle,
} from "@/components/booking-detail-ui.tsx";
import { RentalTimeSelect } from "@/components/booking-form/rental-time-select.tsx";

type BookingDatesSectionProps = {
  today: string;
  pickupDate: string;
  returnDate: string;
  pickupTime: string;
  returnTime: string;
  durationLabel: string;
  onPickupDateChange: (date: string) => void;
  onReturnDateChange: (date: string) => void;
  onPickupTimeChange: (time: string) => void;
  onReturnTimeChange: (time: string) => void;
};

export const BookingDatesSection = memo(function BookingDatesSection({
  today,
  pickupDate,
  returnDate,
  pickupTime,
  returnTime,
  durationLabel,
  onPickupDateChange,
  onReturnDateChange,
  onPickupTimeChange,
  onReturnTimeChange,
}: BookingDatesSectionProps) {
  return (
    <BookingDetailCard>
      <BookingDetailCardHeader>
        <SectionTitle icon={<Calendar className="h-4 w-4" />} title="Rental Dates & Times" />
      </BookingDetailCardHeader>
      <BookingDetailCardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="min-w-0 space-y-2">
            <Label className="text-xs text-muted-foreground">Pickup Date</Label>
            <DatePicker
              value={pickupDate}
              minDate={today}
              label="Pick up"
              selectedHint="Pick up"
              onChange={onPickupDateChange}
              align="start"
            />
          </div>
          <div className="min-w-0 space-y-2">
            <Label className="text-xs text-muted-foreground">Drop-off Date</Label>
            <DatePicker
              value={returnDate}
              minDate={pickupDate || today}
              label="Drop-off"
              selectedHint="Drop-off"
              onChange={onReturnDateChange}
              align="start"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <RentalTimeSelect label="Pickup Time" value={pickupTime} onChange={onPickupTimeChange} />
          <RentalTimeSelect label="Drop-off Time" value={returnTime} onChange={onReturnTimeChange} />
        </div>
        <p className="text-sm text-muted-foreground">
          Duration: <span className="text-foreground font-medium">{durationLabel}</span>
        </p>
      </BookingDetailCardContent>
    </BookingDetailCard>
  );
});
