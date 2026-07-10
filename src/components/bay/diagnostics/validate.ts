// ---------------------------------------------------------------------------
// Pure validators for the bay content — shared by the dev-time assert in
// diagnostics/index.ts and the build-gating scripts/validate-bay-content.ts.
// Every throw names the device / node / field so a failure is actionable.
// ---------------------------------------------------------------------------

import type { DeviceDef, PartDef } from "../rig-data";
import type { BoardIc } from "../board-data";
import type { DeviceDiagnostics, DiagNode } from "./types";

const MAX_DEPTH = 5;

function fail(msg: string): never {
  throw new Error(`[bay-content] ${msg}`);
}

/** Validate one device's wizard graph against its parts + the board ICs. */
export function validateDiagnostics(
  diag: DeviceDiagnostics,
  device: DeviceDef,
  boardIcIds: readonly string[],
): void {
  const d = diag.device;
  const partIds = new Set(device.parts.map((p) => p.id));
  const nodes = diag.nodes as Record<string, DiagNode>;
  const nodeIds = new Set(Object.keys(nodes));

  // 1. every symptom.start and option.next resolves to a node
  for (const s of diag.symptoms) {
    if (!nodeIds.has(s.start))
      fail(`${d}: symptom "${s.id}" start "${s.start}" is not a node`);
  }
  for (const [id, node] of Object.entries(nodes)) {
    if (node.kind !== "question") continue;
    if (node.options.length < 2 || node.options.length > 4)
      fail(`${d}: node "${id}" has ${node.options.length} options (need 2–4)`);
    const optIds = new Set<string>();
    for (const o of node.options) {
      if (optIds.has(o.id)) fail(`${d}: node "${id}" duplicate option id "${o.id}"`);
      optIds.add(o.id);
      if (!nodeIds.has(o.next))
        fail(`${d}: node "${id}" option "${o.id}" → missing node "${o.next}"`);
    }
    for (const p of node.focusParts ?? []) {
      if (!partIds.has(p))
        fail(`${d}: node "${id}" focusParts references missing part "${p}"`);
    }
  }

  // 2+3. reachability from symptom starts, cycle & depth check per path
  const reached = new Set<string>();
  const walk = (id: string, path: string[]): void => {
    if (path.includes(id))
      fail(`${d}: cycle detected: ${[...path, id].join(" → ")}`);
    if (path.length > MAX_DEPTH)
      fail(`${d}: path deeper than ${MAX_DEPTH}: ${[...path, id].join(" → ")}`);
    reached.add(id);
    const node = nodes[id];
    if (node.kind === "question")
      for (const o of node.options) walk(o.next, [...path, id]);
  };
  for (const s of diag.symptoms) walk(s.start, []);
  for (const id of nodeIds) {
    if (!reached.has(id)) fail(`${d}: node "${id}" unreachable from any symptom`);
  }

  // 4+5+6. verdict integrity
  for (const [id, node] of Object.entries(nodes)) {
    if (node.kind !== "verdict") continue;
    if (node.suspects.length < 1 || node.suspects.length > 4)
      fail(`${d}: verdict "${id}" has ${node.suspects.length} suspects (need 1–4)`);
    if (node.suspects[0].likelihood !== "primary")
      fail(`${d}: verdict "${id}" first suspect must be "primary"`);
    for (const s of node.suspects) {
      for (const p of s.partIds) {
        if (!partIds.has(p))
          fail(`${d}: verdict "${id}" suspect references missing part "${p}"`);
      }
    }
    for (const link of node.relatedIcs ?? []) {
      if (!boardIcIds.includes(link.icId))
        fail(`${d}: verdict "${id}" references missing board IC "${link.icId}"`);
    }
  }
}

// -- geometry helpers for AABB checks ----------------------------------------

function shapeExtents(p: PartDef): [number, number, number] {
  const s = p.shape;
  switch (s.kind) {
    case "box":
      return [s.size[0], s.size[1], s.size[2]];
    case "cyl": {
      const r = Math.max(s.rTop, s.rBot);
      return [2 * r, s.h, 2 * r];
    }
    case "torus": {
      const e = 2 * (s.r + s.tube);
      return [e, e, 2 * s.tube];
    }
    case "capsule": {
      const e = 2 * s.r;
      return [e, s.len + 2 * s.r, e];
    }
  }
}

interface Aabb {
  min: [number, number, number];
  max: [number, number, number];
}

