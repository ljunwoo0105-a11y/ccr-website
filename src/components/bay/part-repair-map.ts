// ---------------------------------------------------------------------------
// Bay part → catalog repair mapping.
//
// The teardown bay models generic devices (a phone, a tablet…) while the parts
// catalog is priced per brand/model. The bridge between them is the repair
// TYPE: selecting "Front glass + digitiser" on the phone rig is a Screen
// Replacement, whichever handset the customer actually brings in. Staff see a
// price band for that repair across every model on file.
//
// Parts with no entry here have no directly priced repair (shields, antennas,
// logic boards) — those are bench/inspection work and deliberately show no
// price rather than a misleading one.
// ---------------------------------------------------------------------------

import type { DeviceId } from "./rig-data/types";

/** Catalog deviceType for each bay rig (see DEVICE_TYPES in lib/config). */
export const CATALOG_DEVICE_TYPE: Record<DeviceId, string> = {
  phone: "Phone",
  tablet: "Tablet",
  laptop: "Computer",
  watch: "Watch",
  drone: "Drone",
};

/** partId → catalog repairType, per rig. */
const PART_REPAIR: Record<DeviceId, Readonly<Record<string, string>>> = {
  phone: {
    "front-glass": "Screen Replacement",
    oled: "Screen Replacement",
    "display-flex": "Screen Replacement",
    battery: "Battery Replacement",
    "charge-port": "Charging Port Repair",
    "back-glass": "Back Glass Replacement",
  },
  tablet: {
    digitiser: "Screen Replacement",
    lcd: "Screen Replacement",
    "display-flex": "Screen Replacement",
    "battery-l": "Battery Replacement",
    "battery-r": "Battery Replacement",
    "charge-flex": "Charging Port Repair",
  },
  laptop: {
    battery: "Battery Replacement",
    ssd: "SSD Upgrade 1TB",
    "dc-jack": "Charging Port Repair",
  },
  watch: {
    crystal: "Screen Replacement",
    display: "Screen Replacement",
    battery: "Battery Replacement",
  },
  drone: {
    gimbal: "Gimbal Repair",
    camera: "Gimbal Repair",
    battery: "Battery Replacement",
  },
};

/** The catalog repair a bay part maps to, or null when it is bench work. */
export function repairTypeForPart(
  deviceId: DeviceId,
  partId: string
): string | null {
  return PART_REPAIR[deviceId]?.[partId] ?? null;
}
