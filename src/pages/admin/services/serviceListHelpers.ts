import type { ServiceCategory, ServiceChargeType } from "@/types/index.ts";

export interface SvcForm {
  name: string;
  description: string;
  dailyRate: string;
  chargeType: ServiceChargeType;
  category: ServiceCategory;
  allowQuantity: boolean;
}

export const EMPTY_SVC_FORM: SvcForm = {
  name: "",
  description: "",
  dailyRate: "",
  chargeType: "per_day",
  category: "equipment",
  allowQuantity: false,
};

export const CATEGORY_BADGE: Record<string, string> = {
  equipment: "bg-blue-50 text-blue-700 border-blue-200",
  driver: "bg-violet-50 text-violet-700 border-violet-200",
  insurance: "bg-amber-50 text-amber-800 border-amber-200",
  other: "bg-slate-50 text-slate-700 border-slate-200",
};

export function truncateWords(text: string, maxWords = 8) {
  if (!text) return "—";
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return `${words.slice(0, maxWords).join(" ")}...`;
}
