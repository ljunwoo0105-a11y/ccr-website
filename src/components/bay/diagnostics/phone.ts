// ---------------------------------------------------------------------------
// Phone fault-trace wizard — REFERENCE IMPLEMENTATION for the other devices.
// Flat node graph; symptom trees converge on shared verdicts. See types.ts
// for the content rules (hedged language, no prices, /quote CTA, no-tools
// questions).
//
// Symptom trees: won't turn on, won't charge, battery drain, audio, camera,
// no signal, liquid damage. Ranks trace to docs/research/diagnostic-research.md
// — e.g. force-restart-first for won't-turn-on, display-flex as the cheaper
// screen fix, antennas-before-radio for no-signal, liquid rule-out first.
// ---------------------------------------------------------------------------

import type { DeviceDiagnostics, DiagNode } from "./types";
import type { PhonePartId } from "../rig-data/phone";

type N =
  // won't turn on
  | "np-q1"
  | "np-q2"
  | "np-q3"
  // won't charge
  | "nc-q1"
  | "nc-q2"
  // battery drain
  | "batt-q1"
  // audio
  | "audio-q1"
  | "audio-q2"
  // camera
  | "cam-q1"
  | "cam-q2"
  // no signal
  | "sig-q1"
  | "sig-q2"
  // liquid
  | "liq-q1"
  | "liq-q2"
  // verdicts
  | "v-firmware"
  | "v-screen-path"
  | "v-power-path"
  | "v-port-mech"
  | "v-battery-wear"
  | "v-battery-swell"
  | "v-earpiece"
  | "v-speaker-audio"
  | "v-mic-audio"
  | "v-audio-ic"
  | "v-front-camera"
  | "v-lens-cover"
  | "v-rear-camera"
  | "v-camera-board"
  | "v-antenna"
  | "v-baseband"
  | "v-liquid"
  | "v-liquid-clean";

