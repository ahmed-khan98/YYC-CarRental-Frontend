export function serviceAllowsQuantity(service: { allowQuantity?: boolean }) {
  return service.allowQuantity === true;
}

export function getServiceQuantity(
  serviceQuantities: Array<{ serviceId: string; quantity: number }> | undefined,
  serviceId: string,
  fallback = 1,
) {
  const match = serviceQuantities?.find((entry) => entry.serviceId === serviceId);
  return Math.max(1, match?.quantity ?? fallback);
}
