// ---------------------------------------------------------------------------
// Tablet fault-trace wizard. Flat node graph; symptom trees converge on shared
// verdicts. See phone.ts for the reference and types.ts for the content rules
// (hedged language, no prices, /quote CTA, no-tools questions).
//
// Twin battery cells are always grouped as one suspect:
//   { partIds: ["battery-l", "battery-r"], label: "Battery (both cells)" }.
// ---------------------------------------------------------------------------

import type { DeviceDiagnostics, DiagNode } from "./types";
import type { TabletPartId } from "../rig-data/tablet";

type N =
  // won't turn on
  | "np-q1"
  | "np-q2"
  | "np-q3"
  // won't charge
  | "nc-q1"
  | "nc-q2"
  // cracked / black screen
  | "scr-q1"
  | "scr-q2"
  | "scr-q3"
  // battery drain / swelling
  | "batt-q1"
  | "batt-q2"
  // audio
  | "aud-q1"
  | "aud-q2"
  // camera
  | "cam-q1"
  | "cam-q2"
  // no Wi-Fi / cellular
  | "net-q1"
  | "net-q2"
  | "net-q3"
  // liquid
  | "liq-q1"
  | "liq-q2"
  // verdicts
  | "v-power-path"
  | "v-logic"
  | "v-screen-path"
  | "v-port-mech"
  | "v-charge-ic"
  | "v-digitiser"
  | "v-display-flex"
  | "v-battery-wear"
  | "v-battery-swell"
  | "v-audio"
  | "v-audio-codec"
  | "v-camera"
  | "v-camera-board"
  | "v-wifi"
  | "v-cell"
  | "v-connectivity-board"
  | "v-liquid"
  | "v-liquid-urgent";

