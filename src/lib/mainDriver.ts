import type { MainDriverCheckInDetail, User } from "@/types/index.ts";
import { EMAIL_ERROR, isValidEmail } from "@/lib/email.ts";
import { LICENSE_EXPIRY_ERROR, isLicenseExpiryAfterReturnDate } from "@/lib/licenseExpiry.ts";
import { LICENSE_NUMBER_ERROR, isValidLicenseNumber } from "@/lib/licenseNumber.ts";
import { DRIVER_AGE_ERROR, isDriverAtLeast18 } from "@/lib/driverAge.ts";

export function buildMainDriverCheckInForm(customer?: Pick<User, "name" | "email" | "phone"> | null): MainDriverCheckInDetail {
  return {
    fullLegalName: customer?.name?.trim() ?? "",
    dateOfBirth: "",
    phoneNumber: customer?.phone?.trim() ?? "",
    emailAddress: customer?.email?.trim() ?? "",
    homeAddressLine1: "",
    homeAddressLine2: "",
    homeAddressLine3: "",
    licenseNumber: "",
    issuingProvince: "",
    licenseExpiryDate: "",
    policyNo: "",
  };
}

export function validateMainDriverCheckInDetails(
  mainDriver: MainDriverCheckInDetail,
  returnDate?: string | Date | null,
): string | null {
  if (!mainDriver.fullLegalName.trim()) return "Main driver: full legal name is required";
  if (!mainDriver.dateOfBirth.trim()) return "Main driver: date of birth is required";
  if (!isDriverAtLeast18(mainDriver.dateOfBirth)) return DRIVER_AGE_ERROR;
  if (!mainDriver.phoneNumber.trim()) return "Main driver: phone number is required";
  const email = mainDriver.emailAddress.trim();
  if (!email) return "Main driver: email address is required";
  if (!isValidEmail(email)) return EMAIL_ERROR;
  if (!mainDriver.homeAddressLine1.trim()) return "Main driver: home address is required";
  if (!isValidLicenseNumber(mainDriver.licenseNumber)) return LICENSE_NUMBER_ERROR;
  if (!mainDriver.issuingProvince.trim()) return "Main driver: issuing province is required";
  if (!mainDriver.licenseExpiryDate.trim()) return "Main driver: license expiry date is required";
  if (!isLicenseExpiryAfterReturnDate(mainDriver.licenseExpiryDate, returnDate)) {
    return LICENSE_EXPIRY_ERROR;
  }
  return null;
}
