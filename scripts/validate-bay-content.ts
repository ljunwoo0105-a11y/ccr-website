// ---------------------------------------------------------------------------
// Build gate for the Teardown Bay content: every diagnostics suspect/node/IC
// reference must resolve, graphs must be acyclic and reachable, board ICs
// must not collide. Runs via `npm run validate:bay` (chained into `build`).
// ---------------------------------------------------------------------------

import { DEVICES, getDevice } from "../src/components/bay/rig-data";
import { BOARD_ICS } from "../src/components/bay/board-data";
import {
  validateBoard,
  validateDevice,
  validateDiagnostics,
} from "../src/components/bay/diagnostics/validate";
import type { DeviceDiagnostics } from "../src/components/bay/diagnostics/types";

import PHONE_DIAGNOSTICS from "../src/components/bay/diagnostics/phone";
import TABLET_DIAGNOSTICS from "../src/components/bay/diagnostics/tablet";
import LAPTOP_DIAGNOSTICS from "../src/components/bay/diagnostics/laptop";
import WATCH_DIAGNOSTICS from "../src/components/bay/diagnostics/watch";
import DRONE_DIAGNOSTICS from "../src/components/bay/diagnostics/drone";

const ALL_DIAGNOSTICS: DeviceDiagnostics[] = [
  PHONE_DIAGNOSTICS,
  TABLET_DIAGNOSTICS,
  LAPTOP_DIAGNOSTICS,
  WATCH_DIAGNOSTICS,
  DRONE_DIAGNOSTICS,
];

let warnings = 0;

try {
  // Devices: unique ids/indexes, sequential BOM, exploded-AABB overlap warnings
  for (const device of DEVICES) {
    for (const w of validateDevice(device)) {
      console.warn(`  WARN ${w}`);
      warnings++;
    }
  }

  // Board: unique keys, margins, pairwise clearance, related-part existence
  const partSets = new Map(
    DEVICES.map((d) => [d.id as string, new Set(d.parts.map((p) => p.id))]),
  );
  validateBoard(BOARD_ICS, partSets);

  // Diagnostics: per-device graph integrity
  const icIds = BOARD_ICS.map((ic) => ic.id);
  for (const diag of ALL_DIAGNOSTICS) {
    validateDiagnostics(diag, getDevice(diag.device), icIds);
  }
} catch (err) {
  console.error(String(err instanceof Error ? err.message : err));
  process.exit(1);
}

const parts = DEVICES.reduce((n, d) => n + d.parts.length, 0);
const nodes = ALL_DIAGNOSTICS.reduce(
  (n, d) => n + Object.keys(d.nodes).length,
  0,
);
console.log(
  `bay content OK — ${DEVICES.length} devices, ${parts} parts, ${nodes} wizard nodes, ${BOARD_ICS.length} board ICs${warnings ? `, ${warnings} warning(s)` : ""}`,
);