function explodedAabb(p: PartDef): Aabb {
  // Conservative: rotation ignored, so use the max extent on every axis for
  // rotated parts. Good enough for an overlap WARNING.
  const ext = shapeExtents(p);
  const e = p.rotation ? Math.max(...ext) : 0;
  const half: [number, number, number] = p.rotation
    ? [e / 2, e / 2, e / 2]
    : [ext[0] / 2, ext[1] / 2, ext[2] / 2];
  const c = [
    p.position[0] + p.explode[0],
    p.position[1] + p.explode[1],
    p.position[2] + p.explode[2],
  ];
  return {
    min: [c[0] - half[0], c[1] - half[1], c[2] - half[2]],
    max: [c[0] + half[0], c[1] + half[1], c[2] + half[2]],
  };
}

function overlaps(a: Aabb, b: Aabb): boolean {
  return (
    a.min[0] < b.max[0] &&
    a.max[0] > b.min[0] &&
    a.min[1] < b.max[1] &&
    a.max[1] > b.min[1] &&
    a.min[2] < b.max[2] &&
    a.max[2] > b.min[2]
  );
}

/** Validate a device's part list. Returns non-fatal warnings. */
export function validateDevice(device: DeviceDef): string[] {
  const warnings: string[] = [];
  const ids = new Set<string>();
  const indexes = new Set<string>();
  for (const p of device.parts) {
    if (ids.has(p.id)) fail(`${device.id}: duplicate part id "${p.id}"`);
    ids.add(p.id);
    if (indexes.has(p.index))
      fail(`${device.id}: duplicate part index "${p.index}"`);
    indexes.add(p.index);
    if (p.faults.length < 1)
      fail(`${device.id}: part "${p.id}" has no faults content`);
  }
  // sequential index check (presentation nicety — hard error keeps BOM tidy)
  const nums = device.parts.map((p) => Number(p.index.split("-")[1]));
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] !== i + 1)
      fail(
        `${device.id}: part index "${device.parts[i].index}" out of sequence (expected ${i + 1})`,
      );
  }
  // exploded AABB overlap — warning only (conservative test)
  const boxes = device.parts.map((p) => ({ id: p.id, box: explodedAabb(p) }));
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      if (overlaps(boxes[i].box, boxes[j].box))
        warnings.push(
          `${device.id}: exploded AABBs overlap: "${boxes[i].id}" ↔ "${boxes[j].id}"`,
        );
    }
  }
  return warnings;
}

const BOARD_W = 7.2;
const BOARD_D = 4.7;
const IC_CLEARANCE = 0.15;

/** Validate the board IC set: unique keys, in-bounds, pairwise clearance. */
export function validateBoard(
  ics: readonly BoardIc[],
  deviceParts: ReadonlyMap<string, ReadonlySet<string>>,
): void {
  const ids = new Set<string>();
  const refs = new Set<string>();
  for (const ic of ics) {
    if (ids.has(ic.id)) fail(`board: duplicate IC id "${ic.id}"`);
    ids.add(ic.id);
    if (refs.has(ic.ref)) fail(`board: duplicate IC ref "${ic.ref}"`);
    refs.add(ic.ref);
    if (
      Math.abs(ic.x) + ic.w / 2 > BOARD_W / 2 - 0.3 ||
      Math.abs(ic.z) + ic.d / 2 > BOARD_D / 2 - 0.3
    )
      fail(`board: IC "${ic.id}" outside board margins`);
    for (const r of ic.related ?? []) {
      const parts = deviceParts.get(r.device);
      if (!parts) fail(`board: IC "${ic.id}" related unknown device "${r.device}"`);
      if (!parts.has(r.partId))
        fail(`board: IC "${ic.id}" related missing part ${r.device}/${r.partId}`);
    }
  }
  for (let i = 0; i < ics.length; i++) {
    for (let j = i + 1; j < ics.length; j++) {
      const a = ics[i];
      const b = ics[j];
      const gapX = Math.abs(a.x - b.x) - (a.w + b.w) / 2;
      const gapZ = Math.abs(a.z - b.z) - (a.d + b.d) / 2;
      if (Math.max(gapX, gapZ) < IC_CLEARANCE)
        fail(
          `board: ICs "${a.id}" and "${b.id}" closer than ${IC_CLEARANCE} (gapX ${gapX.toFixed(2)}, gapZ ${gapZ.toFixed(2)})`,
        );
    }
  }
}
