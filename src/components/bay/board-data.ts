// ---------------------------------------------------------------------------
// Manifold circuit sheet — IC package data.
//
// Geometry AND explainer content live together so the 3D board and the
// detail panel can never drift out of sync. Board space: x ∈ [-3.6, 3.6],
// z ∈ [-2.35, 2.35] (BOARD_W 7.2 × BOARD_D 4.7 in SchematicBoard.tsx).
//
// Content rules (same contract as diagnostics/):
//  - `summary` is customer-friendly: 2–3 sentences, zero jargon.
//  - `tech` is the TECH NOTES tab: 4–6 bullets — function, failure modes,
//    bench signature, rework notes. Hedged language, no prices.
//  - `symptoms` are observable, phrased as a customer would report them.
// ---------------------------------------------------------------------------

import type { DeviceId } from "./rig-data";

export interface BoardIc {
  /** Stable key — diagnostics IcLink references this. */
  id: string;
  /** Silkscreen reference rendered on the board: "U7 · PMIC". */
  ref: string;
  name: string;
  // -- geometry (board space) --
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  // -- content --
  summary: string;
  tech: readonly string[];
  symptoms: readonly string[];
  /** Cross-links into the Teardown Bay (validated at build time). */
  related?: readonly { device: DeviceId; partId: string }[];
}

