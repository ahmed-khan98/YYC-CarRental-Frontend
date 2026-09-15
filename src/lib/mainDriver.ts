import type { MainDriverCheckInDetail, User } from "@/types/index.ts";

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

export function validateMainDriverCheckInDetails(mainDriver: MainDriverCheckInDetail): string | null {
  if (!mainDriver.fullLegalName.trim()) return "Main driver: full legal name is required";
  if (!mainDriver.dateOfBirth.trim()) return "Main driver: date of birth is required";
  if (!mainDriver.phoneNumber.trim()) return "Main driver: phone number is required";
  const email = mainDriver.emailAddress.trim();
  if (!email) return "Main driver: email address is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return "Main driver: enter a valid email address";
  }
  if (!mainDriver.homeAddressLine1.trim()) return "Main driver: home address is required";
  if (!mainDriver.licenseNumber.trim()) return "Main driver: license number is required";
  if (!mainDriver.issuingProvince.trim()) return "Main driver: issuing province is required";
  if (!mainDriver.licenseExpiryDate.trim()) return "Main driver: license expiry date is required";
  return null;
}
