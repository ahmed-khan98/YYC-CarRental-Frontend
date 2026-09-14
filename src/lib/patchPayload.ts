/** PATCH updates: send empty string so cleared optional text fields persist in the DB. */
export function patchText(value: string | null | undefined): string {
  return (value ?? "").trim();
}

/** PATCH updates: send null so cleared optional numeric fields are removed in the DB. */
export function patchOptionalNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const raw = typeof value === "string" ? value.trim() : value;
  if (raw === "") return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

/** PATCH updates: send [] when a comma-separated optional list is cleared. */
export function patchStringList(value: string | null | undefined): string[] {
  if (!(value ?? "").trim()) return [];
  return value!.split(",").map((part) => part.trim()).filter(Boolean);
}
