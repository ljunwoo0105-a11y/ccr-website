import type { DeviceDef, PartDef } from "./types";

/** Compile-time part-id registry — diagnostics suspects reference these. */
export type TabletPartId =
  | "digitiser"
  | "lcd"
  | "display-flex"
  | "front-camera"
  | "home-button"
  | "battery-l"
  | "battery-r"
  | "emi-shield"
  | "mainboard"
  | "button-flex"
  | "speakers-top"
  | "speakers"
  | "charge-flex"
  | "antenna-wifi"
  | "antenna-cell"
  | "camera"
  | "smart-connector"
  | "pencil-coil"
  | "mag-array"
  | "frame";

interface TabletPart extends PartDef {
  id: TabletPartId;
}
interface TabletDef extends DeviceDef {
  id: "tablet";
  parts: TabletPart[];
}

// ---------------------------------------------------------------------------
// UNIT B — SLATE (tablet)
// Face-on: x = width, y = height, z = thickness. Front glass at +z, internals
// near z≈0, back at -z. Front parts explode +z, back parts -z, interior parts
// add lateral x/y so exploded slots don't overlap. Array order = teardown
// order = BOM order: front glass first, aluminium shell last.
// ---------------------------------------------------------------------------

export const TABLET: TabletDef = {
  id: "tablet",
  label: "Tablet",
  designation: "UNIT B · SLATE",
  camZ: 9.2,
  baseTilt: [0.12, -0.3, 0],
  parts: [
    {
      id: "digitiser",
      index: "T-01",
      name: "Glass digitiser",
      role: "Large bonded touch panel — cracks travel fast",
      faults: ["Smashed corner webs", "Unresponsive strips", "Pen jitter"],
      material: "glass",
      shape: { kind: "box", size: [2.9, 3.9, 0.05], radius: 0.1 },
      position: [0, 0, 0.12],
      explode: [0, 0, 2.3],
    },
    {
      id: "lcd",
      index: "T-02",
      name: "LCD panel",
      role: "Backlit display stack under the glass",
      faults: ["Backlight bleed", "Lines after drops", "Dim panel"],
      material: "screen",
      shape: { kind: "box", size: [2.74, 3.74, 0.06], radius: 0.06 },
      position: [0, 0, 0.05],
      explode: [0, 0, 1.35],
      decos: [
        {
          shape: { kind: "box", size: [2.6, 3.6, 0.012], radius: 0.05 },
          material: "signal",
          position: [0, 0, 0.038],
        },
      ],
    },
    {
      id: "display-flex",
      index: "T-03",
      name: "Display ribbon",
      role: "Wide flex feeding the panel and touch layer",
      faults: ["Flicker when flexed", "Half the screen blacks out", "Backlight cuts in and out"],
      material: "flex",
      shape: { kind: "box", size: [1.3, 0.22, 0.04], radius: 0.02 },
      position: [0, 1.05, 0.01],
      explode: [1.2, 1.4, 0.6],
      decos: [
        {
          shape: { kind: "box", size: [0.22, 0.1, 0.05], radius: 0.02 },
          material: "shield",
          position: [0, 0.11, 0],
        },
      ],
    },
    {
      id: "front-camera",
      index: "T-04",
      name: "Front camera",
      role: "Selfie / FaceTime optic in the top bezel",
      faults: ["Blurry selfies", "Black FaceTime image", "Cracked front lens"],
      material: "housingDark",
      shape: { kind: "box", size: [0.22, 0.22, 0.06], radius: 0.04 },
      position: [0, 1.86, 0.05],
      explode: [0, 2.6, 1.3],
      decos: [
        {
          shape: { kind: "cyl", rTop: 0.06, rBot: 0.06, h: 0.05 },
          material: "glass",
          position: [0, 0, 0.035],
          rotation: [Math.PI / 2, 0, 0],
        },
      ],
    },
    {
      id: "home-button",
      index: "T-05",
      name: "Home button + Touch ID",
      role: "Fingerprint sensor on its own flex — pairs to the board",
      faults: ["Touch ID won't read", "Button click feels dead", "Home button not responding"],
      material: "housingDark",
      shape: { kind: "box", size: [0.32, 0.32, 0.06], radius: 0.16 },
      position: [0, -1.86, 0.05],
      explode: [0, -2.6, 1.3],
      decos: [
        {
          shape: { kind: "cyl", rTop: 0.13, rBot: 0.13, h: 0.045 },
          material: "shield",
          position: [0, 0, 0.02],
          rotation: [Math.PI / 2, 0, 0],
        },
        {
          shape: { kind: "cyl", rTop: 0.1, rBot: 0.1, h: 0.04 },
          material: "housingDark",
          position: [0, 0, 0.03],
          rotation: [Math.PI / 2, 0, 0],
        },
        {
          shape: { kind: "box", size: [0.12, 0.3, 0.03] },
          material: "flex",
          position: [0, -0.28, 0],
        },
      ],
    },
    {
      id: "battery-l",
      index: "T-06",
      name: "Battery cell · left",
      role: "One half of the twin 7,600 mAh pack",
      faults: ["Slow charging", "Swelling lifts the screen"],
      material: "battery",
      shape: { kind: "box", size: [1.15, 3.0, 0.07], radius: 0.04 },
      position: [-0.72, -0.2, 0],
      explode: [-1.7, -0.2, 0.6],
      decos: [
        {
          shape: { kind: "box", size: [0.95, 0.3, 0.012], radius: 0.02 },
          material: "signal",
          position: [0, 1.1, 0.045],
        },
      ],
    },
    {
      id: "battery-r",
      index: "T-07",
      name: "Battery cell · right",
      role: "Second cell, wired in parallel",
      faults: ["Cell imbalance", "Rapid drain"],
      material: "battery",
      shape: { kind: "box", size: [1.15, 3.0, 0.07], radius: 0.04 },
      position: [0.72, -0.2, 0],
      explode: [1.7, -0.2, 0.6],
      decos: [
        {
          shape: { kind: "box", size: [0.95, 0.3, 0.012], radius: 0.02 },
          material: "signal",
          position: [0, -1.1, 0.045],
        },
      ],
    },
    {
      id: "emi-shield",
      index: "T-08",
      name: "EMI shield",
      role: "Grounded can clipped over the board's RF section",
      faults: ["Bent shield after a drop", "Loose can rattles"],
      material: "shield",
      shape: { kind: "box", size: [2.5, 0.6, 0.02], radius: 0.03 },
      position: [0, 1.5, -0.06],
      explode: [0, 1.1, -1.9],
      decos: [
        {
          shape: { kind: "box", size: [0.08, 0.08, 0.03] },
          material: "housing",
          position: [-1.1, 0, 0.01],
        },
        {
          shape: { kind: "box", size: [0.08, 0.08, 0.03] },
          material: "housing",
          position: [1.1, 0, 0.01],
        },
      ],
    },
    {
      id: "mainboard",
      index: "T-09",
      name: "Main board",
      role: "Full-width logic strip behind the cells",
      faults: ["Stuck on logo", "Charging IC faults", "Wi-Fi dropouts"],
      material: "pcb",
      shape: { kind: "box", size: [2.6, 0.62, 0.05], radius: 0.02 },
      position: [0, 1.55, -0.02],
      explode: [0, 1.15, -1.3],
      decos: [
        {
          shape: { kind: "box", size: [0.34, 0.34, 0.045] },
          material: "chip",
          position: [-0.6, 0, -0.045],
        },
        {
          shape: { kind: "box", size: [0.3, 0.26, 0.04] },
          material: "shield",
          position: [0.55, 0, -0.04],
        },
        {
          shape: { kind: "box", size: [0.1, 0.1, 0.03] },
          material: "chip",
          position: [-0.05, 0.1, -0.04],
          grid: { rows: 2, cols: 4, pitchX: 0.16, pitchZ: 0 },
        },
      ],
    },
    {
      id: "button-flex",
      index: "T-10",
      name: "Power / volume flex",
      role: "Side-button ribbon running up the long edge",
      faults: ["Power button unresponsive", "Volume stuck or repeating"],
      material: "flex",
      shape: { kind: "box", size: [0.12, 1.4, 0.04], radius: 0.02 },
      position: [1.4, 0.4, 0],
      explode: [2.6, 0.4, -0.2],
      decos: [
        {
          shape: { kind: "box", size: [0.14, 0.16, 0.06], radius: 0.02 },
          material: "housing",
          position: [0.09, 0.4, 0],
        },
        {
          shape: { kind: "box", size: [0.14, 0.34, 0.06], radius: 0.02 },
          material: "housing",
          position: [0.09, -0.2, 0],
        },
      ],
    },
    {
      id: "speakers-top",
      index: "T-11",
      name: "Speaker pair · top",
      role: "Upper stereo drivers, one per top corner",
      faults: ["Top channel silent", "Crackling at high volume"],
      material: "rubber",
      shape: { kind: "box", size: [0.5, 0.7, 0.08], radius: 0.04 },
      position: [1.1, 1.5, -0.02],
      explode: [1.1, 2.4, -0.4],
      decos: [
        {
          shape: { kind: "cyl", rTop: 0.14, rBot: 0.14, h: 0.03 },
          material: "housingDark",
          position: [0, 0.12, 0.045],
          rotation: [Math.PI / 2, 0, 0],
        },
      ],
    },
    {
      id: "speakers",
      index: "T-12",
      name: "Speaker pair · bottom",
      role: "Lower stereo drivers, one per bottom corner",
      faults: ["Buzzing at volume", "One channel dead"],
      material: "rubber",
      shape: { kind: "box", size: [0.5, 0.7, 0.08], radius: 0.04 },
      position: [-1.1, -1.5, -0.02],
      explode: [-1.1, -2.4, -0.4],
      decos: [
        {
          shape: { kind: "cyl", rTop: 0.14, rBot: 0.14, h: 0.03 },
          material: "housingDark",
          position: [0, -0.12, 0.045],
          rotation: [Math.PI / 2, 0, 0],
        },
      ],
    },
    {
      id: "charge-flex",
      index: "T-13",
      name: "Charging port flex",
      role: "USB-C on a long ribbon run",
      faults: ["Loose connector", "Only charges at an angle"],
      material: "flex",
      shape: { kind: "box", size: [1.5, 0.2, 0.04], radius: 0.02 },
      position: [0.4, -1.82, -0.01],
      explode: [0.75, -2.75, -0.3],
    },
    {
      id: "antenna-wifi",
      index: "T-14",
      name: "Wi-Fi / BT antenna",
      role: "Copper antenna line up the left edge",
      faults: ["Weak Wi-Fi range", "Bluetooth keeps dropping"],
      material: "copper",
      shape: { kind: "box", size: [0.12, 2.2, 0.03], radius: 0.01 },
      position: [-1.4, 0.3, -0.02],
      explode: [-2.7, 0.3, -0.4],
      decos: [
        {
          shape: { kind: "box", size: [0.1, 0.1, 0.05], radius: 0.02 },
          material: "shield",
          position: [0, 0.9, 0.02],
        },
      ],
    },
    {
      id: "antenna-cell",
      index: "T-15",
      name: "Cellular antenna",
      role: "Mobile-data antenna in the bottom window",
      faults: ["No SIM / mobile data", "Signal drops in known-good areas"],
      material: "copper",
      shape: { kind: "box", size: [1.4, 0.12, 0.03], radius: 0.01 },
      position: [-0.3, -1.92, -0.02],
      explode: [-0.6, -2.9, -0.4],
      decos: [
        {
          shape: { kind: "box", size: [0.1, 0.1, 0.05], radius: 0.02 },
          material: "shield",
          position: [0.6, 0, 0.02],
        },
      ],
    },
    {
      id: "camera",
      index: "T-16",
      name: "Rear camera module",
      role: "Single rear optic with flash",
      faults: ["Focus failure", "Cracked lens window"],
      material: "housingDark",
      shape: { kind: "box", size: [0.4, 0.4, 0.1], radius: 0.06 },
      position: [-1.15, 1.6, -0.08],
      explode: [-1.9, 2.15, -0.8],
      decos: [
        {
          shape: { kind: "cyl", rTop: 0.1, rBot: 0.1, h: 0.08 },
          material: "glass",
          position: [0, 0, -0.05],
          rotation: [Math.PI / 2, 0, 0],
        },
      ],
    },
    {
      id: "smart-connector",
      index: "T-17",
      name: "Smart connector",
      role: "Three rear pogo pads for a magnetic keyboard",
      faults: ["Keyboard not detected", "Pogo pads corroded"],
      material: "housingDark",
      shape: { kind: "box", size: [0.55, 0.16, 0.04], radius: 0.02 },
      position: [0, -1.55, -0.075],
      explode: [0, -2.0, -0.65],
      decos: [
        {
          shape: { kind: "cyl", rTop: 0.03, rBot: 0.03, h: 0.02 },
          material: "copper",
          position: [-0.14, 0, -0.03],
          rotation: [Math.PI / 2, 0, 0],
          grid: { rows: 1, cols: 3, pitchX: 0.14, pitchZ: 0 },
        },
      ],
    },
    {
      id: "pencil-coil",
      index: "T-18",
      name: "Pencil charge coil",
      role: "Inductive stylus coil along the top edge",
      faults: ["Pencil won't charge", "Stylus won't pair"],
      material: "copper",
      shape: { kind: "box", size: [1.3, 0.09, 0.04], radius: 0.01 },
      position: [-0.2, 1.93, 0],
      explode: [-0.3, 3.4, 0.4],
      decos: [
        {
          shape: { kind: "box", size: [0.04, 0.07, 0.045] },
          material: "copper",
          position: [-0.55, 0, 0.005],
          grid: { rows: 1, cols: 12, pitchX: 0.1, pitchZ: 0 },
        },
      ],
    },
    {
      id: "mag-array",
      index: "T-19",
      name: "Magnet array",
      role: "Magnet strip that holds the stylus and cover",
      faults: ["Pencil won't stay attached", "Weak magnetic hold"],
      material: "shield",
      shape: { kind: "box", size: [1.3, 0.09, 0.03], radius: 0.01 },
      position: [0.2, 1.93, -0.04],
      explode: [0.3, 3.9, -0.6],
      decos: [
        {
          shape: { kind: "box", size: [0.09, 0.07, 0.035] },
          material: "shield",
          position: [-0.55, 0, 0],
          grid: { rows: 1, cols: 10, pitchX: 0.12, pitchZ: 0 },
        },
      ],
    },
    {
      id: "frame",
      index: "T-20",
      name: "Unibody shell",
      role: "Aluminium tub the whole tablet lives in",
      faults: ["Bent corners", "Sheared buttons"],
      material: "housing",
      shape: { kind: "box", size: [3.0, 4.0, 0.16], radius: 0.12 },
      position: [0, 0, -0.03],
      explode: [0, 0, -0.15],
    },
  ],
};
