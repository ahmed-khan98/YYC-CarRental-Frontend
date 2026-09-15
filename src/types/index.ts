export type UserRole = "admin" | "sub_admin" | "customer";

export type CarCategory =
  | "economy"
  | "compact"
  | "sedan"
  | "suv"
  | "luxury"
  | "sports"
  | "van";

export type Transmission = "automatic" | "manual";
export type FuelType = "gasoline" | "diesel" | "electric" | "hybrid";
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "checked_in"
  | "checked_out"
  | "completed"
  | "cancelled";
export type FuelLevel = "empty" | "quarter" | "half" | "three_quarter" | "full";
export type InspectionType = "check_in" | "check_out";
export type MaintenanceStatus = "scheduled" | "in_progress" | "completed";
export type ServiceCategory = "equipment" | "driver" | "insurance" | "other";
export type ServiceChargeType = "per_day" | "per_trip";
export type BillEntryType = "charge" | "payment";
export type BillEntrySource = "system" | "manual";
export type BillEntryStatus = "unpaid" | "paid" | "refund";
export type BillEntryPhase = "check_in" | "check_out" | "post";
export type BillPaidVia = "e_transfer" | "deposit";
export type SecurityDepositStatus = "held" | "partially_used" | "refunded";

export interface BookingActorInfo {
  userId: string;
  name?: string | null;
  role: UserRole;
}

export interface BillEntry {
  _id: string;
  title: string;
  description?: string;
  amount: number;
  entryType: BillEntryType;
  status: BillEntryStatus;
  source: BillEntrySource;
  phase?: BillEntryPhase;
  systemKey?: string;
  createdByUserId?: string;
  createdByName?: string;
  createdByRole?: UserRole;
  createdBy?: BookingActorInfo | null;
  taxAmount?: number;
  totalAmount?: number;
  invoiceNumber?: string;
  invoicePdfUrl?: string;
  paidVia?: BillPaidVia;
  attachmentUrl?: string;
  attachmentName?: string;
  _creationTime: number;
}

export interface SecurityDepositSummary {
  amount: number;
  deductedAmount: number;
  remainingAmount: number;
  refundedAmount?: number | null;
  status: SecurityDepositStatus | null;
  heldAt?: string | null;
  refundedAt?: string | null;
  checkOutAt?: string | null;
  refundAvailableAt?: string | null;
  canRefund: boolean;
  collected: boolean;
}

export interface BillSummary {
  chargeSubtotal: number;
  taxAmount: number;
  totalBill: number;
  totalPaid: number;
  totalUnpaid: number;
}

export interface BillEntryResponse {
  booking: Booking;
  billEntries: BillEntry[];
  billSummary: BillSummary;
  securityDeposit?: SecurityDepositSummary;
}

export interface BookingServiceSnapshot {
  serviceId: string;
  name: string;
  dailyRate: number;
  chargeType?: ServiceChargeType;
  category?: ServiceCategory;
  allowQuantity?: boolean;
  quantity: number;
}

export interface User {
  _id: string;
  name?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
  phone?: string;
  licenseUrl?: string | null;
  licenseVerified?: boolean;
  profileComplete?: boolean;
  _creationTime: number;
}

export interface Car {
  _id: string;
  make: string;
  model: string;
  year: number;
  category: CarCategory;
  color: string;
  licensePlate?: string;
  vin: string;
  dailyRate: number;
  imageUrls?: string[];
  imageUrl?: string;
  seats: number;
  transmission: Transmission;
  fuelType: FuelType;
  isAvailable: boolean;
  locationId?: string;
  mileage?: number | null;
  dailyMileageLimit?: number | null;
  chargePerExtraKm?: number | null;
  features?: string[];
  description?: string;
  _creationTime: number;
}

export interface Location {
  _id: string;
  name: string;
  address: string;
  city: string;
  phone?: string;
  isActive: boolean;
  _creationTime: number;
}

export interface AdditionalService {
  _id: string;
  name: string;
  description?: string;
  dailyRate: number;
  chargeType?: ServiceChargeType;
  category: ServiceCategory;
  allowQuantity?: boolean;
  isActive: boolean;
  _creationTime: number;
}

