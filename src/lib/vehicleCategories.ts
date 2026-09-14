import type { CarCategory } from "@/types/index.ts";

/** Customer-facing vehicle types shown in search & browse filters */
export const VEHICLE_TYPE_OPTIONS = ["sedan", "suv"] as const satisfies readonly CarCategory[];

export type DisplayVehicleCategory = (typeof VEHICLE_TYPE_OPTIONS)[number];

export const VEHICLE_TYPE_FILTER_OPTIONS = ["all", ...VEHICLE_TYPE_OPTIONS] as const;

const DISPLAY_SET = new Set<string>(VEHICLE_TYPE_OPTIONS);

export function isDisplayVehicleCategory(category: string): category is DisplayVehicleCategory {
  return DISPLAY_SET.has(category);
}

export function normalizeVehicleTypeFilter(value: string | null | undefined) {
  if (!value || value === "all") return "all";
  return isDisplayVehicleCategory(value) ? value : "all";
}

export function formatVehicleCategoryLabel(category: string) {
  if (category === "all") return "All";
  if (category === "suv") return "SUV";
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function isCustomerVisibleVehicle(category: string) {
  return isDisplayVehicleCategory(category);
}

/** High-contrast badge styles for car category chips on photo overlays */
export const VEHICLE_CATEGORY_BADGE: Record<DisplayVehicleCategory, string> = {
  sedan: "border-0 bg-blue-600 text-white shadow-md",
  suv: "border-0 bg-amber-600 text-white shadow-md",
};

export function vehicleCategoryBadgeClass(category: string) {
  if (isDisplayVehicleCategory(category)) {
    return VEHICLE_CATEGORY_BADGE[category];
  }
  return "border-0 bg-slate-800 text-white shadow-md";
}
