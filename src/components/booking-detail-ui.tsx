import type { ReactNode } from "react";
import type { Car } from "@/types/index.ts";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent, CardHeader } from "@/components/ui/card.tsx";
import { cn } from "@/lib/utils.ts";
import { formatCarName } from "@/lib/displayName.ts";
import { resolveMediaUrl } from "@/lib/mediaUrl.ts";
import { Car as CarIcon } from "lucide-react";

export function BookingDetailCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("border-border/50 bg-card/60 py-0 gap-0", className)}>
      {children}
    </Card>
  );
}

export function BookingDetailCardHeader({ children }: { children: ReactNode }) {
  return <CardHeader className="px-3 pb-2 pt-3.5 sm:px-5 sm:pt-4">{children}</CardHeader>;
}

export function BookingDetailCardContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <CardContent className={cn("px-3 pb-3.5 pt-0 sm:px-5 sm:pb-5", className)}>{children}</CardContent>;
}

export function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="p-1 bg-primary/10 rounded-md text-primary shrink-0">{icon}</div>
      <h2 className="font-semibold text-sm">{title}</h2>
    </div>
  );
}

export function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-3 py-2 sm:gap-4 sm:py-2.5 border-b border-border/30 last:border-0">
      <span className="text-[13px] sm:text-sm text-muted-foreground shrink-0 max-w-[46%]">{label}</span>
      <span className="min-w-0 text-[13px] sm:text-sm font-medium text-right break-words">{value}</span>
    </div>
  );
}

export function BookingVehicleCard({
  car,
  imageUrl,
  extraImageUrls,
}: {
  car: Car;
  imageUrl?: string;
  extraImageUrls?: string[];
}) {
  return (
    <BookingDetailCard>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {imageUrl ? (
            <img
              src={resolveMediaUrl(imageUrl)}
              alt={formatCarName(car, { includeYear: false })}
              className="w-20 h-[4.5rem] object-cover rounded-lg shrink-0 border border-border/30 bg-background"
            />
          ) : (
            <div className="w-20 h-[4.5rem] bg-muted rounded-lg flex items-center justify-center shrink-0 border border-border/30">
              <CarIcon className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-bold leading-tight">
              {formatCarName(car)}
            </h1>
            <p className="text-sm text-muted-foreground capitalize mt-0.5">
              {car.category} · {car.color} · {car.transmission}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <Badge variant="outline" className="text-[10px]">
                {car.seats} seats
              </Badge>
              <Badge variant="outline" className="text-[10px] capitalize">
                {car.fuelType}
              </Badge>
              <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
                ${car.dailyRate}/day
              </Badge>
              {car.dailyMileageLimit ? (
                <Badge variant="outline" className="text-[10px]">
                  {car.dailyMileageLimit} km/day
                </Badge>
              ) : null}
              {car.licensePlate && (
                <Badge variant="outline" className="font-mono text-[10px]">
                  {car.licensePlate}
                </Badge>
              )}
            </div>
          </div>
        </div>
        {extraImageUrls && extraImageUrls.length > 0 && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-border/30 overflow-x-auto">
            {extraImageUrls.map((url, i) => (
              <a key={url} href={resolveMediaUrl(url)} target="_blank" rel="noopener noreferrer">
                <img
                  src={resolveMediaUrl(url)}
                  alt={`Vehicle photo ${i + 2}`}
                  className="h-14 w-20 object-cover rounded-md shrink-0 border border-border/30 hover:opacity-80 transition-opacity"
                />
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </BookingDetailCard>
  );
}
