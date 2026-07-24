import type { DeviceDef, PartDef } from "./types";

/** Compile-time part-id registry — diagnostics suspects reference these. */
export type PhonePartId =
  | "front-glass"
  | "oled"
  | "display-flex"
  | "earpiece"
  | "front-camera"
  | "frame"
  | "battery"
  | "emi-shield"
  | "logic-board"
  | "sub-board"
  | "taptic"
  | "speaker"
  | "charge-port"
  | "top-mic"
  | "sim-tray"
  | "button-flex"
  | "upper-antenna"
  | "lower-antenna"
  | "camera"
  | "lens-cover"
  | "coil"
  | "back-glass";

interface PhonePart extends PartDef {
  id: PhonePartId;
}
interface PhoneDef extends DeviceDef {
  id: "phone";
  parts: PhonePart[];
}

// ---------------------------------------------------------------------------
// UNIT A — HANDSET
//
// Face-on rig: x = width, y = height, z = thickness. Front glass at +z,
// internals near z≈0, back panel at -z. Parts are ordered front/top → back
// in teardown sequence (P-01 first off, shells last).
// ---------------------------------------------------------------------------

export const PHONE: PhoneDef = {
  id: "phone",
  label: "Phone",
  designation: "UNIT A · HANDSET",
  camZ: 7.2,
  baseTilt: [0.08, -0.35, 0],
  parts: [
    {
      id: "front-glass",
      index: "P-01",
      name: "Front glass + digitiser",
      role: "Touch layer laminated to the display stack",
      faults: ["Cracked / shattered glass", "Ghost touch", "Dead touch zones"],
      material: "glass",
      shape: { kind: "box", size: [1.52, 3.14, 0.045], radius: 0.09 },
      position: [0, 0, 0.115],
      explode: [0, 0, 2.1],
    },
    {
      id: "oled",
      index: "P-02",
      name: "OLED display module",
      role: "Self-emissive panel — the picture itself",
      faults: ["Black screen", "Green / pink lines", "Burn-in, dead pixels"],
      material: "screen",
      shape: { kind: "box", size: [1.42, 3.02, 0.05], radius: 0.07 },
      position: [0, 0, 0.06],
      // Glass and panel are laminated into one screen assembly and are only
      // ever replaced as a unit, so P-02 stays tucked behind P-01 instead of
      // drifting back past the earpiece and front camera.
      explode: [0, 0, 1.95],
      decos: [
        {
          shape: { kind: "box", size: [1.3, 2.86, 0.012], radius: 0.05 },
          material: "signal",
          position: [0, 0, 0.032],
        },
      ],
    },
    {
      id: "display-flex",
      index: "P-03",
      name: "Display flex cable",
      role: "Ribbon carrying signal and touch to the panel",
      faults: [
        "Flickering or lines on screen",
        "Intermittent black display",
        "Unresponsive touch after a knock",
      ],
      material: "flex",
      shape: { kind: "box", size: [0.55, 1.0, 0.03], radius: 0.02 },
      position: [0, -0.2, 0.03],
      explode: [-0.9, -1.0, 0.9],
      decos: [
        {
          shape: { kind: "box", size: [0.18, 0.1, 0.04], radius: 0.01 },
          material: "shield",
          position: [0, -0.45, 0.02],
        },
      ],
    },
    {
      id: "earpiece",
      index: "P-04",
      name: "Earpiece speaker",
      role: "Top front speaker for call audio",
      faults: ["No sound on calls", "Muffled earpiece", "Crackling in-call audio"],
      material: "rubber",
      shape: { kind: "box", size: [0.42, 0.12, 0.06], radius: 0.03 },
      position: [0, 1.35, 0.075],
      explode: [0, 0.7, 1.7],
      decos: [
        {
          shape: { kind: "box", size: [0.3, 0.05, 0.02], radius: 0.02 },
          material: "shield",
          position: [0, 0, 0.035],
        },
      ],
    },
    {
      id: "front-camera",
      index: "P-05",
      name: "Front camera",
      role: "Selfie and Face-unlock camera module",
      faults: ["Blurry selfies", "Black front camera", "Face unlock failures"],
      material: "housingDark",
      shape: { kind: "box", size: [0.14, 0.14, 0.08], radius: 0.02 },
      position: [0.35, 1.42, 0.07],
      explode: [0.8, 0.9, 1.5],
      decos: [
        {
          shape: { kind: "cyl", rTop: 0.05, rBot: 0.05, h: 0.05 },
          material: "glass",
          position: [0, 0, 0.03],
          rotation: [Math.PI / 2, 0, 0],
        },
      ],
    },
    {
      id: "frame",
      index: "P-06",
      name: "Mid-frame chassis",
      role: "Machined housing every module bolts into",
      faults: ["Bent frame after drops", "Worn SIM tray", "Button wear"],
      material: "housing",
      shape: { kind: "box", size: [1.58, 3.2, 0.14], radius: 0.11 },
      position: [0, 0, 0],
      explode: [0, 0, 0],
      decos: [
        {
          shape: { kind: "capsule", r: 0.028, len: 0.42 },
          material: "housing",
          position: [0.81, 0.7, 0],
          rotation: [0, 0, 0],
        },
        {
          shape: { kind: "capsule", r: 0.028, len: 0.2 },
          material: "signal",
          position: [-0.81, 0.86, 0],
        },
      ],
    },
    {
      id: "battery",
      index: "P-07",
      name: "Li-ion battery",
      role: "3,200 mAh cell — the most-replaced part in the shop",
      faults: ["Rapid drain", "Swelling (urgent!)", "Random shutdowns"],
      material: "battery",
      shape: { kind: "box", size: [0.92, 1.7, 0.09], radius: 0.05 },
      position: [-0.22, -0.5, -0.045],
      explode: [-1.15, -0.3, -0.55],
      decos: [
        {
          shape: { kind: "box", size: [0.78, 0.34, 0.012], radius: 0.02 },
          material: "signal",
          position: [0, 0.42, -0.052],
        },
        {
          shape: { kind: "box", size: [0.2, 0.1, 0.03] },
          material: "flex",
          position: [0.28, -0.88, 0],
        },
      ],
    },
    {
      id: "emi-shield",
      index: "P-08",
      name: "EMI shield can",
      role: "RF shield can over the logic board",
      faults: [
        "Missing shield after a repair",
        "Interference / dropouts",
        "Bent or lifted shield can",
      ],
      material: "shield",
      shape: { kind: "box", size: [0.66, 1.6, 0.04], radius: 0.02 },
      position: [0.42, 0.55, -0.005],
      explode: [1.18, 0.55, 0.4],
      decos: [
        {
          shape: { kind: "box", size: [0.5, 1.4, 0.012], radius: 0.02 },
          material: "shield",
          position: [0, 0, 0.022],
        },
      ],
    },
    {
      id: "logic-board",
      index: "P-09",
      name: "Logic board",
      role: "SoC, memory, power management — the brain",
      faults: ["No power", "Water damage corrosion", "Audio / charging ICs"],
      material: "pcb",
      shape: { kind: "box", size: [0.62, 1.55, 0.05], radius: 0.02 },
      position: [0.42, 0.55, -0.04],
      explode: [1.25, 0.55, -0.85],
      decos: [
        {
          shape: { kind: "box", size: [0.3, 0.3, 0.045] },
          material: "chip",
          position: [0, 0.28, -0.045],
        },
        {
          shape: { kind: "box", size: [0.24, 0.34, 0.04] },
          material: "shield",
          position: [0.02, -0.32, -0.042],
        },
        {
          shape: { kind: "box", size: [0.09, 0.09, 0.03] },
          material: "chip",
          position: [-0.18, -0.06, -0.04],
          grid: { rows: 3, cols: 3, pitchX: 0.13, pitchZ: 0 },
        },
      ],
    },
    {
      id: "sub-board",
      index: "P-10",
      name: "Sub-board / interconnect",
      role: "Lower interconnect board by the charge port",
      faults: ["Charging faults", "Sound routing dropouts", "Intermittent connections"],
      material: "pcb",
      shape: { kind: "box", size: [0.6, 0.35, 0.06], radius: 0.02 },
      position: [0.1, -1.2, -0.02],
      explode: [-0.7, -0.4, -0.88],
      decos: [
        {
          shape: { kind: "box", size: [0.12, 0.12, 0.03] },
          material: "chip",
          position: [0.15, 0, -0.03],
        },
        {
          shape: { kind: "box", size: [0.16, 0.1, 0.03] },
          material: "shield",
          position: [-0.15, 0, -0.03],
        },
        {
          shape: { kind: "box", size: [0.1, 0.06, 0.04] },
          material: "flex",
          position: [0, -0.18, 0],
        },
      ],
    },
    {
      id: "taptic",
      index: "P-11",
      name: "Haptic engine",
      role: "Linear actuator behind every buzz and tap",
      faults: ["No vibration", "Rattling feedback"],
      material: "shield",
      shape: { kind: "box", size: [0.5, 0.3, 0.08], radius: 0.03 },
      position: [0.38, -0.62, -0.04],
      explode: [1.05, -0.75, -0.5],
    },
    {
      id: "speaker",
      index: "P-12",
      name: "Loudspeaker module",
      role: "Bottom-firing driver in a tuned box",
      faults: ["Muffled / crackling audio", "No ringtone"],
      material: "rubber",
      shape: { kind: "box", size: [0.55, 0.42, 0.09], radius: 0.05 },
      position: [-0.35, -1.22, -0.04],
      explode: [-0.85, -1.5, -0.5],
      decos: [
        {
          shape: { kind: "cyl", rTop: 0.02, rBot: 0.02, h: 0.02 },
          material: "shield",
          position: [-0.16, -0.12, -0.05],
          rotation: [Math.PI / 2, 0, 0],
          grid: { rows: 3, cols: 5, pitchX: 0.08, pitchZ: 0.08 },
        },
      ],
    },
    {
      id: "charge-port",
      index: "P-13",
      name: "Charging port flex",
      role: "USB-C connector, main mic and antenna feed",
      faults: ["Won't charge / loose cable", "No data transfer", "Mic faults"],
      material: "flex",
      shape: { kind: "box", size: [0.9, 0.22, 0.045], radius: 0.02 },
      position: [0.1, -1.45, -0.03],
      explode: [0.35, -2.05, -0.35],
      decos: [
        {
          shape: { kind: "box", size: [0.18, 0.08, 0.06], radius: 0.02 },
          material: "shield",
          position: [0, -0.08, 0],
        },
      ],
    },
    {
      id: "top-mic",
      index: "P-14",
      name: "Top microphone",
      role: "Top noise-cancelling microphone on a carrier",
      faults: ["Muffled voice on calls", "Noise cancellation faults", "Video sound issues"],
      material: "housingDark",
      shape: { kind: "box", size: [0.22, 0.12, 0.06], radius: 0.02 },
      position: [0.3, 1.5, 0.02],
      explode: [0.6, 1.3, 0.9],
      decos: [
        {
          shape: { kind: "cyl", rTop: 0.02, rBot: 0.02, h: 0.02 },
          material: "shield",
          position: [0, 0, 0.035],
          rotation: [Math.PI / 2, 0, 0],
        },
      ],
    },
    {
      id: "sim-tray",
      index: "P-15",
      name: "SIM tray",
      role: "SIM / eSIM tray in the frame edge",
      faults: ["No SIM detected", "Bent or stuck tray", "Dropped signal from a loose SIM"],
      material: "housing",
      shape: { kind: "box", size: [0.06, 0.42, 0.09], radius: 0.01 },
      position: [-0.79, -0.3, 0],
      explode: [-1.6, 0.4, 0.2],
      decos: [
        {
          shape: { kind: "box", size: [0.05, 0.3, 0.03], radius: 0.01 },
          material: "signal",
          position: [0, 0, 0.03],
        },
      ],
    },
    {
      id: "button-flex",
      index: "P-16",
      name: "Power / volume flex",
      role: "Power and volume switch ribbon",
      faults: ["Stuck power button", "Volume buttons not working", "Buttons feel mushy"],
      material: "flex",
      shape: { kind: "box", size: [0.06, 0.7, 0.07], radius: 0.02 },
      position: [0.79, 0.5, 0],
      explode: [1.7, 0.3, 0.25],
      decos: [
        {
          shape: { kind: "box", size: [0.05, 0.14, 0.04], radius: 0.01 },
          material: "housing",
          position: [0, 0.18, 0.03],
        },
        {
          shape: { kind: "box", size: [0.05, 0.24, 0.04], radius: 0.01 },
          material: "housing",
          position: [0, -0.12, 0.03],
        },
      ],
    },
    {
      id: "upper-antenna",
      index: "P-17",
      name: "Upper antenna",
      role: "Top edge cellular / GPS antenna",
      faults: ["Weak signal up top", "Dropped calls", "Slow mobile data"],
      material: "copper",
      shape: { kind: "capsule", r: 0.035, len: 0.9 },
      position: [0, 1.55, 0],
      rotation: [0, 0, Math.PI / 2],
      explode: [0, 1.5, 0.5],
    },
    {
      id: "lower-antenna",
      index: "P-18",
      name: "Lower antenna",
      role: "Bottom edge cellular / Wi-Fi antenna",
      faults: ["Weak signal / no bars", "Bluetooth / GPS dropouts", "Calls drop when held low"],
      material: "copper",
      shape: { kind: "capsule", r: 0.035, len: 0.9 },
      position: [0, -1.55, 0],
      rotation: [0, 0, Math.PI / 2],
      explode: [0, -1.5, 0.5],
    },
    {
      id: "camera",
      index: "P-19",
      name: "Rear camera array",
      role: "Wide + ultrawide optics with OIS",
      faults: ["Blurry photos (OIS)", "Cracked lens glass", "Focus rattle"],
      material: "housingDark",
      shape: { kind: "box", size: [0.62, 0.62, 0.1], radius: 0.08 },
      position: [-0.38, 1.15, -0.1],
      explode: [-0.9, 1.05, -1.15],
      decos: [
        {
          shape: { kind: "cyl", rTop: 0.13, rBot: 0.13, h: 0.09 },
          material: "glass",
          position: [-0.13, 0.13, -0.06],
          rotation: [Math.PI / 2, 0, 0],
        },
        {
          shape: { kind: "cyl", rTop: 0.13, rBot: 0.13, h: 0.09 },
          material: "glass",
          position: [0.15, -0.11, -0.06],
          rotation: [Math.PI / 2, 0, 0],
        },
        {
          shape: { kind: "cyl", rTop: 0.045, rBot: 0.045, h: 0.06 },
          material: "signal",
          position: [0.16, 0.16, -0.05],
          rotation: [Math.PI / 2, 0, 0],
        },
      ],
    },
    {
      id: "lens-cover",
      index: "P-20",
      name: "Rear lens cover",
      role: "Sapphire glass over the rear optics",
      faults: [
        "Cracked camera glass",
        "Blurry photos through scratched glass",
        "Foggy rear lens",
      ],
      material: "glass",
      shape: { kind: "box", size: [0.66, 0.66, 0.04], radius: 0.08 },
      position: [-0.38, 1.15, -0.14],
      explode: [-0.12, 0.75, -1.8],
      decos: [
        {
          shape: { kind: "cyl", rTop: 0.13, rBot: 0.13, h: 0.02 },
          material: "housingDark",
          position: [-0.13, 0.13, -0.02],
          rotation: [Math.PI / 2, 0, 0],
        },
        {
          shape: { kind: "cyl", rTop: 0.13, rBot: 0.13, h: 0.02 },
          material: "housingDark",
          position: [0.15, -0.11, -0.02],
          rotation: [Math.PI / 2, 0, 0],
        },
      ],
    },
    {
      id: "coil",
      index: "P-21",
      name: "Wireless charge coil",
      role: "Qi induction loop + NFC antenna",
      faults: ["No wireless charging", "Tap-to-pay failures"],
      material: "copper",
      shape: { kind: "torus", r: 0.42, tube: 0.055 },
      position: [0, 0.1, -0.085],
      explode: [0, 0.25, -1.55],
      decos: [
        { shape: { kind: "torus", r: 0.28, tube: 0.045 }, material: "copper", position: [0, 0, 0] },
        { shape: { kind: "torus", r: 0.15, tube: 0.035 }, material: "copper", position: [0, 0, 0] },
      ],
    },
    {
      id: "back-glass",
      index: "P-22",
      name: "Back glass",
      role: "Rear panel — glued, and famously fragile",
      faults: ["Shattered back", "Lifting from swollen battery"],
      material: "glass",
      shape: { kind: "box", size: [1.52, 3.14, 0.045], radius: 0.09 },
      position: [0, 0, -0.115],
      explode: [0, 0, -2.35],
      decos: [
        {
          shape: { kind: "box", size: [0.66, 0.66, 0.02], radius: 0.09 },
          material: "housingDark",
          position: [-0.38, 1.15, -0.03],
        },
      ],
    },
  ],
};
