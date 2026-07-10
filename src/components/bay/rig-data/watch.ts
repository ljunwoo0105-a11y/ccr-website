import type { DeviceDef, PartDef } from "./types";

/** Compile-time part-id registry — diagnostics suspects reference these. */
export type WatchPartId =
  | "crystal"
  | "display"
  | "gasket"
  | "case"
  | "battery"
  | "taptic"
  | "speaker"
  | "mic"
  | "button"
  | "crown"
  | "antenna"
  | "sip"
  | "charge-coil"
  | "sensor";

interface WatchPart extends PartDef {
  id: WatchPartId;
}
interface WatchDef extends DeviceDef {
  id: "watch";
  parts: WatchPart[];
}

// ---------------------------------------------------------------------------
// UNIT D — WRIST (smart watch)
//
// Face-on: x = width, y = height, z = thickness. Front crystal at +z, the
// sensor / back crystal at -z, internals near z≈0. camZ is only 5.4 so explode
// vectors stay modest — front parts drift +z, the rear cap and coil drift -z,
// interior modules fan out laterally so no two exploded slots collide.
// ---------------------------------------------------------------------------

export const WATCH: WatchDef = {
  id: "watch",
  label: "Watch",
  designation: "UNIT D · WRIST",
  camZ: 5.4,
  baseTilt: [0.05, -0.4, 0],
  parts: [
    {
      id: "crystal",
      index: "W-01",
      name: "Front crystal",
      role: "Curved cover glass over the display",
      faults: ["Cracked crystal", "Deep scratches", "Separated seal"],
      material: "glass",
      shape: { kind: "box", size: [1.35, 1.6, 0.06], radius: 0.28 },
      position: [0, 0, 0.24],
      explode: [0, 0, 1.5],
    },
    {
      id: "display",
      index: "W-02",
      name: "LTPO OLED",
      role: "Always-on panel, laminated to the touch layer",
      faults: ["Black display", "Green tint", "Touch dead zones"],
      material: "screen",
      shape: { kind: "box", size: [1.22, 1.47, 0.05], radius: 0.24 },
      position: [0, 0, 0.17],
      explode: [0, 0, 0.85],
      decos: [
        {
          shape: { kind: "box", size: [1.06, 1.3, 0.012], radius: 0.2 },
          material: "signal",
          position: [0, 0, 0.032],
        },
      ],
    },
    {
      id: "gasket",
      index: "W-03",
      name: "Water-seal gasket",
      role: "Perimeter ring that keeps the case watertight",
      faults: ["Lost water resistance", "Perished / pinched seal", "Fogging under glass"],
      material: "rubber",
      shape: { kind: "torus", r: 0.6, tube: 0.045 },
      position: [0, 0, 0.14],
      explode: [0, 0, 1.0],
      decos: [
        {
          shape: { kind: "torus", r: 0.6, tube: 0.014 },
          material: "signal",
          position: [0, 0, 0.03],
        },
      ],
    },
    {
      id: "case",
      index: "W-04",
      name: "Case body",
      role: "Sealed housing with lugs and side ports",
      faults: ["Crushed lugs", "Lost water seal", "Corroded contacts"],
      material: "housing",
      shape: { kind: "box", size: [1.42, 1.68, 0.34], radius: 0.3 },
      position: [0, 0, 0],
      explode: [0, 0, 0],
      decos: [
        {
          shape: { kind: "box", size: [0.5, 0.14, 0.1], radius: 0.04 },
          material: "housing",
          position: [0, 0.9, 0],
        },
        {
          shape: { kind: "box", size: [0.5, 0.14, 0.1], radius: 0.04 },
          material: "housing",
          position: [0, -0.9, 0],
        },
      ],
    },
    {
      id: "battery",
      index: "W-05",
      name: "Button cell battery",
      role: "Tiny cell doing a very big job",
      faults: ["Half-day battery life", "Swelling pops the screen off"],
      material: "battery",
      shape: { kind: "cyl", rTop: 0.5, rBot: 0.5, h: 0.09, seg: 32 },
      position: [0, -0.1, 0.05],
      rotation: [Math.PI / 2, 0, 0],
      explode: [-1.25, -0.25, 0.45],
      decos: [
        {
          shape: { kind: "box", size: [0.4, 0.16, 0.012], radius: 0.02 },
          material: "signal",
          position: [0, 0.06, 0],
          rotation: [-Math.PI / 2, 0, 0],
        },
      ],
    },
    {
      id: "taptic",
      index: "W-06",
      name: "Taptic engine",
      role: "The wrist-tap actuator",
      faults: ["No wrist taps", "Buzz instead of tap"],
      material: "shield",
      shape: { kind: "box", size: [0.5, 0.3, 0.16], radius: 0.04 },
      position: [-0.35, 0.45, 0.02],
      explode: [-1.15, 0.85, 0.25],
    },
    {
      id: "speaker",
      index: "W-07",
      name: "Micro-speaker",
      role: "Driver for calls, Siri and alarms",
      faults: ["Muffled / crackling audio", "No speaker sound", "Water-logged driver"],
      material: "rubber",
      shape: { kind: "box", size: [0.3, 0.42, 0.13], radius: 0.03 },
      position: [-0.5, -0.5, 0.01],
      explode: [-1.15, -0.95, 0.35],
      decos: [
        {
          shape: { kind: "cyl", rTop: 0.02, rBot: 0.02, h: 0.02 },
          material: "shield",
          position: [-0.08, -0.14, 0.06],
          rotation: [Math.PI / 2, 0, 0],
          grid: { rows: 2, cols: 3, pitchX: 0.08, pitchZ: 0.09 },
        },
      ],
    },
    {
      id: "mic",
      index: "W-08",
      name: "Microphone flex",
      role: "MEMS mic on a short flex tail",
      faults: ["Muffled mic on calls", "Voice control mishears", "Blocked mic port"],
      material: "flex",
      shape: { kind: "box", size: [0.22, 0.18, 0.09], radius: 0.02 },
      position: [0.5, -0.5, 0.02],
      explode: [1.2, -0.9, 0.35],
      decos: [
        {
          shape: { kind: "cyl", rTop: 0.05, rBot: 0.05, h: 0.05 },
          material: "shield",
          position: [0, 0, 0.05],
          rotation: [Math.PI / 2, 0, 0],
        },
      ],
    },
    {
      id: "button",
      index: "W-09",
      name: "Side button flex",
      role: "Side-button switch and its flex tail",
      faults: ["Unresponsive side button", "Sticky / mushy click", "Water ingress at the button"],
      material: "flex",
      shape: { kind: "box", size: [0.18, 0.42, 0.07], radius: 0.02 },
      position: [0.62, -0.28, 0.03],
      explode: [1.25, -0.5, 0.15],
      decos: [
        {
          shape: { kind: "capsule", r: 0.05, len: 0.16 },
          material: "housing",
          position: [0.14, 0, 0],
          rotation: [0, 0, Math.PI / 2],
        },
      ],
    },
    {
      id: "crown",
      index: "W-10",
      name: "Digital crown",
      role: "Rotary encoder + home button stack",
      faults: ["Sticky crown", "No haptic click", "Water ingress"],
      material: "signal",
      shape: { kind: "cyl", rTop: 0.13, rBot: 0.13, h: 0.1, seg: 24 },
      position: [0.76, 0.3, 0.02],
      rotation: [0, 0, Math.PI / 2],
      explode: [1.15, 0.45, 0.1],
      decos: [
        {
          shape: { kind: "capsule", r: 0.045, len: 0.3 },
          material: "housing",
          position: [-0.55, 0, 0],
          rotation: [0, 0, Math.PI / 2],
        },
      ],
    },
    {
      id: "antenna",
      index: "W-11",
      name: "LTE / Wi-Fi antenna",
      role: "Connectivity antenna flex along the case rim",
      faults: ["Weak cellular signal", "Wi-Fi drops on the wrist", "No LTE away from phone"],
      material: "flex",
      shape: { kind: "box", size: [1.05, 0.13, 0.045], radius: 0.02 },
      position: [0, -0.68, 0.0],
      explode: [0.2, -1.15, 0.2],
      decos: [
        {
          shape: { kind: "box", size: [0.13, 0.09, 0.05] },
          material: "shield",
          position: [0.34, 0, 0.03],
        },
        {
          shape: { kind: "box", size: [0.9, 0.03, 0.01] },
          material: "signal",
          position: [0, 0.03, 0.025],
        },
      ],
    },
    {
      id: "sip",
      index: "W-12",
      name: "S-SiP module",
      role: "Whole computer sealed in one resin block",
      faults: ["No boot", "Bluetooth dropouts", "Sensor faults"],
      material: "pcb",
      shape: { kind: "box", size: [1.0, 1.1, 0.06], radius: 0.12 },
      position: [0.1, 0.35, -0.05],
      explode: [0.55, 0.7, -0.75],
      decos: [
        {
          shape: { kind: "box", size: [0.2, 0.2, 0.05] },
          material: "chip",
          position: [-0.2, -0.18, -0.045],
          grid: { rows: 2, cols: 2, pitchX: 0.28, pitchZ: 0 },
        },
      ],
    },
    {
      id: "charge-coil",
      index: "W-13",
      name: "Inductive charge coil",
      role: "Wireless charging loop on the back",
      faults: ["Won't charge on the puck", "Slow / intermittent charging", "Charges in one spot only"],
      material: "copper",
      shape: { kind: "torus", r: 0.5, tube: 0.05 },
      position: [0, 0, -0.14],
      explode: [0, -0.35, -0.6],
      decos: [
        { shape: { kind: "torus", r: 0.34, tube: 0.04 }, material: "copper", position: [0, 0, 0] },
        { shape: { kind: "torus", r: 0.19, tube: 0.03 }, material: "copper", position: [0, 0, 0] },
      ],
    },
    {
      id: "sensor",
      index: "W-14",
      name: "Sensor array + back crystal",
      role: "Heart-rate optics behind sapphire",
      faults: ["No heart-rate reading", "Cracked back crystal"],
      material: "housingDark",
      shape: { kind: "cyl", rTop: 0.62, rBot: 0.66, h: 0.09, seg: 40 },
      position: [0, 0, -0.19],
      rotation: [Math.PI / 2, 0, 0],
      explode: [0, 0, -1.35],
      decos: [
        {
          shape: { kind: "cyl", rTop: 0.09, rBot: 0.09, h: 0.03, seg: 16 },
          material: "signal",
          position: [0, -0.055, 0],
        },
        {
          shape: { kind: "torus", r: 0.3, tube: 0.03 },
          material: "copper",
          position: [0, -0.05, 0],
          rotation: [Math.PI / 2, 0, 0],
        },
      ],
    },
  ],
};
