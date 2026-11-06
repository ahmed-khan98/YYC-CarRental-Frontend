import { memo } from "react";
import { MapPin } from "lucide-react";
import type { Location } from "@/types/index.ts";
import { useAutoSelectSingleLocation } from "@/hooks/use-auto-select-single-location.ts";
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import {
  BookingDetailCard,
  BookingDetailCardContent,
  BookingDetailCardHeader,
  SectionTitle,
} from "@/components/booking-detail-ui.tsx";

type BookingLocationsSectionProps = {
  locations: Location[];
  pickupLocationId: string;
  dropoffLocationId: string;
  onPickupLocationChange: (id: string) => void;
  onDropoffLocationChange: (id: string) => void;
};

function LocationSelectField({
  label,
  placeholder,
  value,
  onChange,
  locations,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (id: string) => void;
  locations: Location[];
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {locations.map((loc) => (
            <SelectItem key={loc._id} value={loc._id}>
              {loc.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export const BookingLocationsSection = memo(function BookingLocationsSection({
  locations,
  pickupLocationId,
  dropoffLocationId,
  onPickupLocationChange,
  onDropoffLocationChange,
}: BookingLocationsSectionProps) {
  useAutoSelectSingleLocation(
    locations,
    pickupLocationId,
    dropoffLocationId,
    onPickupLocationChange,
    onDropoffLocationChange,
  );

  return (
    <BookingDetailCard>
      <BookingDetailCardHeader>
        <SectionTitle icon={<MapPin className="h-4 w-4" />} title="Pickup & Drop-off Locations" />
      </BookingDetailCardHeader>
      <BookingDetailCardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <LocationSelectField
          label="Pickup Location"
          placeholder="Select pickup location"
          value={pickupLocationId}
          onChange={onPickupLocationChange}
          locations={locations}
        />
        <LocationSelectField
          label="Drop-off Location"
          placeholder="Select drop-off location"
          value={dropoffLocationId}
          onChange={onDropoffLocationChange}
          locations={locations}
        />
      </BookingDetailCardContent>
    </BookingDetailCard>
  );
});