const nodes: Record<N, DiagNode<PhonePartId, N>> = {
  // ---- Symptom: won't turn on --------------------------------------------
  "np-q1": {
    kind: "question",
    question:
      "Before anything else, try a force restart. Did it boot or show the logo?",
    help: "Quick-press Volume Up, quick-press Volume Down, then press and hold the Side button for about 15 seconds until the logo appears.",
    focusParts: ["battery", "logic-board"],
    options: [
      {
        id: "booted",
        label: "Yes — it booted or showed the logo",
        hint: "It came back to life, even briefly",
        next: "v-firmware",
      },
      {
        id: "no-change",
        label: "No change at all",
        hint: "Still completely unresponsive",
        next: "np-q2",
      },
    ],
  },
  "np-q2": {
    kind: "question",
    question: "Plug it into a charger you trust and wait. Any sign of life?",
    help: "Give it a good 15–30 minutes first — a deeply flat battery can look dead. Watch and listen for a charging LED, a vibration, a chime, or the back getting slightly warm.",
    focusParts: ["charge-port", "battery", "oled"],
    options: [
      {
        id: "no-signs",
        label: "No — completely dead",
        hint: "No light, no buzz, no warmth",
        next: "np-q3",
      },
      {
        id: "has-signs",
        label: "It reacts, but the screen stays black",
        hint: "Vibrates, chimes or shows a charge light",
        next: "v-screen-path",
      },
    ],
  },
  "np-q3": {
    kind: "question",
    question: "Does the cable click in firmly, or does it feel loose?",
    help: "Wiggle it gently. A worn or lint-packed port grips the plug badly.",
    focusParts: ["charge-port"],
    options: [
      { id: "loose", label: "Loose or wobbly", next: "v-port-mech" },
      { id: "firm", label: "Fits firmly", next: "v-power-path" },
    ],
  },

  // ---- Symptom: won't charge (screen works) ------------------------------
  "nc-q1": {
    kind: "question",
    question:
      "With the phone on, does plugging in show a charging icon at all?",
    focusParts: ["charge-port", "battery"],
    options: [
      { id: "never", label: "Never", next: "nc-q2" },
      {
        id: "sometimes",
        label: "Only at certain angles or with certain cables",
        hint: "You have to hold or prop the cable just right",
        next: "v-port-mech",
      },
      {
        id: "yes-drains",
        label: "It charges, but drains very fast",
        next: "batt-q1",
      },
    ],
  },
  "nc-q2": {
    kind: "question",
    question: "Have you tried a different cable AND wall adapter?",
    focusParts: ["charge-port"],
    options: [
      { id: "tried", label: "Yes — same problem", next: "v-power-path" },
      {
        id: "not-tried",
        label: "Not yet",
        hint: "Worth trying first — cables fail more often than phones",
        next: "v-port-mech",
      },
    ],
  },

  // ---- Symptom: battery drains fast --------------------------------------
  "batt-q1": {
    kind: "question",
    question:
      "Look at the phone side-on. Is the screen or back glass lifting, or does the body look swollen?",
    help: "A swollen battery pushes the panels apart — even a small gap counts.",
    focusParts: ["battery", "back-glass"],
    options: [
      { id: "swollen", label: "Yes — it's lifting or bulging", next: "v-battery-swell" },
      { id: "flat", label: "No, it looks normal", next: "v-battery-wear" },
    ],
  },

  // ---- Symptom: audio problems -------------------------------------------
  "audio-q1": {
    kind: "question",
    question: "Where is the sound problem?",
    help: "Test each path: play music aloud (loudspeaker), make a call held to your ear (earpiece), and record a quick voice memo then play it back (microphone).",
    focusParts: ["earpiece", "speaker", "top-mic"],
    options: [
      {
        id: "earpiece",
        label: "Only calls held to my ear are faint or dead",
        hint: "Speakerphone and music are fine",
        next: "audio-q2",
      },
      {
        id: "speaker",
        label: "Music, ringer or speakerphone is muffled or silent",
        next: "v-speaker-audio",
      },
      {
        id: "mic",
        label: "People say they can't hear ME",
        hint: "You hear them fine, they can't hear you",
        next: "v-mic-audio",
      },
    ],
  },
  "audio-q2": {
    kind: "question",
    question: "On a call, switch to speakerphone — is that clear?",
    help: "This tells apart the little earpiece at the top from the phone's wider audio circuit.",
    focusParts: ["earpiece", "speaker"],
    options: [
      {
        id: "earpiece-only",
        label: "Yes — speaker's fine, only the earpiece is bad",
        next: "v-earpiece",
      },
      {
        id: "both-ways",
        label: "No — audio's rough every way, and it booted slowly",
        next: "v-audio-ic",
      },
    ],
  },

  // ---- Symptom: camera problems ------------------------------------------
  "cam-q1": {
    kind: "question",
    question: "Which camera is affected?",
    focusParts: ["camera", "front-camera"],
    options: [
      { id: "rear", label: "The rear camera(s)", next: "cam-q2" },
      { id: "front", label: "The front / selfie camera", next: "v-front-camera" },
      {
        id: "both",
        label: "Both, or the camera app crashes / goes black",
        next: "v-camera-board",
      },
    ],
  },
  "cam-q2": {
    kind: "question",
    question: "Look at the glass over the rear lenses — cracked, scratched or foggy?",
    help: "Wipe it clean first, then check in good light for cracks or haze on the glass itself.",
    focusParts: ["lens-cover", "camera"],
    options: [
      {
        id: "glass-damaged",
        label: "Yes — the glass is cracked or hazy",
        next: "v-lens-cover",
      },
      {
        id: "glass-fine",
        label: "Glass looks fine, but photos are blurry or shaky",
        next: "v-rear-camera",
      },
    ],
  },

  // ---- Symptom: no signal ------------------------------------------------
  "sig-q1": {
    kind: "question",
    question: "How does the signal loss behave?",
    help: "Compare with a friend's phone on the same network standing in the same spot.",
    focusParts: ["upper-antenna", "lower-antenna"],
    options: [
      {
        id: "grip",
        label: "It comes and goes — worse when I grip it low or up top, or since a drop",
        next: "v-antenna",
      },
      {
        id: "always",
        label: "Always 'No Service' or 'Searching', even where others have bars",
        next: "sig-q2",
      },
    ],
  },
  "sig-q2": {
    kind: "question",
    question: "Did the No-Service trouble start right after the phone got wet?",
    focusParts: ["upper-antenna", "lower-antenna", "logic-board"],
    options: [
      { id: "after-liquid", label: "Yes — after liquid", next: "v-liquid" },
      { id: "just-stopped", label: "No — it just stopped one day", next: "v-baseband" },
    ],
  },

  // ---- Symptom: liquid damage --------------------------------------------
  "liq-q1": {
    kind: "question",
    question: "Unplug it now and stop charging. Is the phone dead, or does it still power on?",
    help: "Liquid plus charging is the dangerous combination — get it off power before anything else.",
    focusParts: ["charge-port", "battery", "logic-board"],
    options: [
      { id: "dead", label: "Dead — it won't turn on", next: "v-liquid" },
      {
        id: "powers-on",
        label: "It still powers on, but something's glitchy",
        hint: "Screen, charging, audio or touch acting up",
        next: "liq-q2",
      },
    ],
  },
  "liq-q2": {
    kind: "question",
    question:
      "Do you feel any warmth with nothing running, or see crust around the charging port or SIM slot?",
    help: "Corrosion looks like a powdery white or greenish film. Unexplained warmth is a red flag.",
    focusParts: ["charge-port", "battery"],
    options: [
      { id: "signs", label: "Yes — warm, or I can see corrosion", next: "v-liquid" },
      { id: "no-signs", label: "No obvious signs yet", next: "v-liquid-clean" },
    ],
  },

  // ---- Verdicts (shared across trees) -------------------------------------
  "v-firmware": {
    kind: "verdict",
    title: "LIKELY A SOFTWARE CRASH",
    summary:
      "A force restart bringing it back usually points at a software or firmware hiccup — a stuck update or a misbehaving app — rather than a hardware fault. Most of the time there are no parts to replace. If it keeps dropping dead, it is worth a bench check of the board and battery.",
    suspects: [
      {
        partIds: ["logic-board"],
        likelihood: "primary",
        why: "When a force restart revives a dead phone, the cause is almost always a software or firmware crash the board recovered from — usually cleared without any parts.",
      },
      {
        partIds: ["battery"],
        likelihood: "possible",
        why: "A tired cell that dips too low can trigger the same freeze, so we health-check it while we are in there.",
      },
    ],
    relatedIcs: [
      {
        icId: "nand",
        note: "Repeated stuck-on-logo crashes can trace to the U4 NAND storage — see the board-level bench.",
      },
    ],
  },
  "v-screen-path": {
    kind: "verdict",
    title: "DISPLAY PATH FAULT",
    summary:
      "Your phone is taking power and booting — it just can't show you. That most likely points at the display stack rather than the board. Often it is the panel itself, though sometimes just its ribbon cable, which is the cheaper fix.",
    suspects: [
      {
        partIds: ["oled"],
        likelihood: "primary",
        why: "A panel that no longer lights while the phone runs is the classic OLED failure after a drop or pressure damage.",
      },
      {
        partIds: ["display-flex"],
        likelihood: "likely",
        why: "Often it is just the display's ribbon cable unseated or torn after a knock — a cheaper fix than the whole panel, so we check it first.",
      },
      {
        partIds: ["logic-board"],
        likelihood: "possible",
        why: "Less often, the display driver circuit on the board is at fault — we test this before replacing anything.",
      },
    ],
    relatedIcs: [
      {
        icId: "pmic",
        note: "A dead backlight rail on the board can mimic a broken screen — the U7 power manager drives it.",
      },
    ],
  },
  "v-power-path": {
    kind: "verdict",
    title: "POWER PATH FAULT",
    summary:
      "No reaction on a known-good charger usually means power isn't reaching the phone — most likely the charging port, a deeply flat battery, or the power circuit on the main board. A bench diagnosis pins it down; the assessment is free.",
    suspects: [
      {
        partIds: ["charge-port"],
        likelihood: "primary",
        why: "The port takes every plug cycle and every pocket-lint deposit — it is the most common culprit in dead-device jobs.",
      },
      {
        partIds: ["battery"],
        likelihood: "likely",
        why: "A deeply discharged or failed cell can refuse to accept charge at all.",
      },
      {
        partIds: ["logic-board"],
        likelihood: "possible",
        why: "If the port and battery test fine, the power-management circuit on the board is next in line.",
      },
    ],
    relatedIcs: [
      {
        icId: "pmic",
        note: "Dead-on-arrival phones often trace to the U7 power-management IC — see the board-level bench below.",
      },
      {
        icId: "chg",
        note: "The U9 charging IC is a frequent culprit when a phone won't take charge.",
      },
    ],
  },
  "v-port-mech": {
    kind: "verdict",
    title: "CHARGE PORT — MECHANICAL / DEBRIS",
    summary:
      "A loose-feeling or angle-fussy connection usually means the port is worn, damaged or simply packed with lint. Sometimes a professional clean is all it needs — we check that before quoting a replacement.",
    suspects: [
      {
        partIds: ["charge-port"],
        likelihood: "primary",
        why: "Worn spring contacts or compacted debris stop the plug seating — the most repaired connector in the shop.",
      },
      {
        partIds: ["battery"],
        likelihood: "possible",
        why: "If the port checks out clean, an ageing cell can mimic charging trouble.",
      },
    ],
    relatedIcs: [
      {
        icId: "chg",
        note: "Persistent charging faults after a new port point to the U9 charging IC on the board.",
      },
    ],
  },
  "v-battery-wear": {
    kind: "verdict",
    title: "BATTERY WEAR",
    summary:
      "Charging fine but draining fast is the signature of a worn cell. Most likely a straightforward battery replacement — done with a health check, usually while you wait.",
    suspects: [
      {
        partIds: ["battery"],
        likelihood: "primary",
        why: "Lithium cells fade with charge cycles — rapid drain and random shutdowns are the standard symptoms.",
      },
      {
        partIds: ["logic-board"],
        likelihood: "possible",
        why: "Rarely, a power-hungry fault on the board drains even a healthy cell.",
      },
    ],
    relatedIcs: [
      {
        icId: "pmic",
        note: "Unexplained drain after a new battery can be a leaky power rail — a U7 PMIC job on the bench.",
      },
    ],
  },
  "v-battery-swell": {
    kind: "verdict",
    title: "SWOLLEN BATTERY — HANDLE WITH CARE",
    urgent: true,
    summary:
      "Stop charging it and power it down if you can. A swollen cell is pressure-loaded and should not be squeezed or punctured. Bring it in as soon as you can — replacement is routine for us, and the sooner it's out, the safer your screen and data are.",
    suspects: [
      {
        partIds: ["battery"],
        likelihood: "primary",
        why: "Gas build-up inside a failing cell physically pushes the phone apart — it will not improve on its own.",
      },
      {
        partIds: ["back-glass"],
        likelihood: "possible",
        why: "Panels lifted by the swelling often need resealing or replacement once the new cell is in.",
      },
    ],
  },
  "v-earpiece": {
    kind: "verdict",
    title: "EARPIECE SPEAKER",
    summary:
      "If speakerphone is clear but the earpiece isn't, the small speaker at the top is the usual suspect — sometimes just clogged with dust, sometimes worn out. A clean or a swap normally sorts it.",
    suspects: [
      {
        partIds: ["earpiece"],
        likelihood: "primary",
        why: "The top earpiece collects years of pocket lint; a muffled or dead earpiece alongside a working loudspeaker points straight at it.",
      },
      {
        partIds: ["logic-board"],
        likelihood: "possible",
        why: "Rarely the audio circuit on the board is behind it — we test that before quoting a part.",
      },
    ],
    relatedIcs: [
      {
        icId: "audio",
        note: "If every audio path is weak, the U5 audio codec on the board is the likely root.",
      },
    ],
  },
  "v-speaker-audio": {
    kind: "verdict",
    title: "LOUDSPEAKER FAULT",
    summary:
      "Muffled, crackly or silent music and ringtones usually mean the bottom loudspeaker is blocked or blown. Often a clean or a driver swap brings it back.",
    suspects: [
      {
        partIds: ["speaker"],
        likelihood: "primary",
        why: "The loudspeaker breathes dust and moisture through its grille; crackle and drop-outs are its classic wear symptoms.",
      },
      {
        partIds: ["logic-board"],
        likelihood: "possible",
        why: "If a new speaker doesn't help, the board's audio codec is next in line.",
      },
    ],
    relatedIcs: [
      {
        icId: "audio",
        note: "All-paths audio loss with a slow boot is the signature of the U5 audio codec.",
      },
    ],
  },
  "v-mic-audio": {
    kind: "verdict",
    title: "MICROPHONE FAULT",
    summary:
      "When people can't hear you but you can hear them, a microphone is usually the culprit — the top noise-cancelling mic or the main mic down by the charging port. We test each to pin the right one.",
    suspects: [
      {
        partIds: ["top-mic"],
        likelihood: "primary",
        why: "The top mic handles noise cancelling and video sound; muffled or missing outgoing voice often traces here.",
      },
      {
        partIds: ["charge-port"],
        likelihood: "likely",
        why: "The main call mic rides on the charging-port flex — a common second suspect when callers can't hear you.",
      },
      {
        partIds: ["logic-board"],
        likelihood: "possible",
        why: "If both mics test bad together, the audio circuit on the board is the likely root.",
      },
    ],
    relatedIcs: [
      {
        icId: "audio",
        note: "Both mics dead at once points past the parts to the U5 audio codec on the board.",
      },
    ],
  },
  "v-audio-ic": {
    kind: "verdict",
    title: "AUDIO CIRCUIT — BOARD LEVEL",
    summary:
      "Audio that's rough on every path — earpiece, speaker and mic — especially after a slow boot, tends to point past the individual parts to the audio circuit on the main board. That's a board-level job, and a common, well-understood one.",
    suspects: [
      {
        partIds: ["logic-board"],
        likelihood: "primary",
        why: "When every audio path fails at once and boots drag on, the board's audio codec is the usual root — a documented micro-soldering repair.",
      },
      {
        partIds: ["earpiece"],
        likelihood: "possible",
        why: "We still confirm the earpiece and speaker aren't separately faulty before any board work.",
      },
    ],
    relatedIcs: [
      {
        icId: "audio",
        note: "Cracked joints under the U5 audio codec are the classic cause of all-audio-gone plus a slow boot.",
      },
    ],
  },
  "v-front-camera": {
    kind: "verdict",
    title: "FRONT CAMERA",
    summary:
      "Blurry, black or failing selfie shots — and Face-unlock trouble — usually point at the front camera module. A replacement normally restores both photos and secure unlock.",
    suspects: [
      {
        partIds: ["front-camera"],
        likelihood: "primary",
        why: "A dead or hazy selfie camera, or Face unlock that stopped working, is the front module's classic failure after a drop or moisture.",
      },
      {
        partIds: ["logic-board"],
        likelihood: "possible",
        why: "If a new module doesn't help, the camera interface on the board is the next check.",
      },
    ],
  },
  "v-lens-cover": {
    kind: "verdict",
    title: "REAR LENS GLASS",
    summary:
      "Cracked or scratched glass over the rear lenses scatters light and blurs photos — but the camera underneath is often perfectly fine. Replacing just the lens cover is usually the cheaper fix, so we check it first.",
    suspects: [
      {
        partIds: ["lens-cover"],
        likelihood: "primary",
        why: "Shattered or foggy lens glass is the most common reason for hazy rear photos when the camera itself still focuses.",
      },
      {
        partIds: ["camera"],
        likelihood: "possible",
        why: "If clean glass doesn't sharpen things up, the camera module behind it is the next suspect.",
      },
    ],
  },
  "v-rear-camera": {
    kind: "verdict",
    title: "REAR CAMERA MODULE",
    summary:
      "Blurry, shaky or rattly photos with clean lens glass usually mean the rear camera's focus or stabilisation has failed. A module swap normally brings sharp shots back.",
    suspects: [
      {
        partIds: ["camera"],
        likelihood: "primary",
        why: "A rattle when you shake the phone, or photos that never sharpen, are the tell-tale signs of failed OIS or autofocus in the rear module.",
      },
      {
        partIds: ["lens-cover"],
        likelihood: "possible",
        why: "We double-check the lens glass isn't the real culprit before replacing the module.",
      },
    ],
  },
  "v-camera-board": {
    kind: "verdict",
    title: "CAMERA — BOARD / SOFTWARE",
    summary:
      "When every camera fails together, or the camera app crashes or freezes on a black frame, the trail usually leads past the modules to the board or software. A bench test tells us which — and the assessment is free.",
    suspects: [
      {
        partIds: ["logic-board"],
        likelihood: "primary",
        why: "Both cameras dead at once, or an app that black-screens, more often points at the shared camera circuit on the board than at two modules failing together.",
      },
      {
        partIds: ["camera"],
        likelihood: "possible",
        why: "We still test each module directly in case one is dragging the shared line down.",
      },
      {
        partIds: ["front-camera"],
        likelihood: "possible",
        why: "The front module is checked the same way before any board work.",
      },
    ],
    relatedIcs: [
      {
        icId: "soc",
        note: "A camera app that crashes system-wide can trace to the U1 SoC's image processor.",
      },
    ],
  },
  "v-antenna": {
    kind: "verdict",
    title: "ANTENNA PATH",
    summary:
      "Signal that comes and goes — worse when you grip the phone low or up top, or since a drop — usually points at the antennas along the edges rather than the radio itself. They're a common, fixable fault.",
    suspects: [
      {
        partIds: ["upper-antenna", "lower-antenna"],
        label: "Antennas (top & bottom)",
        likelihood: "primary",
        why: "Edge antennas and their spring contacts loosen after drops; signal that changes with your grip is their signature — and they fail far more often than the radio chip.",
      },
      {
        partIds: ["logic-board"],
        likelihood: "possible",
        why: "If the antennas test good, the RF section on the board is next — checked before any board-level work.",
      },
    ],
    relatedIcs: [
      {
        icId: "rf",
        note: "Persistent loss with healthy antennas points at the U12 RF transceiver.",
      },
    ],
  },
  "v-baseband": {
    kind: "verdict",
    title: "CELLULAR / MODEM PATH",
    summary:
      "A constant 'No Service' or 'Searching', even where other phones have full bars, tends to point at the modem section of the board — especially if it started on its own. It's a board-level job we diagnose for free.",
    suspects: [
      {
        partIds: ["logic-board"],
        likelihood: "primary",
        why: "Permanent no-service with a SIM that works elsewhere, or a blank IMEI, is the classic baseband-modem signature on the board.",
      },
      {
        partIds: ["upper-antenna", "lower-antenna"],
        label: "Antennas (top & bottom)",
        likelihood: "likely",
        why: "We rule the antennas out first — they're the cheaper and more common fault.",
      },
    ],
    relatedIcs: [
      {
        icId: "bb",
        note: "A blank IMEI or permanent 'Searching' points at the U10 baseband modem.",
      },
      {
        icId: "rf",
        note: "The U12 RF transceiver is the neighbouring suspect on the board.",
      },
    ],
  },
  "v-liquid": {
    kind: "verdict",
    title: "LIQUID DAMAGE — ACT NOW",
    urgent: true,
    summary:
      "Stop charging it and leave it switched off. Liquid inside conducts where it shouldn't and starts corrosion within hours, so the safest move is to bring it in for a proper clean rather than charge it or bury it in rice. The sooner the board is cleaned, the more we can save — including your data.",
    suspects: [
      {
        partIds: ["charge-port"],
        likelihood: "primary",
        why: "The charging port is the first place liquid pools and corrodes, and charging a wet phone is where the real damage happens — it's our first stop.",
      },
      {
        partIds: ["logic-board"],
        likelihood: "likely",
        why: "Liquid spreads across the board and eats at it over days; an ultrasonic clean now is what protects it.",
      },
      {
        partIds: ["battery"],
        likelihood: "possible",
        why: "Liquid and heat can push a cell toward swelling, so we check and isolate the battery as part of the clean.",
      },
    ],
    relatedIcs: [
      {
        icId: "pmic",
        note: "Boot loops after a soaking often trace to a shorted rail on the U7 power manager.",
      },
      {
        icId: "chg",
        note: "The U9 charging IC is a frequent liquid casualty.",
      },
    ],
  },
  "v-liquid-clean": {
    kind: "verdict",
    title: "LIQUID — CLEAN IT BEFORE IT SPREADS",
    urgent: true,
    summary:
      "Even working fine, a phone that's been wet is on a clock — corrosion keeps spreading under the shields for days after it dries. Please don't keep charging it; a professional clean now is the difference between a quick job and a dead board later.",
    suspects: [
      {
        partIds: ["logic-board"],
        likelihood: "primary",
        why: "Invisible corrosion creeps across the board after any liquid contact; cleaning it early is what prevents a later no-power failure.",
      },
      {
        partIds: ["charge-port"],
        likelihood: "likely",
        why: "The port and its flex corrode first and are worth cleaning or replacing before they fail.",
      },
      {
        partIds: ["battery"],
        likelihood: "possible",
        why: "We check the cell for early swelling, since liquid and heat can start it off.",
      },
    ],
    relatedIcs: [
      {
        icId: "pmic",
        note: "Delayed no-power a few days after a soaking usually points at the U7 power manager.",
      },
    ],
  },
};

const PHONE_DIAGNOSTICS: DeviceDiagnostics<PhonePartId, N> = {
  device: "phone",
  symptoms: [
    {
      id: "no-power",
      label: "Won't turn on",
      tagline: "Black screen, no response",
      start: "np-q1",
    },
    {
      id: "no-charge",
      label: "Won't charge",
      tagline: "Screen works, battery won't fill",
      start: "nc-q1",
    },
    {
      id: "battery-drain",
      label: "Battery drains fast",
      tagline: "Dies before the day does",
      start: "batt-q1",
    },
    {
      id: "audio",
      label: "Sound problems",
      tagline: "Earpiece, speaker or mic",
      start: "audio-q1",
    },
    {
      id: "camera",
      label: "Camera trouble",
      tagline: "Blurry, black or crashing",
      start: "cam-q1",
    },
    {
      id: "no-signal",
      label: "No signal",
      tagline: "'No Service' or dropped calls",
      start: "sig-q1",
    },
    {
      id: "liquid",
      label: "Liquid damage",
      tagline: "Got wet — act quickly",
      start: "liq-q1",
    },
  ],
  nodes,
};

export default PHONE_DIAGNOSTICS;
