import type { DeviceDef, PartDef } from "./types";

/** Compile-time part-id registry — diagnostics suspects reference these. */
export type LaptopPartId =
  | "lid"
  | "hinge"
  | "deck"
  | "trackpad"
  | "battery"
  | "mainboard"
  | "cooling"
  | "ssd"
  | "speakers"
  | "bottom"
  | "webcam"
  | "lid-antenna"
  | "display-cable"
  | "kb-backlight"
  | "trackpad-flex"
  | "ram"
  | "wifi-card"
  | "cmos-battery"
  | "fan"
  | "io-board"
  | "dc-jack";

interface LaptopPart extends PartDef {
  id: LaptopPartId;
}
interface LaptopDef extends DeviceDef {
  id: "laptop";
  parts: LaptopPart[];
}

// ---------------------------------------------------------------------------
// UNIT C — CLAMSHELL (laptop)
// ---------------------------------------------------------------------------

export const LAPTOP: LaptopDef = {
  id: "laptop",
  label: "Laptop",
  designation: "UNIT C · CLAMSHELL",
  camZ: 10.4,
  baseTilt: [0.3, -0.55, 0],
  parts: [
    {
      id: "lid",
      index: "C-01",
      name: "Display lid",
      role: "Panel, bezel and antennas in one assembly",
      faults: ["Cracked panel", "Flickering image", "Broken hinges tear the lid"],
      material: "housing",
      shape: { kind: "box", size: [4.1, 2.7, 0.09], radius: 0.07 },
      position: [0, 1.28, -1.32],
      rotation: [-1.28, 0, 0],
      explode: [0, 1.5, -1.1],
      decos: [
        {
          shape: { kind: "box", size: [3.82, 2.44, 0.02], radius: 0.03 },
          material: "screen",
          position: [0, 0, 0.055],
        },
        {
          shape: { kind: "box", size: [3.6, 2.24, 0.012], radius: 0.02 },
          material: "signal",
          position: [0, 0, 0.068],
        },
      ],
    },
    {
      id: "hinge",
      index: "C-02",
      name: "Hinge rail",
      role: "Torque hinges + display cable channel",
      faults: ["Seized hinge", "Snapped mounts", "Flex cable wear"],
      material: "shield",
      shape: { kind: "capsule", r: 0.07, len: 3.6 },
      position: [0, 0.06, -1.32],
      rotation: [0, 0, Math.PI / 2],
      explode: [0, 0.55, -0.65],
    },
    {
      id: "deck",
      index: "C-03",
      name: "Keyboard deck",
      role: "Top case — palm rest and key matrix",
      faults: ["Dead keys", "Liquid spills", "Worn palm rest"],
      material: "housing",
      shape: { kind: "box", size: [4.1, 0.08, 2.6], radius: 0.05 },
      position: [0, 0.1, 0],
      explode: [0, 1.15, 0.35],
      decos: [
        {
          shape: { kind: "box", size: [0.24, 0.05, 0.24], radius: 0.015 },
          material: "housingDark",
          position: [-1.69, 0.055, -0.82],
          grid: { rows: 4, cols: 13, pitchX: 0.27, pitchZ: 0.27 },
        },
        {
          shape: { kind: "box", size: [1.7, 0.05, 0.24], radius: 0.015 },
          material: "housingDark",
          position: [0, 0.055, 0.26],
        },
      ],
    },
    {
      id: "trackpad",
      index: "C-04",
      name: "Trackpad",
      role: "Glass pad with haptic click board",
      faults: ["No click", "Erratic cursor", "Lifted by swollen battery"],
      material: "glass",
      shape: { kind: "box", size: [1.5, 0.05, 0.95], radius: 0.04 },
      position: [0, 0.11, 0.78],
      explode: [0, 0.7, 1.5],
    },
    {
      id: "battery",
      index: "C-05",
      name: "Battery pack",
      role: "Three flat cells under the palm rest",
      faults: ["Swelling (lifts trackpad)", "Short runtime", "Not detected"],
      material: "battery",
      shape: { kind: "box", size: [2.6, 0.09, 0.9], radius: 0.04 },
      position: [0, -0.02, 0.72],
      explode: [0, -0.85, 1.15],
      decos: [
        {
          shape: { kind: "box", size: [0.78, 0.02, 0.8], radius: 0.03 },
          material: "rubber",
          position: [-0.86, 0.055, 0],
          grid: { rows: 1, cols: 3, pitchX: 0.86, pitchZ: 0 },
        },
      ],
    },
    {
      id: "mainboard",
      index: "C-06",
      name: "Main board",
      role: "CPU/GPU island along the hinge line",
      faults: ["No power", "GPU artifacts", "USB port failures"],
      material: "pcb",
      shape: { kind: "box", size: [3.4, 0.06, 0.85], radius: 0.02 },
      position: [0, -0.02, -0.75],
      explode: [0, -0.7, -1.35],
      decos: [
        {
          shape: { kind: "box", size: [0.5, 0.07, 0.5] },
          material: "chip",
          position: [-0.5, 0.05, 0.02],
        },
        {
          shape: { kind: "box", size: [0.34, 0.06, 0.34] },
          material: "chip",
          position: [0.42, 0.05, -0.05],
        },
        {
          shape: { kind: "box", size: [0.12, 0.05, 0.3] },
          material: "shield",
          position: [1.15, 0.04, 0],
          grid: { rows: 1, cols: 2, pitchX: 0.2, pitchZ: 0 },
        },
      ],
    },
    {
      id: "cooling",
      index: "C-07",
      name: "Heat pipe",
      role: "Copper pipe carrying heat off the silicon",
      faults: ["Overheating / throttling", "Dried thermal paste", "Bent pipe"],
      material: "copper",
      shape: { kind: "capsule", r: 0.06, len: 1.7 },
      position: [-0.1, 0.08, -0.75],
      rotation: [0, 0, Math.PI / 2],
      explode: [-0.3, 0.95, -1.2],
    },
    {
      id: "ssd",
      index: "C-08",
      name: "NVMe SSD",
      role: "M.2 stick — the best upgrade in the shop",
      faults: ["Slow HDD → SSD upgrades", "Failing drives", "Data recovery"],
      material: "signal",
      shape: { kind: "box", size: [1.1, 0.05, 0.3], radius: 0.01 },
      position: [1.1, -0.02, 0.05],
      explode: [2.2, -0.4, 0.45],
      decos: [
        {
          shape: { kind: "box", size: [0.22, 0.045, 0.22] },
          material: "chip",
          position: [-0.28, 0, 0],
          grid: { rows: 1, cols: 2, pitchX: 0.36, pitchZ: 0 },
        },
      ],
    },
    {
      id: "speakers",
      index: "C-09",
      name: "Speaker bars",
      role: "Side-firing drivers flanking the battery",
      faults: ["Distortion at volume", "One side silent"],
      material: "rubber",
      shape: { kind: "box", size: [0.35, 0.08, 1.6], radius: 0.04 },
      position: [-1.75, 0, 0.35],
      explode: [-3.0, -0.25, 0.55],
    },
    {
      id: "bottom",
      index: "C-10",
      name: "Bottom case",
      role: "Service door — every repair starts here",
      faults: ["Stripped screws", "Cracked corners", "Missing feet"],
      material: "housing",
      shape: { kind: "box", size: [4.1, 0.07, 2.6], radius: 0.06 },
      position: [0, -0.14, 0],
      explode: [0, -1.9, 0.5],
      decos: [
        {
          shape: { kind: "box", size: [0.5, 0.02, 0.06], radius: 0.01 },
          material: "housingDark",
          position: [-0.6, -0.045, -1.05],
          grid: { rows: 1, cols: 3, pitchX: 0.6, pitchZ: 0 },
        },
      ],
    },
    {
      id: "fan",
      index: "C-11",
      name: "Cooling fan",
      role: "Blower that pushes air across the heat pipe",
      faults: ["Grinding / rattling fan", "Dust choke", "Fan won't spin"],
      material: "housingDark",
      shape: { kind: "cyl", rTop: 0.44, rBot: 0.44, h: 0.12, seg: 28 },
      position: [-0.95, 0.09, -0.8],
      explode: [-1.4, 1.0, -1.5],
      decos: [
        {
          shape: { kind: "box", size: [0.07, 0.02, 0.34] },
          material: "rubber",
          position: [0, 0.07, 0],
          rotation: [0, 0, 0],
          spin: "y",
        },
      ],
    },
    {
      id: "webcam",
      index: "C-12",
      name: "Webcam module",
      role: "Camera + IR array in the top bezel",
      faults: ["Black or frozen webcam", "Grainy image", "Privacy shutter jam"],
      material: "housingDark",
      shape: { kind: "box", size: [0.2, 0.11, 0.05], radius: 0.02 },
      position: [0, 2.5, -1.62],
      rotation: [-1.28, 0, 0],
      explode: [0, 3.0, -1.35],
      decos: [
        {
          shape: { kind: "cyl", rTop: 0.03, rBot: 0.03, h: 0.03, seg: 12 },
          material: "glass",
          position: [0, 0, 0.03],
        },
      ],
    },
    {
      id: "lid-antenna",
      index: "C-13",
      name: "Wi-Fi antennas (lid)",
      role: "Antenna cables routed up the bezel corners",
      faults: ["Short Wi-Fi range", "Bluetooth dropouts", "Pinched cable at the hinge"],
      material: "copper",
      shape: { kind: "capsule", r: 0.03, len: 1.9 },
      position: [1.6, 1.3, -1.5],
      rotation: [-1.28, 0, 0],
      explode: [2.6, 1.6, -1.3],
    },
    {
      id: "display-cable",
      index: "C-14",
      name: "Display cable",
      role: "Video ribbon from board to panel, through the hinge",
      faults: ["Flicker when opening the lid", "Lines or black at an angle", "Worn at the fold"],
      material: "flex",
      shape: { kind: "box", size: [0.16, 0.5, 0.02], radius: 0.01 },
      position: [-0.3, 0.35, -1.15],
      explode: [-1.0, 1.0, -1.0],
    },
    {
      id: "kb-backlight",
      index: "C-15",
      name: "Keyboard backlight",
      role: "Light-guide sheet under the key matrix",
      faults: ["Backlight dead or patchy", "Won't dim", "Fails after a spill"],
      material: "signal",
      shape: { kind: "box", size: [3.6, 0.015, 1.7], radius: 0.03 },
      position: [0, 0.055, -0.1],
      explode: [0, 1.55, 0.25],
    },
    {
      id: "trackpad-flex",
      index: "C-16",
      name: "Trackpad flex",
      role: "Ribbon linking the trackpad to the board",
      faults: ["Cursor jumps or freezes", "No click after a battery swell", "Loose connector"],
      material: "flex",
      shape: { kind: "box", size: [0.6, 0.02, 0.18], radius: 0.01 },
      position: [0, 0.06, 0.5],
      explode: [0, 0.6, 1.75],
    },
    {
      id: "ram",
      index: "C-17",
      name: "Memory (SO-DIMM)",
      role: "Upgradable RAM sticks beside the board",
      faults: ["No boot / beep codes", "Random freezes", "Cheap upgrade win"],
      material: "signal",
      shape: { kind: "box", size: [1.0, 0.06, 0.28], radius: 0.01 },
      position: [-0.8, 0.05, -0.35],
      explode: [-1.9, 0.55, -1.05],
      decos: [
        {
          shape: { kind: "box", size: [0.22, 0.045, 0.22] },
          material: "chip",
          position: [-0.28, 0, 0],
          grid: { rows: 1, cols: 3, pitchX: 0.28, pitchZ: 0 },
        },
      ],
    },
    {
      id: "wifi-card",
      index: "C-18",
      name: "Wi-Fi / BT card",
      role: "M.2 radio card with antenna leads",
      faults: ["No Wi-Fi adapter found", "Drops connection", "Loose antenna leads"],
      material: "pcb",
      shape: { kind: "box", size: [0.3, 0.04, 0.22], radius: 0.01 },
      position: [0.75, 0.04, -0.35],
      explode: [1.5, 0.55, -1.0],
      decos: [
        {
          shape: { kind: "box", size: [0.12, 0.03, 0.1] },
          material: "shield",
          position: [0, 0.035, 0],
        },
      ],
    },
    {
      id: "cmos-battery",
      index: "C-19",
      name: "CMOS coin cell",
      role: "Keeps the clock and BIOS settings alive",
      faults: ["Clock resets every boot", "BIOS settings lost", "Boot-time warnings"],
      material: "battery",
      shape: { kind: "cyl", rTop: 0.14, rBot: 0.14, h: 0.05, seg: 20 },
      position: [1.0, 0.04, -0.05],
      rotation: [Math.PI / 2, 0, 0],
      explode: [2.0, 0.45, -0.4],
    },
    {
      id: "io-board",
      index: "C-20",
      name: "I/O daughterboard",
      role: "Side ports — USB, audio jack, card reader",
      faults: ["Dead USB port", "Headphone jack crackle", "Loose ribbon to the board"],
      material: "pcb",
      shape: { kind: "box", size: [0.5, 0.06, 0.95], radius: 0.02 },
      position: [1.65, -0.02, 0.3],
      explode: [3.1, -0.45, 0.55],
      decos: [
        {
          shape: { kind: "box", size: [0.14, 0.08, 0.1] },
          material: "shield",
          position: [0.1, 0, -0.3],
          grid: { rows: 1, cols: 2, pitchX: 0, pitchZ: 0.4 },
        },
      ],
    },
    {
      id: "dc-jack",
      index: "C-21",
      name: "DC power jack",
      role: "Where the charger plugs in",
      faults: ["Charges only when wiggled", "Loose or sunken jack", "No charge at all"],
      material: "shield",
      shape: { kind: "box", size: [0.24, 0.12, 0.16], radius: 0.03 },
      position: [-1.9, -0.02, -0.7],
      explode: [-3.3, -0.35, -0.6],
      decos: [
        {
          shape: { kind: "cyl", rTop: 0.05, rBot: 0.05, h: 0.14, seg: 12 },
          material: "signal",
          position: [-0.14, 0, 0],
          rotation: [0, 0, Math.PI / 2],
        },
      ],
    },
  ],
};
