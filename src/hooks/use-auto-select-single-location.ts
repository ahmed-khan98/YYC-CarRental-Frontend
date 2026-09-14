import { useEffect } from "react";
import type { Location } from "@/types/index.ts";

/** When only one location exists, pre-select it for pickup and drop-off. */
export function useAutoSelectSingleLocation(
  locations: Location[] | undefined,
  pickupLocationId: string,
  dropoffLocationId: string,
  onPickupLocationChange: (id: string) => void,
  onDropoffLocationChange: (id: string) => void,
) {
  useEffect(() => {
    if (!locations || locations.length !== 1) return;
    const onlyId = locations[0]._id;
    if (!pickupLocationId) onPickupLocationChange(onlyId);
    if (!dropoffLocationId) onDropoffLocationChange(onlyId);
  }, [
    locations,
    pickupLocationId,
    dropoffLocationId,
    onPickupLocationChange,
    onDropoffLocationChange,
  ]);
}
