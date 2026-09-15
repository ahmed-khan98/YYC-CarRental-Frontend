import type { ReactNode } from "react";
import type { Booking, BookingActorInfo, VehicleInspection } from "@/types/index.ts";
import { formatAppDateTime } from "@/lib/timeFormat.ts";
import { inspectionMediaUrls, resolveMediaUrl } from "@/lib/mediaUrl.ts";
import { BookingActorValue } from "@/components/booking-actor-value.tsx";
import { SignedCheckInPdfLink } from "@/components/signed-check-in-pdf-link.tsx";
import { InspectionMediaGallery } from "@/components/inspection-media.tsx";
import { CustomerVisibilityToggle } from "@/components/check-in-out.tsx";
import {
  LogIn,
  LogOut,
  Gauge,
  Fuel,
  FileText,
  Camera,
  Users,
  UserRound,
} from "lucide-react";

const FUEL_LABELS: Record<string, string> = {
  empty: "Empty",
  quarter: "1/4 Tank",
  half: "1/2 Tank",
  three_quarter: "3/4 Tank",
  full: "Full Tank",
};

function DriverField({
  label,
  value,
  className,
}: {
  label: string;
  value?: string | null;
  className?: string;
}) {
  if (!value) return null;
  return (
    <div className={className ? `min-w-0 ${className}` : "min-w-0"}>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-xs font-medium leading-snug break-words">{value}</p>
    </div>
  );
}

function DriverLicenseCard({
  licenseImageUrl,
  licenseAlt,
  children,
}: {
  licenseImageUrl?: string;
  licenseAlt: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border/30 bg-background/50 p-2.5 text-xs">
      <div className="flex flex-col gap-2.5">
        {licenseImageUrl && (
          <a
            href={resolveMediaUrl(licenseImageUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <img
              src={resolveMediaUrl(licenseImageUrl)}
              alt={licenseAlt}
              className="h-36 w-full rounded-md border border-border/30 object-contain bg-background hover:opacity-80 sm:h-40"
            />
          </a>
        )}
        <div className="min-w-0 grid grid-cols-2 gap-x-2 gap-y-2">{children}</div>
      </div>
    </div>
  );
}

function InspectionRecordCard({
  inspection,
  booking,
  performedBy,
}: {
  inspection: VehicleInspection;
  booking?: Booking;
  performedBy?: BookingActorInfo | null;
}) {
  const isCheckIn = inspection.type === "check_in";
  const mediaUrls = inspectionMediaUrls(inspection);
  const visible = isCheckIn
    ? booking?.checkInVisibleToUser ?? false
    : booking?.checkOutVisibleToUser ?? false;

  return (
    <div className="rounded-xl border border-border/40 bg-muted/20 p-2.5 sm:p-4 space-y-2.5 h-full w-full">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`p-1.5 rounded-lg shrink-0 ${
              isCheckIn ? "bg-primary/10 text-primary" : "bg-blue-500/10 text-blue-400"
            }`}
          >
            {isCheckIn ? <LogIn className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm">
              {isCheckIn ? "Check-In (Pickup)" : "Check-Out (Return)"}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatAppDateTime(inspection._creationTime)}
            </p>
            {(inspection.performedBy ?? performedBy) && (
              <div className="mt-1">
                <BookingActorValue
                  actor={inspection.performedBy ?? performedBy}
                  compact
                  className="items-start text-left"
                />
              </div>
            )}
          </div>
        </div>
        {booking && (
          <CustomerVisibilityToggle
            bookingId={booking._id}
            type={isCheckIn ? "check_in" : "check_out"}
            checked={visible}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <div className="bg-background/50 rounded-lg px-2.5 py-2 border border-border/30">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
            <Gauge className="h-3 w-3" /> Mileage
          </div>
          <p className="text-sm font-semibold">{inspection.mileage.toLocaleString()} km</p>
        </div>
        <div className="bg-background/50 rounded-lg px-2.5 py-2 border border-border/30">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
            <Fuel className="h-3 w-3" /> Fuel Level
          </div>
          <p className="text-sm font-semibold">
            {FUEL_LABELS[inspection.fuelLevel] ?? inspection.fuelLevel}
          </p>
        </div>
      </div>

      {isCheckIn && inspection.mainDriver && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <UserRound className="h-3.5 w-3.5" />
            <span>Main Driver</span>
          </div>
          <DriverLicenseCard
            licenseImageUrl={inspection.mainDriver.licenseImageUrl}
            licenseAlt="Main driver license"
          >
            <DriverField label="Name" value={inspection.mainDriver.fullLegalName} />
            <DriverField label="DOB" value={inspection.mainDriver.dateOfBirth} />
            <DriverField label="Phone" value={inspection.mainDriver.phoneNumber} />
            <DriverField label="Email" value={inspection.mainDriver.emailAddress} />
            <DriverField
              className="col-span-2"
              label="Address"
              value={[
                inspection.mainDriver.homeAddressLine1,
                inspection.mainDriver.homeAddressLine2,
                inspection.mainDriver.homeAddressLine3,
              ]
                .filter(Boolean)
                .join(", ")}
            />
            <DriverField label="License" value={inspection.mainDriver.licenseNumber} />
            <DriverField
              label="Issued / expires"
              value={`${inspection.mainDriver.issuingProvince} · ${inspection.mainDriver.licenseExpiryDate}`}
            />
            <DriverField label="Policy" value={inspection.mainDriver.policyNo} />
          </DriverLicenseCard>
        </div>
      )}

      {isCheckIn && inspection.extraDrivers && inspection.extraDrivers.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>Extra Drivers ({inspection.extraDrivers.length})</span>
          </div>
          <div className="space-y-2">
            {inspection.extraDrivers.map((driver, index) => (
              <DriverLicenseCard
                key={`${driver.licenseNumber}-${index}`}
                licenseImageUrl={driver.licenseImageUrl}
                licenseAlt={`${driver.fullName} license`}
              >
                <DriverField label={`Driver ${index + 1}`} value={driver.fullName} />
                <DriverField label="License" value={driver.licenseNumber} />
                <DriverField label="Expires" value={driver.licenseExpiryDate} />
                <DriverField label="Country" value={driver.countryOfIssue} />
              </DriverLicenseCard>
            ))}
          </div>
        </div>
      )}

      {inspection.notes && (
        <div className="flex items-start gap-2 text-sm">
          <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <span className="text-muted-foreground">{inspection.notes}</span>
        </div>
      )}

      <SignedCheckInPdfLink inspectionId={inspection._id}>
        {isCheckIn ? "View check-in agreement (PDF)" : "View check-out agreement (PDF)"}
      </SignedCheckInPdfLink>

      {mediaUrls.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Camera className="h-3.5 w-3.5" />
            <span>Condition media ({mediaUrls.length})</span>
          </div>
          <InspectionMediaGallery
            urls={mediaUrls}
            altPrefix={isCheckIn ? "Check-in" : "Check-out"}
            gridClassName="grid-cols-4 sm:grid-cols-5 gap-1"
            thumbClassName="h-14 w-full aspect-auto object-cover rounded-md"
          />
        </div>
      )}
    </div>
  );
}

