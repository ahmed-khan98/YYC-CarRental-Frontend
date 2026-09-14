import { memo } from "react";
import { Clock } from "lucide-react";
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { formatTime12h } from "@/lib/timeFormat.ts";

export const BOOKING_TIME_OPTIONS = [
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00",
] as const;

type RentalTimeSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export const RentalTimeSelect = memo(function RentalTimeSelect({
  label,
  value,
  onChange,
}: RentalTimeSelectProps) {
  return (
    <div className="min-w-0 space-y-2">
      <Label className="text-xs text-muted-foreground flex items-center gap-1">
        <Clock className="h-3 w-3" /> {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select time">{formatTime12h(value)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {BOOKING_TIME_OPTIONS.map((time) => (
            <SelectItem key={time} value={time}>
              {formatTime12h(time)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});
