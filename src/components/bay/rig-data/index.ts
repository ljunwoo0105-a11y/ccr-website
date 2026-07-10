// Barrel for the Teardown Bay device definitions. DeviceBay imports from
// "./rig-data" — unchanged by the per-device file split.

export type {
  Vec3,
  Shape,
  MaterialKey,
  Deco,
  PartDef,
  DeviceDef,
  DeviceId,
} from "./types";
export type { PhonePartId } from "./phone";
export type { TabletPartId } from "./tablet";
export type { LaptopPartId } from "./laptop";
export type { WatchPartId } from "./watch";
export type { DronePartId } from "./drone";

import type { DeviceDef } from "./types";
import { PHONE } from "./phone";
import { TABLET } from "./tablet";
import { LAPTOP } from "./laptop";
import { WATCH } from "./watch";
import { DRONE } from "./drone";

export const DEVICES: DeviceDef[] = [PHONE, TABLET, LAPTOP, WATCH, DRONE];

export function getDevice(id: DeviceDef["id"]): DeviceDef {
  return DEVICES.find((d) => d.id === id) ?? DEVICES[0];
}