export const BOARD_ICS = [
  {
    id: "soc",
    ref: "U1 · SOC",
    name: "System-on-chip",
    x: 0,
    z: 0,
    w: 1.15,
    d: 1.15,
    h: 0.14,
    summary:
      "The main processor — CPU, graphics and memory controller fused into one package. Everything the device does runs through here, which is why we treat it as the last suspect, not the first.",
    tech: [
      "Application processor with RAM usually stacked directly on top (package-on-package).",
      "Failure modes: drop-induced solder-ball cracks under the package, liquid corrosion on surrounding passives, heat stress after long throttling.",
      "Bench signature: boot loops or no image with normal current draw; reflow is a diagnosis step, not a fix.",
      "Rework: full replacement needs a donor chip and careful underfill removal — on many platforms the SoC is married to storage, so data stays recoverable only if the pair moves together.",
    ],
    symptoms: [
      "Random restarts that a new battery didn't fix",
      "Stuck on the logo, over and over",
      "Device gets hot in the middle while doing nothing",
    ],
    related: [
      { device: "phone", partId: "logic-board" },
      { device: "tablet", partId: "mainboard" },
      { device: "laptop", partId: "mainboard" },
      { device: "watch", partId: "sip" },
    ],
  },
  {
    id: "pmic",
    ref: "U7 · PMIC",
    name: "Power management IC",
    x: -2.2,
    z: -1.1,
    w: 0.8,
    d: 0.62,
    h: 0.11,
    summary:
      "The power manager decides where every milliamp goes — screen, chip, radios, charging. When a device is completely dead even though the battery is fine, this chip is one of the first places we look.",
    tech: [
      "Regulates and sequences the main power rails (core, memory, display, RF) from the single battery voltage.",
      "Works with the charging IC on the charge path and reports battery state to the SoC.",
      "Failure modes: shorted buck rail after liquid exposure, cracked joints after board flex, degraded regulation causing random reboots.",
      "Bench signature: abnormal current draw on a USB ammeter at boot; a missing rail found on a diode-mode map.",
      "Rework: usually replacement rather than reflow, with underfill cleanup — a routine board-level job on our bench.",
    ],
    symptoms: [
      "Completely dead — no light, no vibration, nothing on a good charger",
      "Random shutdowns a new battery didn't fix",
      "Boot loops after getting wet",
    ],
    related: [
      { device: "phone", partId: "logic-board" },
      { device: "tablet", partId: "mainboard" },
      { device: "watch", partId: "sip" },
    ],
  },
  {
    id: "rf",
    ref: "U12 · RF",
    name: "RF transceiver",
    x: 2.35,
    z: 0.9,
    w: 0.66,
    d: 0.9,
    h: 0.1,
    summary:
      "The radio front-end that turns antenna signals into data — calls, mobile internet, GPS. When signal bars vanish but everything else works, the trail usually leads here or to the antennas.",
    tech: [
      "Converts between antenna RF and baseband signals across cellular / GPS bands.",
      "Failure modes: liquid corrosion around the RF shields, cracked matching passives after drops.",
      "Diagnosis order: antennas and connectors first — they fail far more often than the transceiver itself.",
      "Rework: shielded section; replacement needs care to keep matching networks intact.",
    ],
    symptoms: [
      "No signal bars where other phones have coverage",
      "Calls drop when you hold the device a certain way",
      "GPS takes forever to lock",
    ],
    related: [
      { device: "phone", partId: "logic-board" },
      { device: "drone", partId: "fc" },
    ],
  },
  {
    id: "nand",
    ref: "U4 · NAND",
    name: "NAND storage",
    x: 1.6,
    z: -1.45,
    w: 0.55,
    d: 0.55,
    h: 0.09,
    summary:
      "The chip that holds everything — photos, messages, the operating system itself. It's also the reason board-level repair matters: even from a dead device, this chip can often give your data back.",
    tech: [
      "Non-volatile flash storage; on modern phones it is cryptographically paired with the SoC.",
      "Failure modes: wear-out after heavy write cycles, corruption after sudden power loss, liquid damage to surrounding lines.",
      "Data recovery: because of SoC pairing, the NAND usually must move WITH its board — that is why 'dead board' data recovery is bench work, not software.",
      "Rework: BGA lift and reball; error-prone without practice — one of the strongest cases for professional repair.",
    ],
    symptoms: [
      "Stuck on the logo or a recovery screen",
      "Storage 'full' errors that make no sense",
      "Apps crash and files vanish",
    ],
    related: [
      { device: "phone", partId: "logic-board" },
      { device: "laptop", partId: "ssd" },
    ],
  },
  {
    id: "mosfet",
    ref: "Q3 · MOSFET",
    name: "Power MOSFET",
    x: -1.9,
    z: 1.35,
    w: 0.72,
    d: 0.5,
    h: 0.09,
    summary:
      "A heavy-duty electronic switch that gates big currents — charging, backlight, motor drive. When one fails it usually fails hard: shorted, warm, and stopping the whole rail behind it.",
    tech: [
      "Switches high-current paths (charge input, backlight boost, motor phases) under controller command.",
      "Failure modes: shorts from charge surges or cheap chargers, cracked packages after board flex, heat fatigue.",
      "Bench signature: a rail reading near-zero ohms to ground; the hot spot under thermal camera or rosin.",
      "Rework: straightforward replacement once located — finding WHICH one is shorted is the actual work.",
    ],
    symptoms: [
      "Device gets warm even when switched off",
      "Charger connects, then nothing happens at all",
      "Backlight dead but screen faintly visible at an angle",
    ],
    related: [
      { device: "phone", partId: "logic-board" },
      { device: "drone", partId: "esc" },
    ],
  },
  {
    id: "osc",
    ref: "XT1 · OSC",
    name: "Crystal oscillator",
    x: -0.4,
    z: -1.7,
    w: 0.5,
    d: 0.36,
    h: 0.08,
    summary:
      "The board's metronome — a tiny crystal that gives every other chip its sense of time. Without its steady tick, radios can't tune and the processor won't even start.",
    tech: [
      "Provides the reference clock for the SoC, baseband and RF sections.",
      "Failure modes: physical cracking from drops (crystals are mechanically fragile), liquid ingress under the can.",
      "Bench signature: completely dead board with clean power rails — the clock line flat on a scope.",
      "Rework: cheap component, careful sourcing — frequency and load capacitance must match exactly.",
    ],
    symptoms: [
      "Totally dead after a drop, even though it never got wet",
      "No mobile signal and wrong clock after a repair elsewhere",
    ],
    related: [{ device: "phone", partId: "logic-board" }],
  },
  {
    id: "chg",
    ref: "U9 · CHG",
    name: "USB / charging IC",
    x: 2.5,
    z: -0.15,
    w: 0.5,
    d: 0.5,
    h: 0.09,
    summary:
      "The gatekeeper between the charging cable and the battery. It negotiates with the charger, meters the current, and is famously the first casualty of cheap cables and car chargers.",
    tech: [
      "Handles USB detection/negotiation and controls the charge path into the battery (the Tristar/Hydra class on iPhones).",
      "Failure modes: voltage spikes from uncertified chargers and car adapters, liquid in the connector, static discharge.",
      "Bench signature: 'accessory may not be supported' style errors; device draws ~0 mA from a known-good source.",
      "Rework: well-understood replacement; one of the most common board-level jobs in any phone shop.",
    ],
    symptoms: [
      "Not charging at all, tried several cables",
      "Fake-charging: shows the bolt but the percentage never climbs",
      "Only charges from some chargers, not others",
    ],
    related: [
      { device: "phone", partId: "charge-port" },
      { device: "phone", partId: "logic-board" },
      { device: "tablet", partId: "charge-flex" },
    ],
  },
  {
    id: "audio",
    ref: "U5 · AUDIO",
    name: "Audio codec",
    x: -1.05,
    z: -0.35,
    w: 0.55,
    d: 0.55,
    h: 0.09,
    summary:
      "The chip that turns bits into sound and your voice back into bits. Every speaker, microphone and earpiece signal passes through it — so when it fails, audio fails everywhere at once.",
    tech: [
      "Digital-analog codec driving speakers/earpiece and digitising the microphones.",
      "Failure modes: board flex cracking its solder balls (the classic 'audio IC disease' on some iPhone generations), liquid corrosion.",
      "Bench signature: boot hangs several minutes, greyed-out voice memos / speakerphone, no mic on calls.",
      "Rework: replacement plus jumpering the flexed pad underneath — a documented, routine micro-soldering job.",
    ],
    symptoms: [
      "People can't hear you on calls but music plays fine",
      "Voice recorder greyed out or silent",
      "Boot takes minutes, then audio is missing",
    ],
    related: [
      { device: "phone", partId: "logic-board" },
      { device: "phone", partId: "speaker" },
    ],
  },
  {
    id: "bb",
    ref: "U10 · BB",
    name: "Baseband modem",
    x: 0.75,
    z: -1.0,
    w: 0.7,
    d: 0.55,
    h: 0.1,
    summary:
      "The cellular modem — a separate little computer that handles the phone network. 'No service' where there should be coverage, or a missing IMEI, points straight at this neighbourhood.",
    tech: [
      "Runs the cellular protocol stack; paired with its own power IC and the SIM interface.",
      "Failure modes: board flex under the package (bending pockets), liquid, drop impacts near the shield.",
      "Bench signature: permanent 'Searching…', IMEI missing in settings, modem absent in diagnostics.",
      "Rework: BGA replacement; on modern iPhones the baseband is serialized to the board — donor work must respect pairing.",
    ],
    symptoms: [
      "'No service' or 'Searching…' forever, SIM is fine in another phone",
      "IMEI shows blank in settings",
      "Mobile data dies but Wi-Fi still works",
    ],
    related: [{ device: "phone", partId: "logic-board" }],
  },
  {
    id: "wifi",
    ref: "U8 · WIFI",
    name: "Wi-Fi / Bluetooth module",
    x: -1.35,
    z: 0.4,
    w: 0.6,
    d: 0.5,
    h: 0.09,
    summary:
      "A combined radio for Wi-Fi and Bluetooth in one shielded module. Greyed-out Wi-Fi toggles and vanishing Bluetooth are its signature failures — often heat-related and very fixable.",
    tech: [
      "Combo WLAN/BT module with its own reference clock, sharing antennas via a diplexer.",
      "Failure modes: heat-cycle solder fatigue (the classic greyed-out Wi-Fi), liquid under the shield, ESD on the antenna feed.",
      "Bench signature: MAC address missing / toggle greyed out; short Bluetooth range with a detached antenna.",
      "Rework: reflow is temporary at best — proper fix is replacement under the shield.",
    ],
    symptoms: [
      "Wi-Fi toggle greyed out or turns itself off",
      "Bluetooth can't find anything unless it's touching the phone",
      "Wi-Fi only works within a metre of the router",
    ],
    related: [
      { device: "phone", partId: "logic-board" },
      { device: "tablet", partId: "mainboard" },
      { device: "watch", partId: "sip" },
    ],
  },
] as const satisfies readonly BoardIc[];

export type BoardIcId = (typeof BOARD_ICS)[number]["id"];
