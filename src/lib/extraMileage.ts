export type ExtraMileageBilling = {
  totalDrivenKm: number;
  allowedMileageKm: number;
  extraMileageKm: number;
  extraMileageCharge: number;
};

export function calculateExtraMileageBilling({
  checkInMileage,
  checkOutMileage,
  dailyMileageLimit,
  chargePerExtraKm,
  rentalDays,
}: {
  checkInMileage: number;
  checkOutMileage: number;
  dailyMileageLimit?: number | null;
  chargePerExtraKm?: number | null;
  rentalDays: number;
}): ExtraMileageBilling {
  const totalDrivenKm = Math.max(0, checkOutMileage - checkInMileage);
  const limitPerDay = Number(dailyMileageLimit) || 0;
  const rate = Number(chargePerExtraKm) || 0;

  if (limitPerDay <= 0 || rate <= 0 || rentalDays <= 0) {
    return {
      totalDrivenKm,
      allowedMileageKm: limitPerDay > 0 ? Math.round(limitPerDay * rentalDays) : 0,
      extraMileageKm: 0,
      extraMileageCharge: 0,
    };
  }

  const allowedMileageKm = Math.round(limitPerDay * rentalDays);
  const extraMileageKm = Math.max(0, Math.round(totalDrivenKm - allowedMileageKm));
  const extraMileageCharge = Math.round(extraMileageKm * rate * 100) / 100;

  return {
    totalDrivenKm: Math.round(totalDrivenKm),
    allowedMileageKm,
    extraMileageKm,
    extraMileageCharge,
  };
}
