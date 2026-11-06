import type { Car, CarCategory } from "@/types/index.ts";

export type Transmission = Car["transmission"];
export type FuelType = Car["fuelType"];

export interface CarForm {
  make: string;
  model: string;
  year: string;
  category: CarCategory;
  color: string;
  licensePlate: string;
  vin: string;
  dailyRate: string;
  dailyMileageLimit: string;
  chargePerExtraKm: string;
  seats: string;
  transmission: Transmission;
  fuelType: FuelType;
  mileage: string;
  description: string;
  features: string;
}

export const EMPTY_FORM: CarForm = {
  make: "",
  model: "",
  year: "",
  category: "sedan",
  color: "",
  licensePlate: "",
  vin: "",
  dailyRate: "",
  dailyMileageLimit: "",
  chargePerExtraKm: "",
  seats: "5",
  transmission: "automatic",
  fuelType: "gasoline",
  mileage: "",
  description: "",
  features: "",
};

export type CarFormErrors = Partial<Record<keyof CarForm, string>>;

export const REQUIRED_TEXT_FIELDS: { key: keyof CarForm; label: string }[] = [
  { key: "make", label: "Make" },
  { key: "model", label: "Model" },
  { key: "color", label: "Color" },
  { key: "licensePlate", label: "License plate" },
  { key: "vin", label: "VIN" },
];

export const REQUIRED_NUMBER_FIELDS: { key: keyof CarForm; label: string }[] = [
  { key: "year", label: "Year" },
  { key: "dailyRate", label: "Daily rate" },
  { key: "dailyMileageLimit", label: "Daily mileage limit" },
  { key: "chargePerExtraKm", label: "Charge per extra km" },
  { key: "seats", label: "Seats" },
  { key: "mileage", label: "Mileage" },
];

export const FUEL_TYPE_OPTIONS = ["gasoline", "diesel", "electric", "hybrid"] as const;

export function validateCarForm(form: CarForm): { errors: CarFormErrors; firstMessage: string | null } {
  const errors: CarFormErrors = {};
  for (const { key, label } of REQUIRED_TEXT_FIELDS) {
    if (!String(form[key] ?? "").trim()) errors[key] = `${label} is required`;
  }
  if (!form.category) errors.category = "Category is required";
  if (!form.transmission) errors.transmission = "Transmission is required";
  if (!form.fuelType) errors.fuelType = "Fuel type is required";
  for (const { key, label } of REQUIRED_NUMBER_FIELDS) {
    const raw = String(form[key] ?? "").trim();
    if (!raw) errors[key] = `${label} is required`;
    else if (!Number.isFinite(Number(raw))) errors[key] = `${label} must be a valid number`;
    else if (Number(raw) < 0) errors[key] = `${label} cannot be negative`;
  }
  return { errors, firstMessage: Object.values(errors)[0] ?? null };
}
