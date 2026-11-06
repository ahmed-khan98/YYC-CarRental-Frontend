type NamedService = {
  name?: string | null;
};

export function isUnlimitedMileageService(service: NamedService) {
  const name = String(service?.name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");

  return /\bunlimited mileage\b/.test(name);
}
