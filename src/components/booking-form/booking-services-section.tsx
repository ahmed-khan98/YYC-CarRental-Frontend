import { memo } from "react";
import { Minus, Plus, Shield } from "lucide-react";
import type { AdditionalService } from "@/types/index.ts";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import {
  BookingDetailCard,
  BookingDetailCardContent,
  BookingDetailCardHeader,
  SectionTitle,
} from "@/components/booking-detail-ui.tsx";
import { formatServiceRateLabel } from "@/lib/bookingQuote.ts";
import { isExtraDriverService } from "@/lib/extraDriver.ts";
import { serviceAllowsQuantity } from "@/lib/serviceQuantity.ts";
import { cn } from "@/lib/utils.ts";
import { Hint } from "@/components/ui/tooltip.tsx";

type BookingServicesSectionProps = {
  services: AdditionalService[];
  selectedIds: ReadonlySet<string>;
  serviceQuantities: Readonly<Record<string, number>>;
  extraDriverNames: string[];
  onToggleService: (id: string) => void;
  onServiceQuantityChange: (serviceId: string, count: number) => void;
  onExtraDriverNameChange: (index: number, name: string) => void;
  /** Use inside dialogs/forms without the outer card wrapper */
  embedded?: boolean;
};

function InlineQuantityCounter({
  quantity,
  onDecrease,
  onIncrease,
}: {
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <div
      className="inline-flex items-center rounded-md border border-border/60 bg-background shrink-0"
      onClick={(event) => event.stopPropagation()}
    >
      <Hint label="Decrease quantity">
        <span className="inline-flex">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-none rounded-l-md cursor-pointer"
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
            onClick={onDecrease}
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
        </span>
      </Hint>
      <span className="min-w-[1.5rem] px-1 text-center text-xs font-semibold tabular-nums">
        {quantity}
      </span>
      <Hint label="Increase quantity">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-none rounded-r-md cursor-pointer"
          aria-label="Increase quantity"
          onClick={onIncrease}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </Hint>
    </div>
  );
}

export const BookingServicesSection = memo(function BookingServicesSection({
  services,
  selectedIds,
  serviceQuantities,
  extraDriverNames,
  onToggleService,
  onServiceQuantityChange,
  onExtraDriverNameChange,
  embedded = false,
}: BookingServicesSectionProps) {
  if (services.length === 0) return null;

  const serviceList = (
    <div className={embedded ? "space-y-2" : "space-y-3"}>
      {services.map((service) => {
          const isSelected = selectedIds.has(service._id);
          const allowsQuantity = serviceAllowsQuantity(service);
          const isExtraDriver = isExtraDriverService(service);
          const quantity = serviceQuantities[service._id] ?? 1;
          const showCounter = isSelected && allowsQuantity;

          return (
            <div
              key={service._id}
              className={cn(
                "rounded-lg border p-3 transition-colors",
                isSelected ? "border-primary/50 bg-primary/5" : "border-border/50",
              )}
            >
              <div
                className="flex items-start gap-3 cursor-pointer"
                onClick={() => onToggleService(service._id)}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleService(service._id)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-medium text-sm">{service.name}</span>
                    <div className="flex items-center gap-2 shrink-0 ml-auto">
                      {showCounter && (
                        <InlineQuantityCounter
                          quantity={quantity}
                          onDecrease={() => onServiceQuantityChange(service._id, quantity - 1)}
                          onIncrease={() => onServiceQuantityChange(service._id, quantity + 1)}
                        />
                      )}
                      <span className="text-primary text-sm font-semibold whitespace-nowrap">
                        +{formatServiceRateLabel(service)}
                      </span>
                    </div>
                  </div>
                  {service.description ? (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{service.description}</p>
                  ) : null}
                  <Badge variant="secondary" className="text-[10px] mt-1 capitalize">
                    {service.category}
                  </Badge>
                </div>
              </div>

              {isSelected && isExtraDriver && (
                <div
                  className="mt-2.5 ml-7 space-y-2.5 border-t border-border/40 pt-2.5"
                  onClick={(event) => event.stopPropagation()}
                >
                  {extraDriverNames.map((name, index) => (
                    <div key={index} className="space-y-1">
                      <Label htmlFor={`extra-driver-name-${index}`} className="text-xs">
                        Driver {index + 1} — Full name *
                      </Label>
                      <Input
                        id={`extra-driver-name-${index}`}
                        value={name}
                        onChange={(event) => onExtraDriverNameChange(index, event.target.value)}
                        placeholder="Enter full name"
                        className="h-9"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );

  if (embedded) {
    return (
      <div className="space-y-2">
        <Label className="text-xs">Additional Services</Label>
        {serviceList}
      </div>
    );
  }

  return (
    <BookingDetailCard>
      <BookingDetailCardHeader>
        <SectionTitle icon={<Shield className="h-4 w-4" />} title="Additional Services" />
      </BookingDetailCardHeader>
      <BookingDetailCardContent>{serviceList}</BookingDetailCardContent>
    </BookingDetailCard>
  );
});
