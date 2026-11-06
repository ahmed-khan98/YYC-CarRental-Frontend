export const DEFAULT_PRE_AUTHORIZED_AMOUNT = 800;

export type AppConfig = {
  preAuthorizedAmount: number;
};

export function resolvePreAuthorizedAmount(snapshot?: number | null) {
  const amount = Number(snapshot);
  return Number.isFinite(amount) && amount > 0
    ? Math.round(amount * 100) / 100
    : DEFAULT_PRE_AUTHORIZED_AMOUNT;
}
