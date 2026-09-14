import type { FuelLevel } from "@/types/index.ts";

export const FUEL_LEVELS = ["empty", "quarter", "half", "three_quarter", "full"] as const;

export const FUEL_LABELS: Record<FuelLevel, string> = {
  empty: "Empty",
  quarter: "1/4 Tank",
  half: "1/2 Tank",
  three_quarter: "3/4 Tank",
  full: "Full Tank",
};

const FUEL_ALIASES: Record<string, FuelLevel> = {
  empty: "empty",
  "0": "empty",
  quarter: "quarter",
  "1/4": "quarter",
  "1/4_tank": "quarter",
  quarter_tank: "quarter",
  half: "half",
  "1/2": "half",
  "1/2_tank": "half",
  half_tank: "half",
  three_quarter: "three_quarter",
  "3/4": "three_quarter",
  "3/4_tank": "three_quarter",
  three_quarter_tank: "three_quarter",
  full: "full",
  full_tank: "full",
  fulltank: "full",
};

export function normalizeFuelLevel(value: unknown): FuelLevel | null {
  if (value == null) return null;
  const key = String(value)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return FUEL_ALIASES[key] ?? null;
}

export function areFuelLevelsEqual(left: unknown, right: unknown): boolean {
  const a = normalizeFuelLevel(left);
  const b = normalizeFuelLevel(right);
  return Boolean(a && b && a === b);
}

export function buildFuelChargeDescription(checkIn: unknown, checkOut: unknown): string {
  const from = normalizeFuelLevel(checkIn);
  const to = normalizeFuelLevel(checkOut);
  if (!from || !to) return "";
  return `Check-in ${FUEL_LABELS[from]} to Check-out ${FUEL_LABELS[to]}`;
}

export type FuelChargeDraftLike = {
  title?: string;
  description?: string;
  autoFuel?: boolean;
};

export function isAutoFuelChargeDraft(charge: FuelChargeDraftLike): boolean {
  if (charge.autoFuel) return true;
  if (!/fuel/i.test(charge.title ?? "")) return false;
  return /check-in/i.test(charge.description ?? "");
}

export function syncAutoFuelChargeDrafts<T extends FuelChargeDraftLike>(
  drafts: T[],
  checkIn: unknown,
  checkOut: unknown,
): T[] {
  if (areFuelLevelsEqual(checkIn, checkOut)) {
    return drafts.filter((draft) => !isAutoFuelChargeDraft(draft));
  }

  const description = buildFuelChargeDescription(checkIn, checkOut);
  if (!description) return drafts;

  return drafts.map((draft) =>
    isAutoFuelChargeDraft(draft) && draft.description !== description
      ? { ...draft, description }
      : draft,
  );
}
