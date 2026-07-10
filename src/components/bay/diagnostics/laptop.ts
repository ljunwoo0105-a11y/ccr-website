// ---------------------------------------------------------------------------
// Laptop fault-trace wizard. Flat node graph; trees converge on shared
// verdicts. See phone.ts for the reference and types.ts for content rules
// (hedged language, no prices, /quote CTA, no-tools questions).
//
// Research-grounded (docs/research/diagnostic-research.md): cable-wiggle →
// dc-jack; power reaches board but no LEDs/fan → mainboard; overheating →
// fan/cooling/dust.
// ---------------------------------------------------------------------------

import type { DeviceDiagnostics, DiagNode } from "./types";
import type { LaptopPartId } from "../rig-data/laptop";

type N =
  // won't turn on
  | "np-q1"
  | "np-q2"
  | "np-q3"
  // won't charge
  | "nc-q1"
  // no display
  | "disp-q1"
  | "disp-q2"
  // overheating
  | "heat-q1"
  // keyboard / spill
  | "kb-q1"
  // battery
  | "batt-q1"
  // no wifi
  | "wifi-q1"
  // liquid
  | "liq-q1"
  // verdicts
  | "v-dc-jack"
  | "v-power-board"
  | "v-battery-dead"
  | "v-display-cable"
  | "v-lid-panel"
  | "v-overheat"
  | "v-keyboard"
  | "v-battery-swell"
  | "v-battery-wear"
  | "v-wifi"
  | "v-liquid";

