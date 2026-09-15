import { useState, useRef, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { inspectionsApi } from "@/api/inspections.api.ts";
import { bookingsApi } from "@/api/bookings.api.ts";
import { carsApi } from "@/api/cars.api.ts";
import { uploadFile, uploadFiles } from "@/api/upload.api.ts";
import { CarMediaCapture } from "@/components/car-media-capture.tsx";
import { LicenseImageCapture } from "@/components/license-image-capture.tsx";
import { getApiErrorMessage } from "@/api/client.ts";
import { resolveMediaUrl } from "@/lib/mediaUrl.ts";
import type { Booking, ExtraDriverCheckInDetail, FuelLevel, MainDriverCheckInDetail } from "@/types/index.ts";
import { calculateExtraMileageBilling } from "@/lib/extraMileage.ts";
import { calculateRentalDays, formatMoney } from "@/lib/rentalPricing.ts";
import { SECURITY_DEPOSIT_AMOUNT } from "@/lib/securityDeposit.ts";
import { computeBillSummary, getBillEntryTotals, projectCheckoutBalance } from "@/lib/billing.ts";
import {
  FUEL_LABELS,
  FUEL_LEVELS,
  areFuelLevelsEqual,
  buildFuelChargeDescription,
  isAutoFuelChargeDraft,
  normalizeFuelLevel,
  syncAutoFuelChargeDrafts,
} from "@/lib/fuelLevel.ts";
import {
  buildExtraDriverCheckInForms,
  getBookingExtraDriverCount,
  validateExtraDriverCheckInDetails,
} from "@/lib/extraDriver.ts";
import {
  buildMainDriverCheckInForm,
  validateMainDriverCheckInDetails,
} from "@/lib/mainDriver.ts";
import { Button } from "@/components/ui/button.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { SignaturePad } from "@/components/signature-pad.tsx";
import { AgreementPdfPreview } from "@/components/agreement-pdf-preview.tsx";
import { toast } from "sonner";
import { LogIn, LogOut, SlidersHorizontal, Eye, EyeOff, Users, UserRound, Plus, Trash2, Loader2 } from "lucide-react";
import { Hint } from "@/components/ui/tooltip.tsx";

async function withUploadWakeLock<T>(run: () => Promise<T>): Promise<T> {
  let lock: WakeLockSentinel | null = null;
  try {
    lock = (await navigator.wakeLock?.request("screen")) ?? null;
  } catch {
    // Older phones may not support keeping the screen awake.
  }
  try {
    return await run();
  } finally {
    await lock?.release().catch(() => {});
  }
}

function InspectionUploadOverlay({ open, label }: { open: boolean; label: string }) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background/85 px-6 text-center backdrop-blur-[2px]">
      <Loader2 className="h-9 w-9 animate-spin text-primary" />
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-xs text-muted-foreground">
        Photos and videos are uploading. Keep this screen open until it finishes.
      </p>
    </div>
  );
}

function invalidateAfterInspectionChange(
  queryClient: QueryClient,
  bookingId: string,
  carId?: string,
) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["inspections", bookingId] }),
    queryClient.invalidateQueries({ queryKey: ["bookings", bookingId, "detail"] }),
    queryClient.invalidateQueries({ queryKey: ["bookings"], exact: true }),
    queryClient.invalidateQueries({ queryKey: ["bookings", "admin"] }),
    carId ? queryClient.invalidateQueries({ queryKey: ["cars", carId] }) : Promise.resolve(),
  ]);
}

type LicenseImageDraft = {
  file: File | null;
  previewUrl: string;
};

const EMPTY_LICENSE_IMAGE: LicenseImageDraft = { file: null, previewUrl: "" };

function revokeLicensePreview(image: LicenseImageDraft) {
  if (image.previewUrl.startsWith("blob:")) URL.revokeObjectURL(image.previewUrl);
}

type CheckoutChargeDraft = {
  id: string;
  title: string;
  amount: number;
  description?: string;
  autoFuel?: boolean;
};

function clampPaidAmount(raw: string, maxAmount: number) {
  if (raw.trim() === "") return "";
  const amount = Number(raw);
  if (!Number.isFinite(amount)) return raw;
  if (amount < 0) return "0";
  const cap = Math.round(Number(maxAmount || 0) * 100) / 100;
  if (cap > 0 && amount > cap) return String(cap);
  return raw;
}

