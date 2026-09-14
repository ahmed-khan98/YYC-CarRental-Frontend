/** Display names as Title Case: "ahmed khan" → "Ahmed Khan". */
export function toTitleCase(value?: string | null) {
  const text = value?.trim() ?? "";
  if (!text) return "";
  return text.replace(/\S+/g, (word) => {
    if (/^\d+$/.test(word)) return word;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

export function formatDisplayName(value?: string | null, fallback = "—") {
  return toTitleCase(value) || fallback;
}

export function formatCarName(
  car?: { year?: number | string; make?: string; model?: string } | null,
  options?: { includeYear?: boolean },
) {
  if (!car) return "—";
  const includeYear = options?.includeYear !== false;
  const parts = [
    includeYear && car.year != null && String(car.year).trim() ? String(car.year) : "",
    toTitleCase(car.make),
    toTitleCase(car.model),
  ].filter(Boolean);
  return parts.join(" ") || "—";
}