const nodes: Record<N, DiagNode<LaptopPartId, N>> = {
  // ---- Symptom: won't turn on --------------------------------------------
  "np-q1": {
    kind: "question",
    question: "With the charger plugged in, does ANY light come on?",
    help: "Check the charger brick's own LED, a power light on the laptop, or the keyboard backlight.",
    focusParts: ["dc-jack", "battery", "mainboard"],
    options: [
      { id: "no-light", label: "No lights anywhere", next: "np-q2" },
      {
        id: "light-no-boot",
        label: "Lights come on, but nothing on screen and no fan",
        hint: "You see a light, but it never boots",
        next: "np-q3",
      },
      {
        id: "light-black",
        label: "It powers up (fan spins) but the screen stays black",
        next: "disp-q1",
      },
    ],
  },
  "np-q2": {
    kind: "question",
    question:
      "Wiggle the charger plug where it enters the laptop. Does a light flicker on, or does the jack feel loose?",
    help: "No tools — just gently move the plug in its socket and watch for any response.",
    focusParts: ["dc-jack"],
    options: [
      {
        id: "wiggle-works",
        label: "Yes — it responds when I hold it a certain way",
        hint: "Or the jack feels loose / sunken",
        next: "v-dc-jack",
      },
      {
        id: "nothing",
        label: "Nothing, no matter what — try another charger",
        hint: "Dead even with a known-good charger",
        next: "v-power-board",
      },
    ],
  },
  "np-q3": {
    kind: "question",
    question:
      "Try it with the charger connected but the battery removed (if yours pops out). Any change?",
    help: "If the battery is built in, skip this — just note whether it ran at all on charger alone at any point.",
    focusParts: ["battery", "mainboard"],
    options: [
      {
        id: "runs-without",
        label: "It runs on charger without the battery",
        hint: "So the battery was holding it down",
        next: "v-battery-dead",
      },
      {
        id: "still-dead",
        label: "Still no boot / no fan either way",
        next: "v-power-board",
      },
    ],
  },

  // ---- Symptom: won't charge ---------------------------------------------
  "nc-q1": {
    kind: "question",
    question:
      "Does it charge only when the plug is held or wiggled into position?",
    help: "Try a known-good charger first. Then feel whether the jack grips the plug or wobbles.",
    focusParts: ["dc-jack", "battery"],
    options: [
      {
        id: "wiggle",
        label: "Yes — I have to hold or prop the plug",
        next: "v-dc-jack",
      },
      {
        id: "shows-not-climbing",
        label: "Plugged in shows 'not charging' and the % won't climb",
        next: "v-battery-wear",
      },
      {
        id: "swollen-check",
        label: "It runs on power but the battery seems tired or puffy",
        next: "batt-q1",
      },
    ],
  },

  // ---- Symptom: no display (powers on) -----------------------------------
  "disp-q1": {
    kind: "question",
    question:
      "Shine a light at the black screen at an angle — can you see a very faint desktop or logo?",
    help: "If a ghostly image is there, the computer is running and drawing — it's the panel's lighting or cable, not the whole machine.",
    focusParts: ["lid", "display-cable"],
    options: [
      {
        id: "faint-image",
        label: "Yes — a faint image is there",
        next: "disp-q2",
      },
      {
        id: "truly-black",
        label: "No — dead black, but the fan runs",
        next: "v-lid-panel",
      },
    ],
  },
  "disp-q2": {
    kind: "question",
    question:
      "Does the image flicker, cut out, or show lines when you slowly open and close the lid?",
    help: "The video cable runs through the hinge and wears exactly there.",
    focusParts: ["display-cable", "hinge", "lid"],
    options: [
      {
        id: "hinge-flicker",
        label: "Yes — it changes as the lid moves",
        next: "v-display-cable",
      },
      {
        id: "steady",
        label: "No — steady, just dim or wrong",
        next: "v-lid-panel",
      },
    ],
  },

  // ---- Symptom: overheating / loud ---------------------------------------
  "heat-q1": {
    kind: "question",
    question:
      "When it runs hot, is the fan roaring, grinding, or silent?",
    help: "Put your ear near the vents. Also feel whether hot air is actually coming out.",
    focusParts: ["fan", "cooling"],
    options: [
      {
        id: "roar-little-air",
        label: "Loud, but barely any air comes out the vents",
        hint: "Choked with dust",
        next: "v-overheat",
      },
      {
        id: "grind",
        label: "Grinding, rattling, or buzzing",
        next: "v-overheat",
      },
      {
        id: "silent-hot",
        label: "Silent but very hot — fan may not be spinning",
        next: "v-overheat",
      },
    ],
  },

  // ---- Symptom: keyboard / spill -----------------------------------------
  "kb-q1": {
    kind: "question",
    question: "What's happening with the keyboard?",
    help: "An external USB keyboard is a great cross-check: if that works perfectly, the built-in keyboard is the fault.",
    focusParts: ["deck", "kb-backlight"],
    options: [
      {
        id: "dead-keys",
        label: "Some keys dead or repeating",
        next: "v-keyboard",
      },
      {
        id: "spill",
        label: "It had a spill and now types on its own or nothing works",
        next: "v-keyboard",
      },
      {
        id: "backlight",
        label: "Keys work, but the backlight is dead or patchy",
        next: "v-keyboard",
      },
    ],
  },

  // ---- Symptom: battery ---------------------------------------------------
  "batt-q1": {
    kind: "question",
    question:
      "Close the lid, flip it over, and set it on a flat table. Does it rock, or is the bottom bowed?",
    help: "A swollen pack bulges the bottom case or lifts the trackpad — a rock on a flat table is the tell.",
    focusParts: ["battery", "trackpad"],
    options: [
      {
        id: "rocks",
        label: "Yes — it rocks or the bottom is bulging",
        next: "v-battery-swell",
      },
      {
        id: "flat",
        label: "No — sits flat, just poor runtime",
        next: "v-battery-wear",
      },
    ],
  },

  // ---- Symptom: no Wi-Fi --------------------------------------------------
  "wifi-q1": {
    kind: "question",
    question:
      "Does the Wi-Fi list disappear entirely, or does it connect but drop or run slow?",
    help: "If other devices in the same room are fine, it's the laptop, not the router.",
    focusParts: ["wifi-card", "lid-antenna"],
    options: [
      {
        id: "gone",
        label: "No networks at all / 'no adapter found'",
        next: "v-wifi",
      },
      {
        id: "weak",
        label: "Connects up close but drops across the room",
        hint: "Short range points at the antenna leads",
        next: "v-wifi",
      },
    ],
  },

  // ---- Symptom: liquid ----------------------------------------------------
  "liq-q1": {
    kind: "question",
    question:
      "Did it get wet or have a spill? If so, is it still plugged in or running?",
    help: "If liquid got inside, powering it on can spread the damage — the safest move is to stop.",
    focusParts: ["deck", "mainboard", "battery"],
    options: [
      { id: "wet", label: "Yes — it got liquid inside", next: "v-liquid" },
      {
        id: "unsure",
        label: "Not sure, but it's acting strangely",
        next: "v-liquid",
      },
    ],
  },

  // ---- Verdicts -----------------------------------------------------------
  "v-dc-jack": {
    kind: "verdict",
    title: "POWER JACK FAULT",
    summary:
      "A charge that comes and goes when you wiggle the plug, or a jack that feels loose, most often means the DC power jack has worn or cracked its solder. It's a common, well-understood repair — usually a same-visit job once we're on the bench.",
    suspects: [
      {
        partIds: ["dc-jack"],
        likelihood: "primary",
        why: "Intermittent power when wiggling the plug, or a physically loose jack, is the textbook sign of a failed DC jack.",
      },
      {
        partIds: ["mainboard"],
        likelihood: "possible",
        why: "On some models the jack is soldered to the board, so a bad joint there presents the same way.",
      },
    ],
  },
  "v-power-board": {
    kind: "verdict",
    title: "POWER PATH FAULT",
    summary:
      "No lights at all, even on a charger you trust, usually means power isn't getting past the board's power circuit — often a shorted component after a surge or liquid. A bench diagnosis pins down exactly which rail is down; the assessment is free.",
    suspects: [
      {
        partIds: ["mainboard"],
        likelihood: "primary",
        why: "If a good charger delivers power to the board but nothing lights and no fan spins, the fault is on the board itself.",
      },
      {
        partIds: ["dc-jack"],
        likelihood: "likely",
        why: "A dead jack blocks power before it ever reaches the board — we rule it out first on the bench.",
      },
      {
        partIds: ["battery"],
        likelihood: "possible",
        why: "A shorted pack can occasionally hold the whole rail down.",
      },
    ],
    relatedIcs: [
      {
        icId: "mosfet",
        note: "Dead-on-a-good-charger laptops often trace to a shorted power MOSFET on the charge rail.",
      },
      {
        icId: "pmic",
        note: "The board's power-sequencing IC is the next suspect if the rails won't come up.",
      },
    ],
  },
  "v-battery-dead": {
    kind: "verdict",
    title: "BATTERY HOLDING IT DOWN",
    summary:
      "Running on the charger without the battery, but not with it, points at a failed pack dragging the power rail down. Most likely a straightforward battery replacement.",
    suspects: [
      {
        partIds: ["battery"],
        likelihood: "primary",
        why: "A dead-shorted cell can stop the machine booting until it's removed — exactly what you saw.",
      },
      {
        partIds: ["mainboard"],
        likelihood: "possible",
        why: "Rarely the charge circuit misreads a healthy pack — we confirm before replacing.",
      },
    ],
  },
  "v-display-cable": {
    kind: "verdict",
    title: "DISPLAY CABLE",
    summary:
      "A picture that flickers or changes as you move the lid almost always means the video cable is worn where it folds through the hinge. It's a targeted fix that's much cheaper than a whole screen.",
    suspects: [
      {
        partIds: ["display-cable"],
        likelihood: "primary",
        why: "The cable flexes every time the lid opens and fails right at the hinge fold — flicker-on-movement is its signature.",
      },
      {
        partIds: ["hinge"],
        likelihood: "likely",
        why: "A stiff or broken hinge chews through the cable and can crack the lid, so we check it in the same job.",
      },
    ],
  },
  "v-lid-panel": {
    kind: "verdict",
    title: "DISPLAY PANEL",
    summary:
      "The computer is running — it just can't show you properly. With a steady faint image or a dead-black screen while it boots normally, the display panel or its lighting is the likely culprit. A panel replacement usually brings it right back.",
    suspects: [
      {
        partIds: ["lid"],
        likelihood: "primary",
        why: "A cracked or backlight-failed panel shows exactly this: a faint or absent image while everything else works.",
      },
      {
        partIds: ["display-cable"],
        likelihood: "likely",
        why: "A loose or damaged video cable produces the same black screen for a cheaper fix — we test it first.",
      },
      {
        partIds: ["mainboard"],
        likelihood: "possible",
        why: "Less often, the graphics circuit on the board is at fault — bench-testable before any parts go in.",
      },
    ],
  },
  "v-overheat": {
    kind: "verdict",
    title: "COOLING & THERMAL",
    summary:
      "Running hot with a roaring, grinding, or silent fan usually means the cooling system is choked with dust, the fan bearing is worn, or the thermal paste has dried out. A clean-and-repaste is one of the most satisfying fixes we do — quiet and cool again.",
    suspects: [
      {
        partIds: ["fan"],
        likelihood: "primary",
        why: "A dust-choked or worn fan is the most common cause of overheating and noise — and the easiest to put right.",
      },
      {
        partIds: ["cooling"],
        likelihood: "likely",
        why: "Dried thermal paste on the heat pipe lets the chip cook even with a healthy fan.",
      },
      {
        partIds: ["mainboard"],
        likelihood: "possible",
        why: "Persistent heat after a clean can mean a component on the board running hot — we measure it.",
      },
    ],
    urgent: false,
  },
  "v-keyboard": {
    kind: "verdict",
    title: "KEYBOARD / SPILL",
    summary:
      "Dead keys, phantom typing, or a spill point at the keyboard deck. If liquid got in, the sooner it's cleaned the better — a fresh keyboard (and a board clean if needed) usually restores it. Stop using it on a spill until it's checked.",
    suspects: [
      {
        partIds: ["deck"],
        likelihood: "primary",
        why: "Worn or spilled-on key membranes cause dead, sticky, or self-typing keys — the keyboard deck is the fix.",
      },
      {
        partIds: ["kb-backlight"],
        likelihood: "possible",
        why: "If the keys work but the glow is dead or patchy, the backlight sheet is the smaller repair.",
      },
    ],
  },
  "v-battery-swell": {
    kind: "verdict",
    title: "SWOLLEN BATTERY — HANDLE WITH CARE",
    urgent: true,
    summary:
      "Stop using it on the charger and power it down. A swollen pack is pressure-loaded — don't press, puncture, or keep charging it. Bring it in soon; a battery replacement is routine, and getting the swollen cell out protects your trackpad, screen and case.",
    suspects: [
      {
        partIds: ["battery"],
        likelihood: "primary",
        why: "Gas build-up in a failing cell bows the case and lifts the trackpad — it will not recover on its own.",
      },
      {
        partIds: ["trackpad"],
        likelihood: "possible",
        why: "A trackpad lifted or stuck by the swelling often needs recalibrating or replacing once the new pack is in.",
      },
    ],
  },
  "v-battery-wear": {
    kind: "verdict",
    title: "BATTERY WEAR",
    summary:
      "Poor runtime or a 'not charging' message on a flat, sealed pack is usually simple wear. Most likely a battery replacement, done with a health check — we confirm the charge circuit is happy at the same time.",
    suspects: [
      {
        partIds: ["battery"],
        likelihood: "primary",
        why: "Laptop cells fade with cycles; short runtime and charge-stalls are the standard end-of-life signs.",
      },
      {
        partIds: ["mainboard"],
        likelihood: "possible",
        why: "Occasionally the charge circuit refuses a healthy pack — bench-testable before replacing.",
      },
    ],
    relatedIcs: [
      {
        icId: "chg",
        note: "A 'plugged in, not charging' state that a new battery doesn't fix points at the charging IC.",
      },
    ],
  },
  "v-wifi": {
    kind: "verdict",
    title: "WIRELESS FAULT",
    summary:
      "Missing networks or short range usually means the Wi-Fi card or its antenna leads, not your router. It's an inexpensive card swap or a lead re-seat in most machines — and a good chance to bump you to a faster card while we're in there.",
    suspects: [
      {
        partIds: ["wifi-card"],
        likelihood: "primary",
        why: "A failed or loose M.2 card shows as 'no adapter found' or constant drops.",
      },
      {
        partIds: ["lid-antenna"],
        likelihood: "likely",
        why: "Antenna leads pinched at the hinge cause exactly the connects-up-close, drops-across-the-room pattern.",
      },
    ],
    relatedIcs: [
      { icId: "wifi", note: "Persistent faults after a card swap point at the wireless module itself." },
    ],
  },
  "v-liquid": {
    kind: "verdict",
    title: "LIQUID DAMAGE — POWER IT DOWN",
    urgent: true,
    summary:
      "Shut it down and leave it off — running or charging a wet laptop spreads corrosion across the board. Don't rely on rice. The best outcome comes from a prompt professional clean: we open it, flush and inspect the board, and recover your files. Bring it in as soon as you can.",
    suspects: [
      {
        partIds: ["mainboard"],
        likelihood: "primary",
        why: "Liquid tracks straight to the board and corrodes it while powered — early cleaning is what saves it.",
      },
      {
        partIds: ["deck"],
        likelihood: "likely",
        why: "Spills enter through the keyboard, so the deck is usually affected and often needs replacing.",
      },
      {
        partIds: ["battery"],
        likelihood: "possible",
        why: "A wet pack can short or swell and is checked as part of the clean.",
      },
    ],
    relatedIcs: [
      { icId: "pmic", note: "Liquid corrosion on the power-management IC is a common board-level casualty." },
    ],
  },
};

const LAPTOP_DIAGNOSTICS: DeviceDiagnostics<LaptopPartId, N> = {
  device: "laptop",
  symptoms: [
    { id: "no-power", label: "Won't turn on", tagline: "No lights, no fan", start: "np-q1" },
    { id: "no-charge", label: "Won't charge", tagline: "Runs on power, battery won't fill", start: "nc-q1" },
    { id: "no-display", label: "Screen stays black", tagline: "Fan runs, nothing shows", start: "disp-q1" },
    { id: "overheat", label: "Runs hot / loud fan", tagline: "Throttling, noise, or shutdowns", start: "heat-q1" },
    { id: "keyboard", label: "Keyboard or spill", tagline: "Dead keys, phantom typing", start: "kb-q1" },
    { id: "battery", label: "Battery problems", tagline: "Poor runtime or swelling", start: "batt-q1" },
    { id: "wifi", label: "No Wi-Fi", tagline: "Missing networks or short range", start: "wifi-q1" },
    { id: "liquid", label: "Got wet", tagline: "Spill or liquid inside", start: "liq-q1" },
  ],
  nodes,
};

export default LAPTOP_DIAGNOSTICS;