function InspectionPlaceholder({
  type,
}: {
  type: "check_in" | "check_out";
}) {
  const isCheckIn = type === "check_in";

  return (
    <div className="rounded-xl border border-dashed border-border/50 bg-muted/10 p-4 space-y-3 h-full w-full min-h-[180px]">
      <div className="flex items-start gap-2">
        <div className="p-1.5 rounded-lg shrink-0 bg-muted/40 text-muted-foreground">
          {isCheckIn ? <LogIn className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-muted-foreground">
            {isCheckIn ? "Check-In (Pickup)" : "Check-Out (Return)"}
          </p>
          <p className="text-xs text-muted-foreground">
            {isCheckIn ? "Not recorded yet" : "Pending check-out"}
          </p>
        </div>
      </div>
    </div>
  );
}

export function pickLatestInspection(
  inspections: VehicleInspection[] | undefined,
  type: "check_in" | "check_out",
) {
  return inspections
    ?.filter((inspection) => inspection.type === type)
    .slice()
    .sort((a, b) => (b._creationTime ?? 0) - (a._creationTime ?? 0))[0];
}

type InspectionHistoryGridProps = {
  checkIn?: VehicleInspection | null;
  checkOut?: VehicleInspection | null;
  showCheckIn?: boolean;
  showCheckOut?: boolean;
  /** When set, shows customer visibility toggles on each column (admin). */
  booking?: Booking;
  checkInPerformedBy?: BookingActorInfo | null;
  checkOutPerformedBy?: BookingActorInfo | null;
};

export function InspectionHistoryGrid({
  checkIn,
  checkOut,
  showCheckIn = true,
  showCheckOut = true,
  booking,
  checkInPerformedBy,
  checkOutPerformedBy,
}: InspectionHistoryGridProps) {
  const adminMode = Boolean(booking);
  const displayCheckIn = adminMode || showCheckIn;
  const displayCheckOut = adminMode || showCheckOut;

  if (!displayCheckIn && !displayCheckOut) return null;

  const twoColumns = displayCheckIn && displayCheckOut;

  return (
    <div
      className={`grid gap-4 items-stretch ${
        twoColumns ? "grid-cols-1 sm:grid-cols-2 sm:[grid-template-columns:minmax(0,1fr)_minmax(0,1fr)]" : "grid-cols-1"
      }`}
    >
      {displayCheckIn && (
        <div className="min-w-0 w-full h-full">
          {checkIn ? (
            <InspectionRecordCard
              inspection={checkIn}
              booking={booking}
              performedBy={checkInPerformedBy}
            />
          ) : (
            <InspectionPlaceholder type="check_in" />
          )}
        </div>
      )}
      {displayCheckOut && (
        <div className="min-w-0 w-full h-full">
          {checkOut ? (
            <InspectionRecordCard
              inspection={checkOut}
              booking={booking}
              performedBy={checkOutPerformedBy}
            />
          ) : (
            <InspectionPlaceholder type="check_out" />
          )}
        </div>
      )}
    </div>
  );
}