export interface Booking {
  _id: string;
  userId: string;
  carId: string;
  pickupLocationId: string;
  dropoffLocationId: string;
  pickupDate: string;
  pickupTime?: string;
  returnDate: string;
  returnTime?: string;
  status: BookingStatus;
  totalAmount: number;
  bookedDailyRate?: number;
  bookedDailyMileageLimit?: number;
  bookedChargePerExtraKm?: number;
  serviceSnapshots?: BookingServiceSnapshot[];
  checkInMileage?: number;
  checkOutMileage?: number;
  totalDrivenKm?: number;
  allowedMileageKm?: number;
  extraMileageKm?: number;
  extraMileageCharge?: number;
  additionalServiceIds?: string[];
  serviceQuantities?: Array<{ serviceId: string; quantity: number }>;
  extraDriverCount?: number;
  extraDriverNames?: string[];
  licenseUrl?: string;
  extraDriverLicenseUrl?: string;
  checkInVisibleToUser?: boolean;
  checkOutVisibleToUser?: boolean;
  notes?: string;
  paymentStatus?: "pending" | "paid" | "refunded";
  securityDepositAmount?: number;
  securityDepositStatus?: SecurityDepositStatus;
  securityDepositHeldAt?: string;
  securityDepositRefundedAt?: string;
  securityDepositRefundedAmount?: number;
  cancellationReason?: string;
  cancelledBy?: "user" | "admin";
  cancellationPolicy?: "one_day_fee" | "non_refundable";
  cancellationRefundAmount?: number;
  balanceDue?: number;
  createdByUserId?: string;
  createdByName?: string;
  createdByRole?: UserRole;
  updatedByUserId?: string;
  updatedByName?: string;
  updatedByRole?: "admin" | "sub_admin";
  checkInPerformedByUserId?: string;
  checkInPerformedByName?: string;
  checkInPerformedByRole?: UserRole;
  checkOutPerformedByUserId?: string;
  checkOutPerformedByName?: string;
  checkOutPerformedByRole?: UserRole;
  billEntries?: BillEntry[];
  checkInBillSnapshot?: { capturedAt?: string; entries?: BillEntry[] };
  checkOutBillSnapshot?: { capturedAt?: string; entries?: BillEntry[] };
  inspections?: VehicleInspection[];
  checkIn?: VehicleInspection | null;
  checkOut?: VehicleInspection | null;
  checkInPerformedBy?: BookingActorInfo | null;
  checkOutPerformedBy?: BookingActorInfo | null;
  user?: User | null;
  car?: Pick<
    Car,
    | "_id"
    | "make"
    | "model"
    | "year"
    | "licensePlate"
    | "color"
    | "category"
    | "transmission"
    | "fuelType"
    | "seats"
    | "dailyRate"
    | "imageUrl"
    | "imageUrls"
    | "mileage"
    | "isAvailable"
    | "dailyMileageLimit"
    | "chargePerExtraKm"
  > | null;
  pickupLocation?: Pick<Location, "_id" | "name" | "city"> | null;
  dropoffLocation?: Pick<Location, "_id" | "name" | "city"> | null;
  _creationTime: number;
  _updatedTime?: number;
}

export interface BookingDetail {
  booking: Booking;
  user?: User | null;
  car: Car | null;
  pickupLocation: Location | null;
  dropoffLocation: Location | null;
  services: Array<{
    _id: string;
    name: string;
    dailyRate: number;
    chargeType?: ServiceChargeType;
    category: string;
    allowQuantity?: boolean;
    quantity?: number;
  }>;
  days: number;
  baseAmount: number;
  servicesAmount: number;
  extraMileageCharge?: number;
  totalDrivenKm?: number | null;
  allowedMileageKm?: number | null;
  extraMileageKm?: number | null;
  createdBy?: BookingActorInfo | null;
  updatedBy?: BookingActorInfo | null;
  checkInPerformedBy?: BookingActorInfo | null;
  checkOutPerformedBy?: BookingActorInfo | null;
  billEntries?: BillEntry[];
  billSummary?: BillSummary;
  securityDeposit?: SecurityDepositSummary;
  inspections?: VehicleInspection[];
  checkIn?: VehicleInspection | null;
  checkOut?: VehicleInspection | null;
}

export interface ExtraDriverCheckInDetail {
  fullName: string;
  licenseNumber: string;
  licenseExpiryDate: string;
  countryOfIssue: string;
  licenseImageUrl?: string;
}

export interface MainDriverCheckInDetail {
  fullLegalName: string;
  dateOfBirth: string;
  phoneNumber: string;
  emailAddress: string;
  homeAddressLine1: string;
  homeAddressLine2?: string;
  homeAddressLine3?: string;
  licenseNumber: string;
  issuingProvince: string;
  licenseExpiryDate: string;
  policyNo: string;
  licenseImageUrl?: string;
}

export interface VehicleInspection {
  _id: string;
  bookingId: string;
  carId: string;
  type: InspectionType;
  mileage: number;
  fuelLevel: FuelLevel;
  notes?: string;
  imageUrls?: string[];
  signedPdfUrl?: string;
  paidAmountAtCheckIn?: number;
  securityDepositAmount?: number;
  signatureImageUrl?: string;
  resolvedImageUrls?: string[];
  mainDriver?: MainDriverCheckInDetail;
  extraDrivers?: ExtraDriverCheckInDetail[];
  conductedBy: string;
  performedByUserId?: string;
  performedByName?: string;
  performedByRole?: UserRole;
  performedBy?: BookingActorInfo | null;
  _creationTime: number;
}

export interface Maintenance {
  _id: string;
  carId: string;
  type: string;
  description: string;
  scheduledDate: string;
  completedDate?: string;
  cost?: number;
  status: MaintenanceStatus;
  notes?: string;
  car?: Pick<Car, "_id" | "make" | "model" | "year" | "licensePlate"> | null;
  _creationTime: number;
}

export interface AdminOverviewRecentBooking {
  _id: string;
  pickupDate: string;
  totalAmount: number;
  status: BookingStatus;
  car: Pick<Car, "_id" | "make" | "model" | "year" | "licensePlate"> | null;
}

export interface AdminOverview {
  stats: {
    totalCars: number;
    availableCars: number;
    totalBookings: number;
    pendingBookings: number;
    checkedInBookings: number;
    revenue: number;
    customers: number;
    locations: number;
  };
  recentBookings: AdminOverviewRecentBooking[];
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}