function formatDefaultPaidAmount(amount: number) {
  const rounded = Math.round(Number(amount || 0) * 100) / 100;
  if (rounded <= 0) return "";
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

function CheckInDialog({
  open,
  onClose,
  booking,
}: {
  open: boolean;
  onClose: () => void;
  booking: Booking;
}) {
  const queryClient = useQueryClient();
  const createInspection = useMutation({
    mutationFn: inspectionsApi.create,
  });
  const updateBooking = useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: string; status: Booking["status"] }) =>
      bookingsApi.updateStatus(bookingId, { status }),
  });

  const [activeTab, setActiveTab] = useState<"form" | "signature">("form");
  const [formCompleted, setFormCompleted] = useState(false);
  const [mileage, setMileage] = useState("");
  const [fuelLevel, setFuelLevel] = useState<FuelLevel>("full");
  const [notes, setNotes] = useState("");
  const [carMediaFiles, setCarMediaFiles] = useState<File[]>([]);
  const [carMediaPreparing, setCarMediaPreparing] = useState(false);
  const carMediaFilesRef = useRef(carMediaFiles);
  carMediaFilesRef.current = carMediaFiles;
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfLoadError, setPdfLoadError] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDescription, setPaymentDescription] = useState("");
  const [extraDrivers, setExtraDrivers] = useState<ExtraDriverCheckInDetail[]>([]);
  const [mainDriver, setMainDriver] = useState<MainDriverCheckInDetail>(() => buildMainDriverCheckInForm());
  const [mainLicenseImage, setMainLicenseImage] = useState<LicenseImageDraft>(EMPTY_LICENSE_IMAGE);
  const [extraLicenseImages, setExtraLicenseImages] = useState<LicenseImageDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingLabel, setSavingLabel] = useState("Saving...");
  const mainDriverPrefilledRef = useRef(false);
  const paymentAmountDirtyRef = useRef(false);
  const mainLicenseImageRef = useRef(mainLicenseImage);
  const extraLicenseImagesRef = useRef(extraLicenseImages);
  mainLicenseImageRef.current = mainLicenseImage;
  extraLicenseImagesRef.current = extraLicenseImages;

  const extraDriverCount = useMemo(() => getBookingExtraDriverCount(booking), [booking]);

  const { data: detail } = useQuery({
    queryKey: ["bookings", booking._id, "detail"],
    queryFn: () => bookingsApi.getDetailById(booking._id),
    enabled: open,
  });
  const checkInBill = useMemo(() => {
    const entries = detail?.billEntries ?? booking.billEntries ?? [];
    if (entries.length > 0) return computeBillSummary(entries);
    const total = Number(booking.totalAmount) || 0;
    return {
      chargeSubtotal: total,
      taxAmount: 0,
      totalBill: total,
      totalPaid: 0,
      totalUnpaid: total,
    };
  }, [booking.billEntries, booking.totalAmount, detail?.billEntries]);

  const customer = detail?.user;

  const resetState = () => {
    setActiveTab("form");
    setFormCompleted(false);
    setMileage("");
    setFuelLevel("full");
    setNotes("");
    setCarMediaFiles([]);
    setCarMediaPreparing(false);
    setSignatureDataUrl(null);
    setPdfPreviewUrl(null);
    setPdfLoadError(false);
    paymentAmountDirtyRef.current = false;
    setPaymentAmount("");
    setPaymentDescription("");
    setExtraDrivers([]);
    setMainDriver(buildMainDriverCheckInForm());
    revokeLicensePreview(mainLicenseImageRef.current);
    extraLicenseImagesRef.current.forEach(revokeLicensePreview);
    setMainLicenseImage(EMPTY_LICENSE_IMAGE);
    setExtraLicenseImages([]);
  };

  useEffect(() => {
    if (!open) {
      mainDriverPrefilledRef.current = false;
      resetState();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const count = getBookingExtraDriverCount(booking);
    setExtraDrivers((current) => {
      if (current.length === count && count > 0) return current;
      return count > 0 ? buildExtraDriverCheckInForms(booking, count) : [];
    });
    setExtraLicenseImages((current) => {
      if (current.length === count) return current;
      return count > 0
        ? Array.from({ length: count }, (_, index) => current[index] ?? { ...EMPTY_LICENSE_IMAGE })
        : [];
    });
  }, [open, booking._id, extraDriverCount]);

  useEffect(() => {
    if (!open || !customer || mainDriverPrefilledRef.current) return;
    setMainDriver(buildMainDriverCheckInForm(customer));
    mainDriverPrefilledRef.current = true;
  }, [open, customer]);

  useEffect(() => {
    if (!open) return;
    if (!paymentAmountDirtyRef.current) {
      setPaymentAmount(formatDefaultPaidAmount(checkInBill.totalBill));
      return;
    }
    setPaymentAmount((current) => clampPaidAmount(current, checkInBill.totalBill));
  }, [open, checkInBill.totalBill]);

  const updateMainDriverField = (
    field: keyof MainDriverCheckInDetail,
    value: string,
  ) => {
    setMainDriver((current) => ({ ...current, [field]: value }));
  };

  const updateExtraDriverField = (
    index: number,
    field: keyof ExtraDriverCheckInDetail,
    value: string,
  ) => {
    setExtraDrivers((current) =>
      current.map((driver, driverIndex) =>
        driverIndex === index ? { ...driver, [field]: value } : driver,
      ),
    );
  };

  const setMainLicenseFile = (file: File) => {
    setMainLicenseImage((current) => {
      revokeLicensePreview(current);
      return { file, previewUrl: URL.createObjectURL(file) };
    });
  };

  const clearMainLicenseFile = () => {
    setMainLicenseImage((current) => {
      revokeLicensePreview(current);
      return EMPTY_LICENSE_IMAGE;
    });
  };

  const setExtraLicenseFile = (index: number, file: File) => {
    setExtraLicenseImages((current) =>
      current.map((image, imageIndex) => {
        if (imageIndex !== index) return image;
        revokeLicensePreview(image);
        return { file, previewUrl: URL.createObjectURL(file) };
      }),
    );
  };

  const clearExtraLicenseFile = (index: number) => {
    setExtraLicenseImages((current) =>
      current.map((image, imageIndex) => {
        if (imageIndex !== index) return image;
        revokeLicensePreview(image);
        return EMPTY_LICENSE_IMAGE;
      }),
    );
  };

  useEffect(() => {
    if (!open || activeTab !== "signature") return;

    let objectUrl: string | null = null;
    const controller = new AbortController();

    // Drop any revoked/stale blob so the iframe unmounts and loading UI shows on re-entry.
    setPdfPreviewUrl(null);
    setPdfLoadError(false);

    async function loadPdf() {
      try {
        const blob = await inspectionsApi.fetchCheckInTermsPdf(
          booking._id,
          {
            mainDriver: {
              fullLegalName: mainDriver.fullLegalName.trim(),
              dateOfBirth: mainDriver.dateOfBirth.trim(),
              phoneNumber: mainDriver.phoneNumber.trim(),
              emailAddress: mainDriver.emailAddress.trim(),
              homeAddressLine1: mainDriver.homeAddressLine1.trim(),
              licenseNumber: mainDriver.licenseNumber.trim(),
              issuingProvince: mainDriver.issuingProvince.trim(),
              licenseExpiryDate: mainDriver.licenseExpiryDate.trim(),
              policyNo: mainDriver.policyNo.trim(),
            },
            mileage: Number(mileage),
            fuelLevel,
            notes: notes || undefined,
            extraDrivers: extraDrivers.map((driver) => ({
              fullName: driver.fullName.trim(),
              licenseNumber: driver.licenseNumber.trim(),
              licenseExpiryDate: driver.licenseExpiryDate.trim(),
              countryOfIssue: driver.countryOfIssue.trim(),
            })),
            paymentAmount: paymentAmount ? Number(paymentAmount) : undefined,
          },
          controller.signal,
        );
        if (controller.signal.aborted) return;
        const namedPdf = blob instanceof File
          ? blob
          : new File([blob], `check-in-agreement-${booking._id}.pdf`, { type: "application/pdf" });
        objectUrl = URL.createObjectURL(namedPdf);
        setPdfPreviewUrl(objectUrl);
      } catch (error) {
        if (controller.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) {
          return;
        }
        setPdfLoadError(true);
        toast.error("Failed to load agreement PDF");
      }
    }

    void loadPdf();

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setPdfPreviewUrl(null);
    };
  }, [open, activeTab, booking._id, mainDriver, mileage, fuelLevel, notes, extraDrivers, paymentAmount]);

  const validateCheckInForm = () => {
    if (carMediaPreparing) return "Please wait — photos are still being prepared";
    if (!mileage) return "Please enter mileage";
    const mainDriverError = validateMainDriverCheckInDetails(mainDriver);
    if (mainDriverError) return mainDriverError;
    const driverError = validateExtraDriverCheckInDetails(
      extraDriverCount,
      extraDrivers,
      extraLicenseImagesRef.current,
    );
    if (driverError) return driverError;
    if (!mainLicenseImageRef.current.file) return "Main driver: license image is required";
    const paid = Number(paymentAmount);
    if (paymentAmount && (!Number.isFinite(paid) || paid < 0)) return "Enter a valid amount paid";
    if (Number.isFinite(paid) && checkInBill.totalBill > 0 && paid > checkInBill.totalBill) {
      return `Amount paid cannot exceed ${formatMoney(checkInBill.totalBill)}`;
    }
    return null;
  };

  const handleContinueToSignature = () => {
    const formError = validateCheckInForm();
    if (formError) {
      toast.error(formError);
      return;
    }
    setActiveTab("signature");
    setFormCompleted(true);
  };

  const handleCompleteCheckIn = async () => {
    if (!signatureDataUrl) {
      toast.error("Please provide a customer signature");
      return;
    }
    const formError = validateCheckInForm();
    if (formError) {
      toast.error(formError);
      setActiveTab("form");
      return;
    }

    setLoading(true);
    setSavingLabel("Uploading photos...");
    try {
      await withUploadWakeLock(async () => {
      let imageUrls: string[] | undefined;
      const vehicleFiles = carMediaFilesRef.current;
      try {
        imageUrls = vehicleFiles.length > 0
          ? await uploadFiles(vehicleFiles, "inspections", (progress) => {
              setSavingLabel(
                `Uploading vehicle file ${progress.fileIndex} of ${progress.fileCount} (${progress.percent}%)`,
              );
            })
          : undefined;
      } catch (error) {
        throw new Error(getApiErrorMessage(error) || "Failed to upload vehicle photos or videos");
      }

      const mainLicenseFile = mainLicenseImageRef.current.file;
      if (!mainLicenseFile) {
        toast.error("Main driver: license image is required");
        return;
      }
      let mainLicenseImageUrl: string;
      let extraLicenseImageUrls: string[] = [];
      try {
        setSavingLabel("Uploading license photos...");
        mainLicenseImageUrl = await uploadFile(mainLicenseFile, "licenses", (progress) => {
          setSavingLabel(`Uploading license photo (${progress.percent}%)`);
        });
        extraLicenseImageUrls = [];
        if (extraDriverCount > 0) {
          for (let index = 0; index < extraDrivers.length; index += 1) {
            const image = extraLicenseImagesRef.current[index];
            if (!image?.file) throw new Error(`Driver ${index + 1}: license image is required`);
            extraLicenseImageUrls.push(
              await uploadFile(image.file, "licenses", (progress) => {
                setSavingLabel(
                  `Uploading extra license ${index + 1} of ${extraDriverCount} (${progress.percent}%)`,
                );
              }),
            );
          }
        }
      } catch (error) {
        throw new Error(getApiErrorMessage(error) || "Failed to upload license images");
      }

      setSavingLabel("Saving check-in...");
      await createInspection.mutateAsync({
        carId: booking.carId,
        bookingId: booking._id,
        type: "check_in",
        mileage: Number(mileage),
        fuelLevel,
        notes: notes || undefined,
        imageUrls: imageUrls?.map((url) => resolveMediaUrl(url)).filter(Boolean),
        signatureDataUrl,
        mainDriver: {
          fullLegalName: mainDriver.fullLegalName.trim(),
          dateOfBirth: mainDriver.dateOfBirth.trim(),
          phoneNumber: mainDriver.phoneNumber.trim(),
          emailAddress: mainDriver.emailAddress.trim(),
          homeAddressLine1: mainDriver.homeAddressLine1.trim(),
          licenseNumber: mainDriver.licenseNumber.trim(),
          issuingProvince: mainDriver.issuingProvince.trim(),
          licenseExpiryDate: mainDriver.licenseExpiryDate.trim(),
          policyNo: mainDriver.policyNo.trim(),
          licenseImageUrl: resolveMediaUrl(mainLicenseImageUrl),
        },
        extraDrivers: extraDriverCount > 0
          ? extraDrivers.map((driver, index) => ({
              fullName: driver.fullName.trim(),
              licenseNumber: driver.licenseNumber.trim(),
              licenseExpiryDate: driver.licenseExpiryDate.trim(),
              countryOfIssue: driver.countryOfIssue.trim(),
              licenseImageUrl: resolveMediaUrl(extraLicenseImageUrls[index]),
            }))
          : undefined,
        paymentEntry: paymentAmount
          ? {
              amount: Number(paymentAmount),
              title: "Check-In Payment",
              description: paymentDescription.trim() || undefined,
            }
          : undefined,
      });

      await updateBooking.mutateAsync({ bookingId: booking._id, status: "checked_in" });
      await invalidateAfterInspectionChange(queryClient, booking._id, booking.carId);
      toast.success("Check-in completed with signed agreement");
      onClose();
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error) || "Failed to complete check-in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (nextOpen || loading) return; onClose(); }}>
      <DialogContent
        dismissible={false}
        className="flex w-[calc(100vw-1rem)] max-w-4xl flex-col gap-0 overflow-hidden p-0 max-h-[min(92vh,880px)]"
      >
        <InspectionUploadOverlay open={loading} label={savingLabel} />
        <DialogHeader className="shrink-0 px-4 pt-5 pb-3 sm:px-6 sm:pt-6">
          <DialogTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5 text-primary" />
            Check In — Vehicle Pickup
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-6">
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            if (v === "signature" && !formCompleted) return;
            setActiveTab(v as "form" | "signature");
          }}
        >
          <TabsList className="w-full">
            <TabsTrigger value="form" className="flex-1 cursor-pointer">1. Check-In Form</TabsTrigger>
            <TabsTrigger value="signature" className="flex-1 cursor-pointer" disabled={!formCompleted}>
              2. Terms & Signature
            </TabsTrigger>
          </TabsList>

          <TabsContent value="form" forceMount className="space-y-4 mt-4 pb-4 data-[state=inactive]:hidden">
            <p className="text-sm text-muted-foreground">
              Admin: record vehicle condition at pickup. The customer will sign the agreement on the next step.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Current Mileage (km) *</Label>
                <Input type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} placeholder="e.g. 45000" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Fuel Level</Label>
                <Select value={fuelLevel} onValueChange={(v) => setFuelLevel(v as FuelLevel)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["empty", "quarter", "half", "three_quarter", "full"] as const).map((f) => (
                      <SelectItem key={f} value={f} className="capitalize">{f.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-3 rounded-lg border border-border/50 bg-muted/20 p-3">
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Main Driver Details</p>
                  <p className="text-[11px] text-muted-foreground">
                    Primary renter who made this booking — all fields required
                  </p>
                </div>
              </div>
              <div className="space-y-3 rounded-lg border border-border/40 bg-background/70 p-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Full Legal Name *</Label>
                  <Input
                    value={mainDriver.fullLegalName}
                    onChange={(e) => updateMainDriverField("fullLegalName", e.target.value)}
                    placeholder="Full legal name"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Date of Birth *</Label>
                    <Input
                      type="date"
                      value={mainDriver.dateOfBirth}
                      onChange={(e) => updateMainDriverField("dateOfBirth", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Phone Number *</Label>
                    <Input
                      type="tel"
                      value={mainDriver.phoneNumber}
                      onChange={(e) => updateMainDriverField("phoneNumber", e.target.value)}
                      placeholder="Phone number"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email Address *</Label>
                  <Input
                    type="email"
                    value={mainDriver.emailAddress}
                    onChange={(e) => updateMainDriverField("emailAddress", e.target.value)}
                    placeholder="Email address"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Home Address *</Label>
                  <Input
                    value={mainDriver.homeAddressLine1}
                    onChange={(e) => updateMainDriverField("homeAddressLine1", e.target.value)}
                    placeholder="Home address"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Driver&apos;s License No. *</Label>
                  <Input
                    value={mainDriver.licenseNumber}
                    onChange={(e) => updateMainDriverField("licenseNumber", e.target.value)}
                    placeholder="License number"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Issuing Province *</Label>
                    <Input
                      value={mainDriver.issuingProvince}
                      onChange={(e) => updateMainDriverField("issuingProvince", e.target.value)}
                      placeholder="e.g. Alberta"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Expiry Date *</Label>
                    <Input
                      type="date"
                      value={mainDriver.licenseExpiryDate}
                      onChange={(e) => updateMainDriverField("licenseExpiryDate", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Policy No.</Label>
                  <Input
                    value={mainDriver.policyNo}
                    onChange={(e) => updateMainDriverField("policyNo", e.target.value)}
                    placeholder="If applicable"
                  />
                </div>
                <LicenseImageCapture
                  id="main-driver-license"
                  label="License Image"
                  previewUrl={mainLicenseImage.previewUrl}
                  onSelect={setMainLicenseFile}
                  onClear={clearMainLicenseFile}
                />
              </div>
            </div>
            {extraDriverCount > 0 && (
              <div className="space-y-3 rounded-lg border border-border/50 bg-muted/20 p-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Extra Driver Details</p>
                    <p className="text-[11px] text-muted-foreground">
                      {extraDriverCount} driver{extraDriverCount !== 1 ? "s" : ""} on this booking — all fields required
                    </p>
                  </div>
                </div>
                {extraDrivers.map((driver, index) => (
                  <div
                    key={index}
                    className="space-y-3 rounded-lg border border-border/40 bg-background/70 p-3"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Driver {index + 1}
                    </p>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Full Name *</Label>
                      <Input
                        value={driver.fullName}
                        onChange={(e) => updateExtraDriverField(index, "fullName", e.target.value)}
                        placeholder="Driver full name"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">License Number *</Label>
                        <Input
                          value={driver.licenseNumber}
                          onChange={(e) => updateExtraDriverField(index, "licenseNumber", e.target.value)}
                          placeholder="License number"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">License Expiry Date *</Label>
                        <Input
                          type="date"
                          value={driver.licenseExpiryDate}
                          onChange={(e) => updateExtraDriverField(index, "licenseExpiryDate", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Country of Issue *</Label>
                      <Input
                        value={driver.countryOfIssue}
                        onChange={(e) => updateExtraDriverField(index, "countryOfIssue", e.target.value)}
                        placeholder="e.g. Canada"
                      />
                    </div>
                    <LicenseImageCapture
                      id={`extra-driver-license-${index}`}
                      label="License Image"
                      required
                      previewUrl={extraLicenseImages[index]?.previewUrl}
                      onSelect={(file) => setExtraLicenseFile(index, file)}
                      onClear={() => clearExtraLicenseFile(index)}
                    />
                  </div>
                ))}
              </div>
            )}
            <CarMediaCapture
              id="check-in-car-media"
              files={carMediaFiles}
              onChange={setCarMediaFiles}
              onPreparingChange={setCarMediaPreparing}
            />
            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <textarea
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any scratches, damage or notes..."
              />
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-2">
              <p className="text-xs font-medium">Security deposit (pre-authorization)</p>
              <p className="text-[11px] text-muted-foreground">
                A ${SECURITY_DEPOSIT_AMOUNT} hold is placed at check-in. This is separate from the rental payment and is refundable after check-out.
              </p>
              <div className="space-y-1.5">
                <Label className="text-xs">Pre-Authorized Amount</Label>
                <Input
                  value={formatMoney(SECURITY_DEPOSIT_AMOUNT)}
                  readOnly
                  disabled
                  className="bg-muted/40 tabular-nums"
                />
              </div>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-3">
              <p className="text-xs font-medium">Payment received (optional)</p>
              <p className="text-[11px] text-muted-foreground">
                Record any amount the customer paid at check-in (full or partial).
              </p>
              <div className="rounded-lg border border-border/40 bg-background/70 p-3 space-y-1.5 text-xs">
                {checkInBill.taxAmount > 0 && (
                  <>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium tabular-nums">{formatMoney(checkInBill.chargeSubtotal)}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Tax (5%)</span>
                      <span className="font-medium tabular-nums">{formatMoney(checkInBill.taxAmount)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between gap-3">
                  <span className="font-semibold">Total amount</span>
                  <span className="font-bold text-primary tabular-nums">
                    {formatMoney(checkInBill.totalBill)}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Amount paid ($)</Label>
                <Input
                  type="number"
                  min="0"
                  max={checkInBill.totalBill || undefined}
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => {
                    paymentAmountDirtyRef.current = true;
                    setPaymentAmount(clampPaidAmount(e.target.value, checkInBill.totalBill));
                  }}
                  placeholder="e.g. 50.00"
                />
                <p className="text-[11px] text-muted-foreground">
                  Cannot exceed total amount {formatMoney(checkInBill.totalBill)}.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Note</Label>
                <Input
                  value={paymentDescription}
                  onChange={(e) => setPaymentDescription(e.target.value)}
                  placeholder="e.g. 50% deposit"
                />
              </div>
            </div>
            <DialogFooter className="pt-2 pb-1">
              <Button variant="secondary" onClick={onClose} className="cursor-pointer">Cancel</Button>
              <Button onClick={handleContinueToSignature} className="cursor-pointer">
                Continue to Terms & Signature
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="signature" className="space-y-4 mt-4 pb-4">
            <p className="text-sm text-muted-foreground">
              Customer: review the rental agreement below, then sign in the signature pad. Your signature will be added to the agreement.
            </p>

            <AgreementPdfPreview
              url={pdfPreviewUrl}
              filename={`check-in-agreement-${booking._id}.pdf`}
              error={pdfLoadError}
            />

            <SignaturePad onChange={setSignatureDataUrl} />

            <DialogFooter className="pt-2 pb-1">
              <Button variant="secondary" onClick={() => setActiveTab("form")} disabled={loading} className="cursor-pointer">
                Back
              </Button>
              <Button onClick={handleCompleteCheckIn} disabled={loading || !signatureDataUrl} className="cursor-pointer">
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {savingLabel}
                  </span>
                ) : (
                  "Complete Check-In"
                )}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CheckOutDialog({
  open,
  onClose,
  booking,
}: {
  open: boolean;
  onClose: () => void;
  booking: Booking;
}) {
  const queryClient = useQueryClient();
  const { data: car } = useQuery({
    queryKey: ["cars", booking.carId],
    queryFn: () => carsApi.get(booking.carId),
    enabled: open,
  });
  const { data: inspections } = useQuery({
    queryKey: ["inspections", booking._id],
    queryFn: () => inspectionsApi.listByBooking(booking._id),
    enabled: open,
  });
  const { data: detail } = useQuery({
    queryKey: ["bookings", booking._id, "detail"],
    queryFn: () => bookingsApi.getDetailById(booking._id),
    enabled: open,
  });

  const checkInInspection = inspections?.find((insp) => insp.type === "check_in");
  const checkInMileage = checkInInspection?.mileage;
  const checkInFuelLevel = normalizeFuelLevel(checkInInspection?.fuelLevel);
  const dailyMileageLimit = car?.dailyMileageLimit ?? booking.bookedDailyMileageLimit ?? null;
  const chargePerExtraKm = car?.chargePerExtraKm ?? booking.bookedChargePerExtraKm ?? null;
  const rentalDays = useMemo(
    () => calculateRentalDays(
      booking.pickupDate,
      booking.pickupTime ?? "10:00",
      booking.returnDate,
      booking.returnTime ?? "10:00",
    ),
    [booking.pickupDate, booking.pickupTime, booking.returnDate, booking.returnTime],
  );

  const createInspection = useMutation({
    mutationFn: inspectionsApi.create,
  });
  const updateBooking = useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: string; status: Booking["status"] }) =>
      bookingsApi.updateStatus(bookingId, { status }),
  });

  const [mileage, setMileage] = useState("");
  const [fuelLevel, setFuelLevel] = useState<FuelLevel>("full");
  const [notes, setNotes] = useState("");
  const [carMediaFiles, setCarMediaFiles] = useState<File[]>([]);
  const [carMediaPreparing, setCarMediaPreparing] = useState(false);
  const carMediaFilesRef = useRef(carMediaFiles);
  carMediaFilesRef.current = carMediaFiles;
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDescription, setPaymentDescription] = useState("");
  const [chargeDrafts, setChargeDrafts] = useState<CheckoutChargeDraft[]>([]);
  const [showChargeForm, setShowChargeForm] = useState(false);
  const [chargeTitle, setChargeTitle] = useState("");
  const [chargeAmount, setChargeAmount] = useState("");
  const [chargeDescription, setChargeDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingLabel, setSavingLabel] = useState("Saving...");
  const [fuelInitialized, setFuelInitialized] = useState(false);
  const [pendingAutoFuel, setPendingAutoFuel] = useState(false);
  const paymentAmountDirtyRef = useRef(false);
  const fuelLevelChanged = fuelInitialized && Boolean(
    checkInFuelLevel && normalizeFuelLevel(fuelLevel) && !areFuelLevelsEqual(checkInFuelLevel, fuelLevel),
  );
  const hasFuelCharge = chargeDrafts.some((charge) => isAutoFuelChargeDraft(charge) || /fuel/i.test(charge.title));
  const showFuelWarning = fuelLevelChanged && !hasFuelCharge;

  const mileagePreview = useMemo(() => {
    if (!mileage || checkInMileage == null) return null;
    const checkOutMileage = Number(mileage);
    if (Number.isNaN(checkOutMileage) || checkOutMileage < checkInMileage) return null;
    return calculateExtraMileageBilling({
      checkInMileage,
      checkOutMileage,
      dailyMileageLimit,
      chargePerExtraKm,
      rentalDays,
    });
  }, [checkInMileage, chargePerExtraKm, dailyMileageLimit, mileage, rentalDays]);

  const checkoutBalance = useMemo(
    () =>
      projectCheckoutBalance(
        detail?.billEntries ?? [],
        mileagePreview?.extraMileageCharge ?? 0,
        chargeDrafts,
      ),
    [chargeDrafts, detail?.billEntries, mileagePreview?.extraMileageCharge],
  );

  useEffect(() => {
    if (!open) {
      setMileage("");
      setFuelLevel("full");
      setNotes("");
      setCarMediaFiles([]);
      setCarMediaPreparing(false);
      paymentAmountDirtyRef.current = false;
      setPaymentAmount("");
      setPaymentDescription("");
      setChargeDrafts([]);
      setShowChargeForm(false);
      setChargeTitle("");
      setChargeAmount("");
      setChargeDescription("");
      setFuelInitialized(false);
      setPendingAutoFuel(false);
    }
  }, [open]);

  useEffect(() => {
    if (open && checkInFuelLevel) {
      setFuelLevel(checkInFuelLevel);
      setFuelInitialized(true);
    }
  }, [open, checkInFuelLevel]);

  useEffect(() => {
    if (!open || !fuelInitialized) return;

    setChargeDrafts((current) => {
      const next = syncAutoFuelChargeDrafts(current, checkInFuelLevel, fuelLevel);
      return next.length === current.length && next.every((charge, index) => charge === current[index])
        ? current
        : next;
    });

    if (!pendingAutoFuel) return;
    if (areFuelLevelsEqual(checkInFuelLevel, fuelLevel)) {
      setShowChargeForm(false);
      setChargeTitle("");
      setChargeAmount("");
      setChargeDescription("");
      setPendingAutoFuel(false);
      return;
    }
    const description = buildFuelChargeDescription(checkInFuelLevel, fuelLevel);
    if (description) setChargeDescription(description);
  }, [open, fuelInitialized, checkInFuelLevel, fuelLevel, pendingAutoFuel]);

  useEffect(() => {
    if (!open || !detail) return;
    if (!paymentAmountDirtyRef.current) {
      setPaymentAmount(formatDefaultPaidAmount(checkoutBalance.totalUnpaid));
      return;
    }
    setPaymentAmount((current) => clampPaidAmount(current, checkoutBalance.totalUnpaid));
  }, [open, detail, checkoutBalance.totalUnpaid]);

  const resetChargeForm = () => {
    setShowChargeForm(false);
    setChargeTitle("");
    setChargeAmount("");
    setChargeDescription("");
    setPendingAutoFuel(false);
  };

  const addChargeDraft = () => {
    if (!chargeTitle.trim() || !chargeAmount || Number(chargeAmount) <= 0) {
      toast.error("Enter a title and valid amount");
      return;
    }
    const title = chargeTitle.trim();
    const description = chargeDescription.trim() || undefined;
    setChargeDrafts((current) => [
      ...current,
      {
        id: `${Date.now()}-${current.length}`,
        title,
        amount: Number(chargeAmount),
        description,
        autoFuel: pendingAutoFuel || isAutoFuelChargeDraft({ title, description }),
      },
    ]);
    resetChargeForm();
  };

  const startFuelCharge = () => {
    setChargeTitle("Fuel refill");
    setChargeDescription(buildFuelChargeDescription(checkInFuelLevel, fuelLevel));
    setChargeAmount("");
    setPendingAutoFuel(true);
    setShowChargeForm(true);
  };

  const handleSubmit = async () => {
    if (!mileage) {
      toast.error("Please enter mileage");
      return;
    }
    if (checkInMileage != null && Number(mileage) < checkInMileage) {
      toast.error("Check-out mileage cannot be less than check-in mileage");
      return;
    }
    const paid = Number(paymentAmount);
    if (paymentAmount && (!Number.isFinite(paid) || paid < 0)) {
      toast.error("Enter a valid amount paid");
      return;
    }
    if (Number.isFinite(paid) && checkoutBalance.totalUnpaid > 0 && paid > checkoutBalance.totalUnpaid) {
      toast.error(`Amount paid cannot exceed ${formatMoney(checkoutBalance.totalUnpaid)}`);
      return;
    }
    if (carMediaPreparing) {
      toast.error("Please wait — photos are still being prepared");
      return;
    }
    setLoading(true);
    setSavingLabel("Uploading photos...");
    try {
      await withUploadWakeLock(async () => {
      let imageUrls: string[] | undefined;
      const vehicleFiles = carMediaFilesRef.current;
      try {
        imageUrls = vehicleFiles.length > 0
          ? await uploadFiles(vehicleFiles, "inspections", (progress) => {
              setSavingLabel(
                `Uploading vehicle file ${progress.fileIndex} of ${progress.fileCount} (${progress.percent}%)`,
              );
            })
          : undefined;
      } catch (error) {
        throw new Error(getApiErrorMessage(error) || "Failed to upload vehicle photos or videos");
      }
      const checkoutCharges = syncAutoFuelChargeDrafts(chargeDrafts, checkInFuelLevel, fuelLevel);

      setSavingLabel("Saving check-out...");
      const result = await createInspection.mutateAsync({
        carId: booking.carId,
        bookingId: booking._id,
        type: "check_out",
        mileage: Number(mileage),
        fuelLevel,
        notes: notes || undefined,
        imageUrls: imageUrls?.map((url) => resolveMediaUrl(url)).filter(Boolean),
        chargeEntries: checkoutCharges.length
          ? checkoutCharges.map(({ title, amount, description }) => ({
              title,
              amount,
              description,
            }))
          : undefined,
        paymentEntry: paymentAmount
          ? {
              amount: Number(paymentAmount),
              title: "Check-Out Payment",
              description: paymentDescription.trim() || undefined,
            }
          : undefined,
      });

      await updateBooking.mutateAsync({ bookingId: booking._id, status: "checked_out" });
      await invalidateAfterInspectionChange(queryClient, booking._id, booking.carId);
      onClose();
      if (result.mileageBilling?.extraMileageCharge || checkoutCharges.length > 0) {
        const extras = [
          result.mileageBilling?.extraMileageCharge
            ? `extra mileage $${result.mileageBilling.extraMileageCharge.toFixed(2)}`
            : null,
          checkoutCharges.length > 0
            ? `${checkoutCharges.length} billing ${checkoutCharges.length === 1 ? "entry" : "entries"}`
            : null,
        ].filter(Boolean);
        toast.success(`Check-out recorded. Added ${extras.join(" and ")} to the bill.`);
      } else {
        toast.success("Check-out recorded and vehicle mileage updated");
      }
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error) || "Failed to record check-out");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (nextOpen || loading) return; onClose(); }}>
      <DialogContent
        dismissible={false}
        className="flex w-[calc(100vw-1rem)] max-w-4xl flex-col gap-0 overflow-hidden p-0 max-h-[min(92vh,880px)]"
      >
        <InspectionUploadOverlay open={loading} label={savingLabel} />
        <DialogHeader className="shrink-0 px-4 pt-5 pb-3 sm:px-6 sm:pt-6">
          <DialogTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-blue-400" />
            Check Out — Vehicle Return
          </DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-1 sm:px-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Record the vehicle condition and upload photos for this booking.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Current Mileage (km) *</Label>
              <Input type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} placeholder="e.g. 45250" />
              {checkInMileage != null && (
                <p className="text-[11px] text-muted-foreground">
                  Check-in odometer: {checkInMileage.toLocaleString()} km
                </p>
              )}
              {dailyMileageLimit ? (
                <p className="text-[11px] text-muted-foreground">
                  Allowed: {(dailyMileageLimit * rentalDays).toLocaleString()} km ({dailyMileageLimit} km/day × {rentalDays} days)
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Fuel Level</Label>
              <Select value={fuelLevel} onValueChange={(v) => setFuelLevel(v as FuelLevel)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FUEL_LEVELS.map((f) => (
                    <SelectItem key={f} value={f}>{FUEL_LABELS[f]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {checkInFuelLevel && (
                <p className="text-[11px] text-muted-foreground">
                  Check-in fuel: {FUEL_LABELS[checkInFuelLevel]}
                </p>
              )}
            </div>
          </div>
          {showFuelWarning && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
              <p className="text-xs text-amber-800 dark:text-amber-300">
                Fuel level changed ({FUEL_LABELS[checkInFuelLevel!]} → {FUEL_LABELS[fuelLevel]}).
                Add a billing entry to charge for fuel — it is not added automatically.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={startFuelCharge}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add fuel charge
              </Button>
            </div>
          )}
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-3">
            <p className="text-xs font-medium">Additional billing entries</p>
            <p className="text-[11px] text-muted-foreground">
              Add fuel, damage, or other charges now. They will be saved with check-out.
            </p>
            {chargeDrafts.length > 0 && (
              <div className="space-y-2">
                {chargeDrafts.map((charge) => {
                  const totals = getBillEntryTotals(charge.amount);
                  return (
                    <div
                      key={charge.id}
                      className="flex items-start justify-between gap-2 rounded-lg border border-border/40 bg-background px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{charge.title}</p>
                        {charge.description && (
                          <p className="text-[11px] text-muted-foreground">{charge.description}</p>
                        )}
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {formatMoney(charge.amount)} + tax = {formatMoney(totals.totalAmount)}
                        </p>
                      </div>
                      <Hint label="Remove charge">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive cursor-pointer shrink-0"
                          aria-label="Remove charge"
                          onClick={() =>
                            setChargeDrafts((current) => current.filter((item) => item.id !== charge.id))
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </Hint>
                    </div>
                  );
                })}
              </div>
            )}
            {!showChargeForm ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => setShowChargeForm(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add billing entry
              </Button>
            ) : (
              <div className="rounded-lg border border-border/50 p-3 space-y-3 bg-background">
                <div className="space-y-1.5">
                  <Label className="text-xs">Title *</Label>
                  <Input
                    value={chargeTitle}
                    onChange={(e) => setChargeTitle(e.target.value)}
                    placeholder="e.g. Fuel refill"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Description</Label>
                  <Input
                    value={chargeDescription}
                    onChange={(e) => setChargeDescription(e.target.value)}
                    placeholder="Optional details"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Amount ($, before tax) *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={chargeAmount}
                    onChange={(e) => setChargeAmount(e.target.value)}
                    placeholder="0.00"
                  />
                  {chargeAmount && Number(chargeAmount) > 0 && (
                    <p className="text-[11px] text-muted-foreground">
                      Total with 5% tax: {formatMoney(getBillEntryTotals(Number(chargeAmount)).totalAmount)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" size="sm" className="cursor-pointer" onClick={resetChargeForm}>
                    Cancel
                  </Button>
                  <Button type="button" size="sm" className="cursor-pointer" onClick={addChargeDraft}>
                    Add charge
                  </Button>
                </div>
              </div>
            )}
          </div>
          {mileagePreview && (
            <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-xs space-y-1">
              <p className="font-medium">Mileage summary</p>
              <p>Driven: {mileagePreview.totalDrivenKm.toLocaleString()} km</p>
              {dailyMileageLimit ? (
                <p>Allowed: {mileagePreview.allowedMileageKm.toLocaleString()} km</p>
              ) : null}
              {mileagePreview.extraMileageKm > 0 ? (
                <p className="text-primary font-semibold">
                  Extra mileage: {mileagePreview.extraMileageKm.toLocaleString()} km — ${mileagePreview.extraMileageCharge.toFixed(2)} will be added to the bill
                </p>
              ) : (
                <p className="text-muted-foreground">No extra mileage charge</p>
              )}
            </div>
          )}
          <CarMediaCapture
            id="check-out-car-media"
            files={carMediaFiles}
            onChange={setCarMediaFiles}
            onPreparingChange={setCarMediaPreparing}
          />
          <div className="space-y-1.5 pb-1">
            <Label className="text-xs">Notes</Label>
            <textarea
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any scratches, damage or notes..."
            />
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-3">
            <p className="text-xs font-medium">Final payment (optional)</p>
            {detail ? (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-1.5 text-xs">
                <p className="font-medium text-sm">Balance summary</p>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Total paid so far</span>
                  <span className="font-medium text-green-600 tabular-nums">
                    {formatMoney(checkoutBalance.totalPaid)}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Pending balance</span>
                  <span className="font-medium tabular-nums">
                    {formatMoney(checkoutBalance.balanceBeforeExtra)}
                  </span>
                </div>
                {checkoutBalance.extraMileageCharge > 0 && mileagePreview && (
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">
                      Extra mileage
                      {chargePerExtraKm
                        ? ` (${mileagePreview.extraMileageKm} × $${chargePerExtraKm})`
                        : ` (${mileagePreview.extraMileageKm} km)`}
                    </span>
                    <span className="font-medium tabular-nums">
                      {formatMoney(checkoutBalance.extraMileageCharge)}
                    </span>
                  </div>
                )}
                {chargeDrafts
                  .filter((charge) => Number(charge.amount) > 0)
                  .map((charge) => (
                    <div key={charge.id} className="flex justify-between gap-3">
                      <span className="text-muted-foreground min-w-0 truncate">
                        {charge.title.trim() || "Charge"}
                      </span>
                      <span className="font-medium tabular-nums shrink-0">
                        {formatMoney(charge.amount)}
                      </span>
                    </div>
                  ))}
                {checkoutBalance.addedTax > 0 && (
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Tax (5%)</span>
                    <span className="font-medium tabular-nums">
                      {formatMoney(checkoutBalance.addedTax)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between gap-3 pt-1.5 border-t border-border/40">
                  <span className="font-semibold">Total due at check-out</span>
                  <span className="font-bold text-amber-600 tabular-nums">
                    {formatMoney(checkoutBalance.totalUnpaid)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">Loading balance...</p>
            )}
            <p className="text-[11px] text-muted-foreground">
              Record the amount collected from the customer at check-out.
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs">Amount paid ($)</Label>
              <Input
                type="number"
                min="0"
                max={checkoutBalance.totalUnpaid || undefined}
                step="0.01"
                value={paymentAmount}
                onChange={(e) => {
                  paymentAmountDirtyRef.current = true;
                  setPaymentAmount(clampPaidAmount(e.target.value, checkoutBalance.totalUnpaid));
                }}
                placeholder="e.g. 52.50"
              />
              <p className="text-[11px] text-muted-foreground">
                Cannot exceed {formatMoney(checkoutBalance.totalUnpaid)} due at check-out.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Note</Label>
              <Input
                value={paymentDescription}
                onChange={(e) => setPaymentDescription(e.target.value)}
                placeholder="e.g. Final balance"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="shrink-0 gap-2 border-t border-border/50 px-4 py-3 sm:px-6 sm:py-4">
          <Button variant="secondary" onClick={onClose} disabled={loading} className="cursor-pointer">Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="cursor-pointer">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {savingLabel}
              </span>
            ) : (
              "Record Check-Out"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** @deprecated Use CheckInDialog or CheckOutDialog directly */
export function CheckInOutDialog({
  open,
  onClose,
  booking,
  type,
}: {
  open: boolean;
  onClose: () => void;
  booking: Booking;
  type: "check_in" | "check_out";
}) {
  if (type === "check_in") {
    return <CheckInDialog open={open} onClose={onClose} booking={booking} />;
  }
  return <CheckOutDialog open={open} onClose={onClose} booking={booking} />;
}

export function CustomerVisibilityToggle({
  bookingId,
  type,
  checked,
}: {
  bookingId: string;
  type: "check_in" | "check_out";
  checked: boolean;
}) {
  const queryClient = useQueryClient();
  const updateVisibility = useMutation({
    mutationFn: (visible: boolean) =>
      bookingsApi.updateCheckInOutVisibility(
        bookingId,
        type === "check_in" ? { checkInVisibleToUser: visible } : { checkOutVisibleToUser: visible },
      ),
    onSuccess: () => {
      void invalidateAfterInspectionChange(queryClient, bookingId);
      toast.success("Customer visibility updated");
    },
    onError: () => toast.error("Failed to update visibility"),
  });

  const id = `${type}-visible-${bookingId}`;

  return (
    <div className="flex flex-col items-end gap-1 shrink-0">
      <Switch
        id={id}
        checked={checked}
        disabled={updateVisibility.isPending}
        onCheckedChange={(value) => updateVisibility.mutate(value)}
        className="shrink-0"
      />
      <label htmlFor={id} className="text-[10px] text-muted-foreground flex items-center gap-1 cursor-pointer">
        {checked ? (
          <>
            <Eye className="h-3 w-3" />
            Visible
          </>
        ) : (
          <>
            <EyeOff className="h-3 w-3" />
            Hidden
          </>
        )}
      </label>
    </div>
  );
}

/** @deprecated Visibility toggles are inline on check-in/check-out cards. Use AdminCheckInOutActions + InspectionHistoryGrid. */
export function CheckInOutVisibilityControls({ booking }: { booking: Booking }) {
  const queryClient = useQueryClient();
  const updateVisibility = useMutation({
    mutationFn: (data: { checkInVisibleToUser?: boolean; checkOutVisibleToUser?: boolean }) =>
      bookingsApi.updateCheckInOutVisibility(booking._id, data),
    onSuccess: () => {
      void invalidateAfterInspectionChange(queryClient, booking._id);
      toast.success("Customer visibility updated");
    },
    onError: () => toast.error("Failed to update visibility"),
  });

  const rows = [
    {
      id: `check-in-visible-${booking._id}`,
      icon: LogIn,
      title: "Check-In Record",
      checked: booking.checkInVisibleToUser ?? false,
      onCheckedChange: (checked: boolean) => updateVisibility.mutate({ checkInVisibleToUser: checked }),
    },
    {
      id: `check-out-visible-${booking._id}`,
      icon: LogOut,
      title: "Check-Out Record",
      checked: booking.checkOutVisibleToUser ?? false,
      onCheckedChange: (checked: boolean) => updateVisibility.mutate({ checkOutVisibleToUser: checked }),
    },
  ] as const;

  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm">Customer Visibility</p>
            <p className="text-xs text-muted-foreground mt-0.5">Control what the customer sees</p>
          </div>
        </div>
        <div className="shrink-0">
          <AdminCheckInOutActions booking={booking} />
        </div>
      </div>

      <div className="space-y-2.5">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div
              key={row.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-muted/25 px-3.5 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background border border-border/40 text-muted-foreground">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight">{row.title}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    {row.checked ? (
                      <>
                        <Eye className="h-3 w-3" />
                        Visible
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3" />
                        Hidden
                      </>
                    )}
                  </p>
                </div>
              </div>
              <Switch
                id={row.id}
                checked={row.checked}
                disabled={updateVisibility.isPending}
                onCheckedChange={row.onCheckedChange}
                className="shrink-0"
              />
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
        Toggling visibility updates the customer&apos;s booking page in real time.
      </p>
    </div>
  );
}

export function AdminCheckInOutActions({ booking }: { booking: Booking }) {
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {booking.status === "confirmed" && (
          <Button size="sm" className="h-8 text-xs cursor-pointer" onClick={() => setCheckInOpen(true)}>
            <LogIn className="h-3 w-3 mr-1" /> Check In
          </Button>
        )}
        {booking.status === "checked_in" && (
          <Button size="sm" variant="secondary" className="h-8 text-xs cursor-pointer" onClick={() => setCheckOutOpen(true)}>
            <LogOut className="h-3 w-3 mr-1" /> Check Out
          </Button>
        )}
      </div>
      {checkInOpen && (
        <CheckInDialog open={checkInOpen} onClose={() => setCheckInOpen(false)} booking={booking} />
      )}
      {checkOutOpen && (
        <CheckOutDialog open={checkOutOpen} onClose={() => setCheckOutOpen(false)} booking={booking} />
      )}
    </>
  );
}
