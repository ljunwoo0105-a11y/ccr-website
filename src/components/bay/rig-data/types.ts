// ---------------------------------------------------------------------------
// Manifold Teardown Bay — procedural device definitions.
//
// Every device the shop repairs is modelled from primitives (no external
// assets) as a stack of PARTS. A part is one selectable unit in the bay: it
// has an assembled position, an explode vector (where it flies to at full
// teardown), a BOM index, and the real-world faults CCR repairs on it.
// Decorations are non-interactive geometry that rides along with a part
// (chips on a board, lenses on a camera, keycaps on a deck).
// ---------------------------------------------------------------------------

export type Vec3 = [number, number, number];

export type Shape =
  | { kind: "box"; size: Vec3; radius?: number }
  | {
      kind: "cyl";
      rTop: number;
      rBot: number;
      h: number;
      seg?: number;
    }
  | { kind: "torus"; r: number; tube: number; arc?: number }
  | { kind: "capsule"; r: number; len: number };

export type MaterialKey =
  | "housing" // bone-aluminium unibody
  | "housingDark" // dark composite shells
  | "glass" // smoke display glass
  | "screen" // panel stack (emissive off-black)
  | "pcb" // carbon substrate
  | "chip" // silicon packages
  | "battery" // graphite cell
  | "copper" // coils, heatpipes
  | "flex" // signal-orange flex cables
  | "shield" // RF cans, brackets
  | "rubber" // gaskets, feet, props
  | "signal"; // safety-orange accent parts

export interface Deco {
  shape: Shape;
  material: MaterialKey;
  position: Vec3;
  rotation?: Vec3;
  /** Repeat this deco as an instanced grid (keycaps, battery ribs, vents). */
  grid?: { rows: number; cols: number; pitchX: number; pitchZ: number };
  /** Continuously spin around a local axis — props, fans. */
  spin?: "x" | "y" | "z";
}

export interface PartDef {
  id: string;
  /** BOM index stamped on the callout — "P-04". */
  index: string;
  name: string;
  role: string;
  faults: string[];
  material: MaterialKey;
  shape: Shape;
  position: Vec3;
  rotation?: Vec3;
  /** World-space offset applied at explode=1. */
  explode: Vec3;
  decos?: Deco[];
}

export interface DeviceDef {
  id: "phone" | "tablet" | "laptop" | "watch" | "drone";
  label: string;
  designation: string;
  /** Camera distance tuned per device. */
  camZ: number;
  /** Resting tilt of the whole rig group. */
  baseTilt: Vec3;
  parts: PartDef[];
}


export type DeviceId = DeviceDef["id"];
