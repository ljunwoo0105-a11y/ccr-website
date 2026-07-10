// ---------------------------------------------------------------------------
// Diagnostics loader — per-device wizard content behind dynamic import()
// so the prose ships as five tiny chunks, not inside the heavy 3D bundle.
// Dev builds validate the graph on load; production trusts the build gate
// (scripts/validate-bay-content.ts runs before next build).
// ---------------------------------------------------------------------------

import type { DeviceId } from "../rig-data";
import type { DeviceDiagnostics } from "./types";

const LOADERS: Record<
  DeviceId,
  () => Promise<{ default: DeviceDiagnostics }>
> = {
  phone: () => import("./phone"),
  tablet: () => import("./tablet"),
  laptop: () => import("./laptop"),
  watch: () => import("./watch"),
  drone: () => import("./drone"),
};

export async function loadDiagnostics(
  id: DeviceId,
): Promise<DeviceDiagnostics> {
  const mod = await LOADERS[id]();
  if (process.env.NODE_ENV !== "production") {
    const [{ validateDiagnostics }, { getDevice }, { BOARD_ICS }] =
      await Promise.all([
        import("./validate"),
        import("../rig-data"),
        import("../board-data"),
      ]);
    validateDiagnostics(
      mod.default,
      getDevice(id),
      BOARD_ICS.map((ic) => ic.id),
    );
  }
  return mod.default;
}
