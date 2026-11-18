export type AppConfig = {
  preAuthorizedAmount: number;
  userBookingEnabled: boolean;
};

export type PublicAppConfig = {
  userBookingEnabled: boolean;
};

export function resolvePreAuthorizedAmount(snapshot?: number | null) {
  const amount = Number(snapshot);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) / 100 : 0;
}