const nodes: Record<N, DiagNode<TabletPartId, N>> = {
  // ---- Symptom: won't turn on --------------------------------------------
  "np-q1": {
    kind: "question",
    question:
      "Plug it into a charger you trust and leave it 15 minutes. Any sign of life?",
    help: "Watch and listen: a charge icon, the boot logo, a chime, or gentle warmth on the back. Tablet packs can be flat enough to look dead.",
    focusParts: ["charge-flex", "battery-l", "battery-r", "lcd"],
    options: [
      {
        id: "no-signs",
        label: "No — nothing at all after 15 minutes",
        hint: "No icon, no logo, no warmth",
        next: "np-q2",
      },
      {
        id: "reacts",
        label: "It chimes or warms up, but the screen stays black",
        hint: "You hear or feel it, you just can't see it",
        next: "v-screen-path",
      },
      {
        id: "logo-loop",
        label: "The logo appears, then it loops or dies",
        hint: "Stuck on the logo, over and over",
        next: "v-logic",
      },
    ],
  },
  "np-q2": {
    kind: "question",
    question: "Does the charging cable click in firmly, or feel loose?",
    help: "Wiggle it gently. Tablet ports collect pocket lint and dust and lose their grip.",
    focusParts: ["charge-flex"],
    options: [
      {
        id: "loose",
        label: "Loose, wobbly, or only works at an angle",
        next: "v-port-mech",
      },
      { id: "firm", label: "Fits firmly, still nothing", next: "np-q3" },
    ],
  },
  "np-q3": {
    kind: "question",
    question:
      "With a known-good cable and plug, rest a hand on the back after a few minutes. Any warmth?",
    help: "A little warmth means power is at least reaching the board; stone cold usually means it isn't getting in.",
    focusParts: ["mainboard", "battery-l", "battery-r"],
    options: [
      {
        id: "cold",
        label: "Stone cold, no flicker at all",
        next: "v-power-path",
      },
      {
        id: "warm",
        label: "A patch warms up, but it still won't boot",
        next: "v-logic",
      },
    ],
  },

  // ---- Symptom: won't charge (screen works) ------------------------------
  "nc-q1": {
    kind: "question",
    question: "With the tablet on, plug it in. Does a charging bolt appear?",
    focusParts: ["charge-flex", "battery-l", "battery-r"],
    options: [
      { id: "never", label: "Never — no bolt at all", next: "nc-q2" },
      {
        id: "angle",
        label: "Only at certain angles or with certain cables",
        hint: "You have to prop or hold the cable just right",
        next: "v-port-mech",
      },
      {
        id: "fake",
        label: "The bolt shows, but the percentage never climbs",
        hint: "Says it's charging, but it isn't",
        next: "v-charge-ic",
      },
    ],
  },
  "nc-q2": {
    kind: "question",
    question:
      "Have you tried another cable AND a higher-power wall plug — not a low-watt phone charger?",
    help: "Tablets draw more than phones; a weak plug or a tired cable is the most common cause and the easiest to rule out.",
    focusParts: ["charge-flex"],
    options: [
      { id: "tried", label: "Yes — same problem", next: "v-power-path" },
      {
        id: "not-tried",
        label: "Not yet",
        hint: "Worth trying first — cables and plugs fail more often than tablets",
        next: "v-port-mech",
      },
    ],
  },

  // ---- Symptom: cracked or black screen ----------------------------------
  "scr-q1": {
    kind: "question",
    question: "Is the glass physically cracked, or is the picture wrong on intact glass?",
    focusParts: ["digitiser", "lcd", "display-flex"],
    options: [
      { id: "cracked", label: "The glass is cracked or chipped", next: "scr-q2" },
      {
        id: "intact",
        label: "Glass looks fine, but the picture is bad or black",
        next: "scr-q3",
      },
    ],
  },
  "scr-q2": {
    kind: "question",
    question:
      "Away from the shattered area, does touch still respond and the picture look normal?",
    help: "Run a finger across the intact part of the glass and watch it react.",
    focusParts: ["digitiser", "lcd"],
    options: [
      {
        id: "glass-only",
        label: "Touch works and the picture is fine — just cracked glass",
        next: "v-digitiser",
      },
      {
        id: "more",
        label: "Touch is dead in places, or the picture is affected too",
        next: "v-screen-path",
      },
    ],
  },
  "scr-q3": {
    kind: "question",
    question: "What is the screen actually doing?",
    focusParts: ["lcd", "display-flex", "mainboard"],
    options: [
      {
        id: "black-alive",
        label: "Totally black, but it still makes sound or vibrates",
        next: "v-screen-path",
      },
      {
        id: "lines",
        label: "Lines, blotches, or a dead patch in the picture",
        next: "v-screen-path",
      },
      {
        id: "flicker",
        label: "Flickers or blinks, worse when I flex or press near an edge",
        next: "v-display-flex",
      },
    ],
  },

  // ---- Symptom: battery drain / swelling ---------------------------------
  "batt-q1": {
    kind: "question",
    question:
      "Lay it flat and look edge-on. Is the screen or back lifting, is the body bulging, or does it rock on the table?",
    help: "A swollen cell pushes the panels apart — even a small gap, a lifted corner, or a wobble on a flat table counts.",
    focusParts: ["battery-l", "battery-r", "digitiser"],
    options: [
      {
        id: "swollen",
        label: "Yes — it's lifting, bulging, or rocks on the table",
        next: "v-battery-swell",
      },
      { id: "flat", label: "No, it looks flat and sealed", next: "batt-q2" },
    ],
  },
  "batt-q2": {
    kind: "question",
    question: "When does it drain the fastest?",
    focusParts: ["battery-l", "battery-r", "mainboard"],
    options: [
      {
        id: "idle",
        label: "Even while asleep or just sitting idle",
        next: "v-battery-wear",
      },
      {
        id: "shutdown",
        label: "It shuts down with charge left, then won't restart until charged",
        next: "v-battery-wear",
      },
      {
        id: "hot-load",
        label: "Only under games or video, with a hot spot near the middle",
        next: "v-logic",
      },
    ],
  },

  // ---- Symptom: audio -----------------------------------------------------
  "aud-q1": {
    kind: "question",
    question: "Play something with the volume up. What do you hear?",
    help: "First check the on-screen volume isn't at zero and no headphone or Bluetooth icon is showing.",
    focusParts: ["speakers", "speakers-top", "mainboard"],
    options: [
      {
        id: "silent",
        label: "Nothing at all from any speaker",
        next: "aud-q2",
      },
      {
        id: "one-side",
        label: "Sound from one side or end only",
        next: "v-audio",
      },
      {
        id: "distorted",
        label: "Crackly, buzzy, or distorted",
        next: "v-audio",
      },
    ],
  },
  "aud-q2": {
    kind: "question",
    question:
      "Plug in headphones or pair a Bluetooth speaker. Does audio play through those?",
    help: "This tells us whether the built-in speakers are the problem or the sound is failing further upstream.",
    focusParts: ["speakers", "speakers-top", "mainboard"],
    options: [
      {
        id: "external-ok",
        label: "Yes — external works, the built-in speakers don't",
        next: "v-audio",
      },
      {
        id: "external-dead",
        label: "No — nothing plays, even through headphones",
        next: "v-audio-codec",
      },
    ],
  },

  // ---- Symptom: camera ----------------------------------------------------
  "cam-q1": {
    kind: "question",
    question: "Open the camera app. What do you see?",
    focusParts: ["camera", "front-camera", "mainboard"],
    options: [
      {
        id: "black",
        label: "A black or frozen preview",
        next: "cam-q2",
      },
      {
        id: "blurry",
        label: "It opens, but photos are blurry or won't focus",
        next: "v-camera",
      },
      {
        id: "cracked",
        label: "It works, but the lens glass is cracked",
        next: "v-camera",
      },
    ],
  },
  "cam-q2": {
    kind: "question",
    question: "Tap the switch-camera button. Does the front OR rear camera work on its own?",
    help: "If one side shows a picture and the other stays black, the fault is usually just that one module.",
    focusParts: ["camera", "front-camera", "mainboard"],
    options: [
      {
        id: "one-ok",
        label: "One works, the other stays black",
        next: "v-camera",
      },
      {
        id: "both-dead",
        label: "Both are black, or the camera app keeps crashing",
        next: "v-camera-board",
      },
    ],
  },

  // ---- Symptom: no Wi-Fi / cellular --------------------------------------
  "net-q1": {
    kind: "question",
    question: "Which connection is giving you trouble?",
    focusParts: ["antenna-wifi", "antenna-cell", "mainboard"],
    options: [
      {
        id: "wifi",
        label: "Wi-Fi and Bluetooth — short range or dropping out",
        next: "net-q2",
      },
      {
        id: "cell",
        label: "Mobile data or SIM, on a cellular model",
        next: "net-q3",
      },
      {
        id: "all",
        label: "Everything wireless has stopped at once",
        next: "v-connectivity-board",
      },
    ],
  },
  "net-q2": {
    kind: "question",
    question:
      "Standing next to the router, is Wi-Fi fine up close but weak a room away — or does the toggle grey out on its own?",
    help: "Compare it to a phone on the same network standing in the same spot.",
    focusParts: ["antenna-wifi", "mainboard"],
    options: [
      {
        id: "range",
        label: "Fine up close, weak or dropping with distance",
        next: "v-wifi",
      },
      {
        id: "greyed",
        label: "The Wi-Fi toggle greys out or turns itself off",
        next: "v-connectivity-board",
      },
    ],
  },
  "net-q3": {
    kind: "question",
    question: "Does it detect the SIM, and does a known-good SIM from another device work?",
    help: "Swap in a SIM you know works elsewhere to separate the SIM from the tablet.",
    focusParts: ["antenna-cell", "mainboard"],
    options: [
      {
        id: "no-sim",
        label: "It won't detect any SIM, even a known-good one",
        next: "v-connectivity-board",
      },
      {
        id: "no-bars",
        label: "SIM shows, but no signal where other phones get bars",
        next: "v-cell",
      },
    ],
  },

  // ---- Symptom: liquid ----------------------------------------------------
  "liq-q1": {
    kind: "question",
    question: "Right after it got wet, what is it doing?",
    help: "Don't charge a wet tablet — powering a damp board is when most corrosion damage happens. If it's off, leave it off.",
    focusParts: ["mainboard", "charge-flex", "battery-l", "battery-r"],
    options: [
      {
        id: "off",
        label: "Still off — I haven't tried to power it on",
        next: "v-liquid",
      },
      {
        id: "glitchy",
        label: "On but glitching — ghost touch, flickers, or random restarts",
        next: "liq-q2",
      },
      {
        id: "hot",
        label: "It got hot, smells odd, or the battery looks swollen",
        next: "v-liquid-urgent",
      },
    ],
  },
  "liq-q2": {
    kind: "question",
    question: "On the charger, does it behave — or refuse and act strangely?",
    focusParts: ["charge-flex", "mainboard", "battery-l", "battery-r"],
    options: [
      {
        id: "mostly-ok",
        label: "Charges and mostly works, just glitchy",
        next: "v-liquid",
      },
      {
        id: "bad",
        label: "Won't charge, or gets warm and does nothing",
        next: "v-liquid-urgent",
      },
    ],
  },

  // ---- Verdicts (shared across trees) -------------------------------------
  "v-power-path": {
    kind: "verdict",
    title: "POWER PATH FAULT",
    summary:
      "No reaction on a known-good charger usually means power isn't reaching the tablet — most likely the charging flex, a deeply flat battery pack, or the power circuit on the main board. A free bench assessment pins it down.",
    suspects: [
      {
        partIds: ["charge-flex"],
        likelihood: "primary",
        why: "The port ribbon takes every plug cycle and every bit of pocket lint — it is the most common culprit in dead-tablet jobs.",
      },
      {
        partIds: ["battery-l", "battery-r"],
        likelihood: "likely",
        label: "Battery (both cells)",
        why: "A deeply discharged or imbalanced twin pack can refuse to accept charge at all.",
      },
      {
        partIds: ["mainboard"],
        likelihood: "possible",
        why: "If the port and cells test fine, the board's power circuit is next in line.",
      },
    ],
    relatedIcs: [
      {
        icId: "pmic",
        note: "Dead-on-arrival tablets often trace to the power-management IC on the board.",
      },
      {
        icId: "chg",
        note: "The charging IC is a frequent culprit when a tablet won't take charge at all.",
      },
    ],
  },
  "v-logic": {
    kind: "verdict",
    title: "BOOT / LOGIC FAULT",
    summary:
      "Powering up but never finishing the boot — a logo loop, or a board that draws power and warms without starting — usually points at the main board or its software, rather than the screen or battery. Many of these clear with a software recovery on the bench before any parts are discussed.",
    suspects: [
      {
        partIds: ["mainboard"],
        likelihood: "primary",
        why: "A board that takes power but never boots is the classic logo-loop pattern, whether the cause is firmware or a failing chip.",
      },
      {
        partIds: ["battery-l", "battery-r"],
        likelihood: "possible",
        label: "Battery (both cells)",
        why: "A pack too weak to hold the boot can also cause repeated restarts, so we test it first.",
      },
    ],
    relatedIcs: [
      {
        icId: "soc",
        note: "Persistent boot loops with no damage history often centre on the main processor.",
      },
      {
        icId: "pmic",
        note: "An unstable power rail from the power-management IC can stall a boot part-way.",
      },
    ],
  },
  "v-screen-path": {
    kind: "verdict",
    title: "DISPLAY PATH FAULT",
    summary:
      "The tablet is taking power and running — it just can't show you. That most likely points at the display stack rather than the board. A screen replacement usually brings it straight back.",
    suspects: [
      {
        partIds: ["lcd"],
        likelihood: "primary",
        why: "A panel that stays dark or shows lines while the tablet runs is the classic LCD failure after a drop or pressure damage.",
      },
      {
        partIds: ["display-flex"],
        likelihood: "likely",
        why: "A pinched or torn display ribbon produces the same black or garbled picture, so we check it before replacing the panel.",
      },
      {
        partIds: ["mainboard"],
        likelihood: "possible",
        why: "Less often, the display driver circuit on the board is at fault — we test this before replacing anything.",
      },
    ],
    relatedIcs: [
      {
        icId: "pmic",
        note: "A dead backlight rail on the board can mimic a broken screen — the power-management IC drives it.",
      },
    ],
  },
  "v-port-mech": {
    kind: "verdict",
    title: "CHARGE PORT — MECHANICAL / DEBRIS",
    summary:
      "A loose-feeling or angle-fussy connection usually means the port is worn, damaged, or simply packed with lint. Sometimes a professional clean is all it needs — we check that before quoting a replacement.",
    suspects: [
      {
        partIds: ["charge-flex"],
        likelihood: "primary",
        why: "Worn contacts or compacted debris stop the plug seating — the most repaired connector in the shop.",
      },
      {
        partIds: ["battery-l", "battery-r"],
        likelihood: "possible",
        label: "Battery (both cells)",
        why: "If the port checks out clean, an ageing pack can mimic charging trouble.",
      },
    ],
    relatedIcs: [
      {
        icId: "chg",
        note: "Charging faults that survive a new port point to the charging IC on the board.",
      },
    ],
  },
  "v-charge-ic": {
    kind: "verdict",
    title: "CHARGING FAULT — LIKELY BOARD-LEVEL",
    summary:
      "A charging bolt that shows but never fills is a classic 'fake charge' — the tablet sees the plug but isn't moving power into the cells. We'd rule out the port and pack first, but this pattern often lands on the charging circuit.",
    suspects: [
      {
        partIds: ["charge-flex"],
        likelihood: "primary",
        why: "A partly failed port can announce a charger while passing almost no current — always worth ruling out first.",
      },
      {
        partIds: ["battery-l", "battery-r"],
        likelihood: "likely",
        label: "Battery (both cells)",
        why: "A pack that won't take a charge shows the bolt but never climbs.",
      },
      {
        partIds: ["mainboard"],
        likelihood: "possible",
        why: "If port and cells test good, the charging circuit on the board is the next suspect.",
      },
    ],
    relatedIcs: [
      {
        icId: "chg",
        note: "Fake-charging tablets frequently trace to the charging IC on the board.",
      },
      {
        icId: "pmic",
        note: "The power-management IC shares the blame when charge shows but never lands.",
      },
    ],
  },
  "v-digitiser": {
    kind: "verdict",
    title: "CRACKED GLASS — TOUCH LAYER",
    summary:
      "Cracked glass with a normal picture underneath is usually just the bonded touch layer. On most tablets that means a glass (digitiser) replacement; we confirm the panel below is unharmed before quoting.",
    suspects: [
      {
        partIds: ["digitiser"],
        likelihood: "primary",
        why: "The large bonded glass is the part that takes the impact — cracks and dead touch strips live here first.",
      },
      {
        partIds: ["lcd"],
        likelihood: "possible",
        why: "A hard enough knock can mark the panel under the glass, so we test the picture before ordering parts.",
      },
    ],
  },
  "v-display-flex": {
    kind: "verdict",
    title: "DISPLAY RIBBON FAULT",
    summary:
      "A picture that flickers, blinks, or drops out when you flex the tablet usually points at the display ribbon or its connector rather than the panel itself. It's a common, very fixable fault.",
    suspects: [
      {
        partIds: ["display-flex"],
        likelihood: "primary",
        why: "A ribbon that only misbehaves when flexed is the signature of a cracked trace or a lifted connector.",
      },
      {
        partIds: ["lcd"],
        likelihood: "likely",
        why: "The panel itself can flicker the same way after impact, so we test both together.",
      },
      {
        partIds: ["mainboard"],
        likelihood: "possible",
        why: "Rarely the display connector on the board is the weak link — checked before any panel swap.",
      },
    ],
  },
  "v-battery-wear": {
    kind: "verdict",
    title: "BATTERY WEAR",
    summary:
      "Charging fine but draining fast, or shutting down with charge to spare, is the signature of a tired pack. On this tablet that's the twin cells — we replace them together with a health check.",
    suspects: [
      {
        partIds: ["battery-l", "battery-r"],
        likelihood: "primary",
        label: "Battery (both cells)",
        why: "Lithium cells fade with cycles; the pair is matched and replaced together so one tired cell doesn't drag the other.",
      },
      {
        partIds: ["mainboard"],
        likelihood: "possible",
        why: "Rarely, a power-hungry fault on the board drains even healthy cells — we test the draw before quoting.",
      },
    ],
    relatedIcs: [
      {
        icId: "pmic",
        note: "Unexplained drain after new cells can be a leaky power rail on the power-management IC.",
      },
    ],
  },
  "v-battery-swell": {
    kind: "verdict",
    title: "SWOLLEN BATTERY — HANDLE WITH CARE",
    urgent: true,
    summary:
      "Stop charging it and power it down if you can. A swollen cell is pressure-loaded and must not be squeezed, bent, or punctured — a lifting screen is the gas pushing the tablet apart. Bring it in as soon as you can; replacement is routine, and the sooner the pack is out, the safer your screen and data are.",
    suspects: [
      {
        partIds: ["battery-l", "battery-r"],
        likelihood: "primary",
        label: "Battery (both cells)",
        why: "Gas build-up in a failing cell physically lifts the panels — it will not settle on its own, and the matched pair is replaced together.",
      },
      {
        partIds: ["digitiser"],
        likelihood: "possible",
        why: "Glass lifted or stressed by the swelling often needs resealing or replacement once the new pack is in.",
      },
    ],
  },
  "v-audio": {
    kind: "verdict",
    title: "SPEAKER FAULT",
    summary:
      "Sound on headphones or Bluetooth but not the built-in speakers — or one side dead or buzzing — usually means a speaker module rather than the board. A driver swap normally clears it.",
    suspects: [
      {
        partIds: ["speakers"],
        likelihood: "primary",
        why: "A dead or buzzing channel is most often a blown or debris-clogged driver — the bottom pair takes the most abuse.",
      },
      {
        partIds: ["speakers-top"],
        likelihood: "likely",
        why: "If the silence or distortion is up top, the upper stereo pair is the one to replace.",
      },
      {
        partIds: ["mainboard"],
        likelihood: "possible",
        why: "If both new speakers still misbehave, the audio amplifier on the board is the next check.",
      },
    ],
    relatedIcs: [
      {
        icId: "audio",
        note: "Distortion that survives new speakers points at the audio codec on the board.",
      },
    ],
  },
  "v-audio-codec": {
    kind: "verdict",
    title: "AUDIO — LIKELY BOARD-LEVEL",
    summary:
      "No sound at all, even through headphones or Bluetooth, points past the speakers to the audio circuit or software. We'd confirm it isn't a stuck output setting first, then look at the board.",
    suspects: [
      {
        partIds: ["mainboard"],
        likelihood: "primary",
        why: "When every output is silent, the audio codec on the board — or its software — is the usual cause rather than the speakers.",
      },
      {
        partIds: ["speakers"],
        likelihood: "possible",
        why: "We still test the drivers, since a rare double failure can look like a board fault.",
      },
      {
        partIds: ["speakers-top"],
        likelihood: "possible",
        why: "The upper pair is checked alongside for the same reason.",
      },
    ],
    relatedIcs: [
      {
        icId: "audio",
        note: "Total silence across every output centres on the audio codec on the board.",
      },
    ],
  },
  "v-camera": {
    kind: "verdict",
    title: "CAMERA MODULE FAULT",
    summary:
      "One camera failing while the other works — or blurry, unfocused, or a cracked lens — usually means that single module. Camera modules on tablets are a straightforward swap.",
    suspects: [
      {
        partIds: ["camera"],
        likelihood: "primary",
        why: "A rear optic that won't focus, rattles, or shows a cracked lens is a module-level fault we can replace directly.",
      },
      {
        partIds: ["front-camera"],
        likelihood: "likely",
        why: "If it's the selfie side that's black or blurry, the front module is the one to change.",
      },
      {
        partIds: ["mainboard"],
        likelihood: "possible",
        why: "If a new module doesn't fix it, the camera connector on the board is checked next.",
      },
    ],
  },
  "v-camera-board": {
    kind: "verdict",
    title: "CAMERA — LIKELY BOARD-LEVEL",
    summary:
      "Both cameras black, or the app crashing on open, points past the modules to the image processor or software rather than either lens. We'd rule out a software glitch first, then look at the board.",
    suspects: [
      {
        partIds: ["mainboard"],
        likelihood: "primary",
        why: "Both cameras down together usually means the shared image-processing path on the board, not two failed modules.",
      },
      {
        partIds: ["camera"],
        likelihood: "possible",
        why: "We still test the rear module, since a wiring fault there can stall the whole app.",
      },
      {
        partIds: ["front-camera"],
        likelihood: "possible",
        why: "The front module is checked alongside for the same reason.",
      },
    ],
    relatedIcs: [
      {
        icId: "soc",
        note: "The camera image processor lives on the main processor — a common home for both-cameras-dead faults.",
      },
    ],
  },
  "v-wifi": {
    kind: "verdict",
    title: "WI-FI ANTENNA / RANGE FAULT",
    summary:
      "Fine next to the router but weak a room away is the classic weak-antenna pattern. It's usually the Wi-Fi antenna line or its connector, and often very fixable.",
    suspects: [
      {
        partIds: ["antenna-wifi"],
        likelihood: "primary",
        why: "A pinched antenna line or a lifted connector cuts range while leaving Wi-Fi technically 'on' — exactly this pattern.",
      },
      {
        partIds: ["mainboard"],
        likelihood: "possible",
        why: "If the antenna tests good, the Wi-Fi circuit on the board is the next suspect.",
      },
    ],
    relatedIcs: [
      {
        icId: "wifi",
        note: "Range faults that survive a new antenna point to the Wi-Fi module on the board.",
      },
    ],
  },
  "v-cell": {
    kind: "verdict",
    title: "CELLULAR ANTENNA / SIGNAL FAULT",
    summary:
      "A SIM that's recognised but shows no bars where other phones get signal usually points at the cellular antenna rather than the SIM or the network. We confirm with a known-good SIM before quoting.",
    suspects: [
      {
        partIds: ["antenna-cell"],
        likelihood: "primary",
        why: "A damaged cellular antenna or connector drops signal while the SIM still reads — the pattern you're seeing.",
      },
      {
        partIds: ["mainboard"],
        likelihood: "possible",
        why: "If the antenna checks out, the cellular circuit on the board is next in line.",
      },
    ],
    relatedIcs: [
      {
        icId: "bb",
        note: "Signal faults that survive a new antenna often trace to the baseband on the board.",
      },
      {
        icId: "rf",
        note: "The RF front-end shares the blame when a good SIM still won't hold a signal.",
      },
    ],
  },
  "v-connectivity-board": {
    kind: "verdict",
    title: "WIRELESS — LIKELY BOARD-LEVEL",
    summary:
      "A toggle that greys out on its own, a SIM that's never detected, or every radio dropping at once points past the antennas to the wireless circuit or software. We'd rule out a settings glitch first, then look at the board.",
    suspects: [
      {
        partIds: ["mainboard"],
        likelihood: "primary",
        why: "A self-disabling toggle or an undetected SIM usually means the wireless circuit or SIM reader on the board, not the antennas.",
      },
      {
        partIds: ["antenna-wifi"],
        likelihood: "possible",
        why: "We still test the Wi-Fi antenna, since a shorted line can knock the whole radio offline.",
      },
      {
        partIds: ["antenna-cell"],
        likelihood: "possible",
        why: "The cellular antenna is checked alongside for the same reason.",
      },
    ],
    relatedIcs: [
      {
        icId: "wifi",
        note: "A greyed-out toggle often centres on the Wi-Fi module on the board.",
      },
      {
        icId: "rf",
        note: "An undetected SIM or dead cellular radio brings the RF front-end into the picture.",
      },
    ],
  },
  "v-liquid": {
    kind: "verdict",
    title: "LIQUID EXPOSURE — CORROSION RISK",
    summary:
      "Power it down and keep it off the charger — running or charging a damp board is what turns a wet tablet into a dead one. Corrosion spreads over days, so the sooner it's opened, cleaned, and dried on the bench, the better the odds. Bring it in for a free assessment rather than waiting to see what happens.",
    suspects: [
      {
        partIds: ["mainboard"],
        likelihood: "primary",
        why: "Liquid tracks straight to the board, where corrosion bridges circuits — the part most worth cleaning early.",
      },
      {
        partIds: ["charge-flex"],
        likelihood: "likely",
        why: "The port sits at a common entry point and corrodes fast, so it's high on the checklist.",
      },
      {
        partIds: ["battery-l", "battery-r"],
        likelihood: "possible",
        label: "Battery (both cells)",
        why: "Cells and their connectors can corrode too, and are inspected during the clean.",
      },
    ],
    relatedIcs: [
      {
        icId: "pmic",
        note: "Corrosion around the power-management IC is a frequent finding on liquid-damaged boards.",
      },
    ],
  },
  "v-liquid-urgent": {
    kind: "verdict",
    title: "LIQUID + HEAT / SWELLING — POWER DOWN NOW",
    urgent: true,
    summary:
      "Stop using it, take it off the charger, and power it down. Liquid plus heat, odd smells, or a swelling pack is a safety issue, not just a repair one — don't charge it and don't press on a bulging body. Bring it in as soon as you can so the pack can be made safe and the board cleaned before the damage spreads.",
    suspects: [
      {
        partIds: ["battery-l", "battery-r"],
        likelihood: "primary",
        label: "Battery (both cells)",
        why: "Liquid that reaches the cells can make them heat or swell — a hazard that only gets worse on the charger, so the pack comes out first.",
      },
      {
        partIds: ["mainboard"],
        likelihood: "likely",
        why: "A board getting hot after liquid usually has a corrosion short drawing current — it needs cleaning before any power is reapplied.",
      },
    ],
    relatedIcs: [
      {
        icId: "pmic",
        note: "A liquid-shorted power-management IC can overheat the board — a priority check on the bench.",
      },
    ],
  },
};

const TABLET_DIAGNOSTICS: DeviceDiagnostics<TabletPartId, N> = {
  device: "tablet",
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
      id: "screen",
      label: "Cracked or black screen",
      tagline: "Broken glass, lines, or no picture",
      start: "scr-q1",
    },
    {
      id: "battery-drain",
      label: "Battery drains or swells",
      tagline: "Dies fast — or the body is bulging",
      start: "batt-q1",
    },
    {
      id: "audio",
      label: "No sound / distorted",
      tagline: "Silent, one-sided, or buzzing speakers",
      start: "aud-q1",
    },
    {
      id: "camera",
      label: "Camera won't work",
      tagline: "Black preview, blur, or cracked lens",
      start: "cam-q1",
    },
    {
      id: "connectivity",
      label: "No Wi-Fi or mobile data",
      tagline: "Weak, dropping, or no SIM",
      start: "net-q1",
    },
    {
      id: "liquid",
      label: "Liquid damage",
      tagline: "Got wet, spilled, or dropped in water",
      start: "liq-q1",
    },
  ],
  nodes,
};

export default TABLET_DIAGNOSTICS;
