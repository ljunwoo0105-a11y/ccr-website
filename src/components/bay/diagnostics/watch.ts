// ---------------------------------------------------------------------------
// Watch fault-trace wizard. Flat node graph; symptom trees converge on shared
// verdicts (v-charge-hot, v-power-dead, v-taptic, v-pair-soft). See types.ts
// for the content rules (hedged language, no prices, /quote CTA, no-tools
// questions) and phone.ts for the reference implementation.
//
// Research anchors (docs/research/diagnostic-research.md):
//  - Ping from the paired phone: buzzes/sounds but black → display, not power.
//  - Not-charging is external-first (cable/pad/outlet, depleted cell) before
//    the coil/battery are suspected; leave on the puck ≥1 hr.
//  - URGENT: a watch hot on the charger is a battery / charge-circuit hazard.
//  - REFUTED: "won't pair → broken BT antenna" — pairing stays software-first,
//    antenna never ranks primary.
// ---------------------------------------------------------------------------

import type { DeviceDiagnostics, DiagNode } from "./types";
import type { WatchPartId } from "../rig-data/watch";

type N =
  | "pw-q1"
  | "pw-q2"
  | "ch-q1"
  | "ch-q2"
  | "cr-q1"
  | "cr-q2"
  | "bt-q1"
  | "bt-q2"
  | "hp-q1"
  | "hp-q2"
  | "wt-q1"
  | "wt-q2"
  | "bp-q1"
  | "bp-q2"
  | "v-display-dead"
  | "v-power-dead"
  | "v-charge-hot"
  | "v-charge-ext"
  | "v-coil-align"
  | "v-charge-dead"
  | "v-crystal"
  | "v-glass-display"
  | "v-touch"
  | "v-panel"
  | "v-swell"
  | "v-drain-parasitic"
  | "v-batt-wear"
  | "v-taptic"
  | "v-crown-haptic"
  | "v-haptic-settings"
  | "v-seal"
  | "v-water-speaker"
  | "v-water-damage"
  | "v-pair-soft"
  | "v-pair-persist";

const nodes: Record<N, DiagNode<WatchPartId, N>> = {
  // ---- Symptom: won't turn on --------------------------------------------
  "pw-q1": {
    kind: "question",
    question:
      "Ask your phone to ping the watch (or press and hold the side button). Does it react in any way — a buzz, a chime, or a boot logo?",
    help: "Watch and listen for 15 seconds: a vibration, a sound, or any glow / logo on the glass.",
    focusParts: ["display", "taptic", "battery"],
    options: [
      {
        id: "buzz-black",
        label: "It buzzes or chimes, but the screen stays black",
        hint: "Sound or vibration, no picture",
        next: "v-display-dead",
      },
      {
        id: "logo-loop",
        label: "Shows a logo, then freezes or keeps restarting",
        next: "v-power-dead",
      },
      {
        id: "dead",
        label: "Nothing at all — completely dead",
        hint: "No light, no buzz, no sound",
        next: "pw-q2",
      },
    ],
  },
  "pw-q2": {
    kind: "question",
    question:
      "Leave it on its charger for a good while, then press and hold the side button for about 10 seconds. Anything now?",
    help: "A deeply flat cell can look completely dead — give it time on the puck before deciding.",
    focusParts: ["battery", "charge-coil", "sip"],
    options: [
      {
        id: "charge-warm",
        label: "Shows a charge symbol or warms slightly, but still won't boot",
        next: "v-power-dead",
      },
      {
        id: "hot",
        label: "Gets noticeably hot and still won't start",
        hint: "Too warm to hold comfortably",
        next: "v-charge-hot",
      },
      {
        id: "still-dead",
        label: "Still absolutely nothing after a long charge",
        next: "v-power-dead",
      },
    ],
  },

  // ---- Symptom: won't charge ---------------------------------------------
  "ch-q1": {
    kind: "question",
    question:
      "First rule out the accessories — try a cable, puck and wall plug you know work on another device. Still won't charge?",
    help: "Cables, pucks and adapters fail far more often than the watch itself.",
    focusParts: ["charge-coil", "battery"],
    options: [
      {
        id: "not-tried",
        label: "Haven't swapped the accessories yet",
        next: "v-charge-ext",
      },
      {
        id: "tried",
        label: "Tried known-good ones — still nothing",
        next: "ch-q2",
      },
      {
        id: "hot",
        label: "It does charge, but the watch gets hot",
        hint: "Warm or hot on the puck",
        next: "v-charge-hot",
      },
    ],
  },
  "ch-q2": {
    kind: "question",
    question:
      "On a charger you trust, does it only charge when nudged to one exact spot, or ignore the puck completely?",
    help: "Watch for the green charging icon; try re-seating it centred on the puck.",
    focusParts: ["charge-coil", "battery"],
    options: [
      {
        id: "align",
        label: "Only charges in one exact position",
        next: "v-coil-align",
      },
      {
        id: "ignore",
        label: "Ignores the charger entirely",
        next: "v-charge-dead",
      },
    ],
  },

  // ---- Symptom: cracked / faulty screen ----------------------------------
  "cr-q1": {
    kind: "question",
    question:
      "Is the damage on the clear cover glass, or is the picture itself faulty — lines, blank patches, or dead touch?",
    help: "Run a fingernail lightly across it: cover-glass cracks sit on the surface; panel faults show in the image.",
    focusParts: ["crystal", "display"],
    options: [
      {
        id: "glass-only",
        label: "Just the cover glass is cracked or chipped, picture is fine",
        next: "v-crystal",
      },
      {
        id: "glass-image",
        label: "Cracked AND the picture has lines / black patches / dead touch",
        next: "v-glass-display",
      },
      {
        id: "no-crack",
        label: "No visible crack, but touch or the image misbehaves",
        next: "cr-q2",
      },
    ],
  },
  "cr-q2": {
    kind: "question",
    question:
      "Which is it — the image is fine but touch is dead, or the image is faulty while touch still works?",
    focusParts: ["display", "crystal"],
    options: [
      {
        id: "touch-dead",
        label: "Image looks fine, touch is dead or erratic",
        next: "v-touch",
      },
      {
        id: "image-bad",
        label: "Lines, tint or blank patches, but touch responds",
        next: "v-panel",
      },
    ],
  },

  // ---- Symptom: battery drains fast --------------------------------------
  "bt-q1": {
    kind: "question",
    question:
      "Look at the watch edge-on and press very gently around the screen. Is the display lifting, bulging, or is a gap opening at the edge?",
    help: "A swelling cell pushes the screen up — even a hairline gap counts. Don't press hard or try to close it.",
    focusParts: ["battery", "crystal", "gasket"],
    options: [
      {
        id: "swollen",
        label: "Yes — the screen is lifting, or there's a bulge / gap",
        next: "v-swell",
      },
      {
        id: "flat",
        label: "No, it sits flat but the charge dies fast",
        next: "bt-q2",
      },
    ],
  },
  "bt-q2": {
    kind: "question",
    question:
      "When it's just sitting on your wrist doing nothing, is it also warm, or does it only run down quickly?",
    focusParts: ["battery", "sip"],
    options: [
      { id: "warm-idle", label: "Warm even when idle", next: "v-drain-parasitic" },
      {
        id: "just-short",
        label: "Just poor runtime, no unusual heat",
        next: "v-batt-wear",
      },
    ],
  },

  // ---- Symptom: no taps / haptics ----------------------------------------
  "hp-q1": {
    kind: "question",
    question:
      "Trigger something that should tap you — an alarm, a notification, or a crown press. What do you feel?",
    help: "First nudge the haptic strength up in Settings, then feel the back of the watch for a buzz.",
    focusParts: ["taptic", "crown"],
    options: [
      { id: "nothing", label: "Nothing at all — no buzz", next: "hp-q2" },
      {
        id: "rattle",
        label: "A harsh rattle or buzz instead of a crisp tap",
        next: "v-taptic",
      },
      {
        id: "crown-dead",
        label: "Wrist taps work, but the crown press feels dead",
        next: "v-crown-haptic",
      },
    ],
  },
  "hp-q2": {
    kind: "question",
    question:
      "Double-check it isn't just silenced — haptics on, and not in silent or theatre mode. Still no taps?",
    focusParts: ["taptic"],
    options: [
      { id: "settings-ok", label: "Settings are right — still nothing", next: "v-taptic" },
      {
        id: "not-sure",
        label: "Not sure — haven't checked those",
        next: "v-haptic-settings",
      },
    ],
  },

  // ---- Symptom: got wet / won't seal -------------------------------------
  "wt-q1": {
    kind: "question",
    question:
      "Has it been in water, or is there fog under the glass or a bubbly sound from the speaker?",
    help: "Look for condensation under the crystal, or muffled, watery speaker audio.",
    focusParts: ["gasket", "case", "speaker"],
    options: [
      {
        id: "got-wet",
        label: "Yes — it got wet and now it's fogged or acting up",
        next: "wt-q2",
      },
      {
        id: "seal-doubt",
        label: "No dunk, but a water-resistance warning or a visible gap",
        next: "v-seal",
      },
    ],
  },
  "wt-q2": {
    kind: "question",
    question: "Since it got wet, what's misbehaving the most?",
    help: "Water can sit in the speaker cavity or reach the electronics.",
    focusParts: ["speaker", "display", "sip"],
    options: [
      {
        id: "muffled",
        label: "Muffled speaker or a stuck, watery sound",
        next: "v-water-speaker",
      },
      {
        id: "glitch",
        label: "Screen / touch glitching, or it keeps shutting down",
        next: "v-water-damage",
      },
    ],
  },

  // ---- Symptom: won't pair / keeps dropping ------------------------------
  "bp-q1": {
    kind: "question",
    question:
      "When the watch loses its connection, is your phone also flaky with other Bluetooth gear (car, earbuds), or is it only the watch?",
    help: "This separates a phone / software issue from the watch itself — no tools needed.",
    focusParts: ["sip"],
    options: [
      {
        id: "phone-too",
        label: "The phone is unreliable with other Bluetooth too",
        next: "v-pair-soft",
      },
      {
        id: "toggle-helps",
        label: "Only the watch — a toggle or restart helps for a while",
        next: "v-pair-soft",
      },
      {
        id: "barely",
        label: "Only the watch, and it barely connects even nearby",
        next: "bp-q2",
      },
    ],
  },
  "bp-q2": {
    kind: "question",
    question:
      "Held right next to the phone, off your wrist and with nothing metal between them, does it hold the connection?",
    help: "Distance, metal and wrist coverage weaken any watch link — rule those out first.",
    focusParts: ["sip", "antenna"],
    options: [
      {
        id: "fine-close",
        label: "Fine up close, only drops with distance or on the wrist",
        next: "v-pair-soft",
      },
      {
        id: "drops-close",
        label: "Drops even right beside the phone",
        next: "v-pair-persist",
      },
    ],
  },

  // ---- Verdicts -----------------------------------------------------------
  "v-display-dead": {
    kind: "verdict",
    title: "DISPLAY PATH FAULT",
    summary:
      "Your watch is taking power and booting — the buzz or chime proves that — it just can't show you. In our experience that points at the display stack rather than the power side, and a panel replacement usually brings it straight back.",
    suspects: [
      {
        partIds: ["display"],
        likelihood: "primary",
        why: "A panel that stays black while the watch clearly runs is the classic OLED failure after a knock or pressure.",
      },
      {
        partIds: ["crystal"],
        likelihood: "possible",
        why: "A shattered crystal can damage the laminated panel beneath it, so we check the glass at the same time.",
      },
      {
        partIds: ["sip"],
        likelihood: "possible",
        why: "Less often the display driver inside the sealed module is at fault — we test that before replacing anything.",
      },
    ],
    relatedIcs: [
      {
        icId: "soc",
        note: "The display controller lives in the main SoC — a dead panel signal can trace there on the bench.",
      },
    ],
  },
  "v-power-dead": {
    kind: "verdict",
    title: "POWER PATH FAULT",
    summary:
      "No real sign of life after a proper charge usually means power isn't flowing — most likely the tiny cell inside, or less often the sealed computer module. The bench assessment that pins it down is free.",
    suspects: [
      {
        partIds: ["battery"],
        likelihood: "primary",
        why: "Watch cells are small and hard-worked; in our experience they fade or fail before anything else on a watch that won't wake.",
      },
      {
        partIds: ["sip"],
        likelihood: "possible",
        why: "The sealed S-SiP module carries the power circuitry, so a fault there can also leave it dark.",
      },
    ],
    relatedIcs: [
      {
        icId: "pmic",
        note: "Inside the sealed module, power management is the usual dead-watch culprit.",
      },
    ],
  },
  "v-charge-hot": {
    kind: "verdict",
    title: "OVERHEATING ON CHARGE — UNPLUG IT",
    urgent: true,
    summary:
      "Take it off the charger now and let it cool somewhere clear of anything flammable. A watch that gets hot while charging — or while trying to power on — is a battery or charge-circuit hazard, so please don't keep charging it. Bring it in and we'll assess it safely.",
    suspects: [
      {
        partIds: ["battery"],
        likelihood: "primary",
        why: "A failing cell can overheat on charge — the most common and most safety-critical cause of a hot watch.",
      },
      {
        partIds: ["charge-coil"],
        likelihood: "possible",
        why: "A damaged charging coil or its circuitry can dump heat instead of charging cleanly.",
      },
      {
        partIds: ["sip"],
        likelihood: "possible",
        why: "The charge-management circuitry lives in the sealed module and can run hot when it fails.",
      },
    ],
    relatedIcs: [
      {
        icId: "chg",
        note: "Charging faults that run hot often trace to the charge-control IC on the bench.",
      },
    ],
  },
  "v-charge-ext": {
    kind: "verdict",
    title: "START WITH THE CHARGER",
    summary:
      "Before we suspect the watch, swap the cable, puck and wall plug for ones you know work and give it an hour on the puck — a depleted cell can ignore a charger until it's had time. If a known-good setup still won't charge it, the cell or the charging coil is the first on-watch suspect, and the assessment is free.",
    suspects: [
      {
        partIds: ["battery"],
        likelihood: "primary",
        why: "A deeply depleted or ageing cell is the most common on-watch reason a charge won't take once the accessories are ruled out.",
      },
      {
        partIds: ["charge-coil"],
        likelihood: "possible",
        why: "The inductive coil on the back is next in line if a charger you trust still does nothing.",
      },
    ],
  },
  "v-coil-align": {
    kind: "verdict",
    title: "CHARGE COIL — ALIGNMENT / WEAR",
    summary:
      "Charging only in one exact spot usually means the inductive coil or its alignment magnets are worn or shifted, so the puck struggles to couple. Often a straightforward coil repair — we confirm it on the bench first.",
    suspects: [
      {
        partIds: ["charge-coil"],
        likelihood: "primary",
        why: "A worn or displaced charging coil couples poorly, so it only takes power at one precise position.",
      },
      {
        partIds: ["battery"],
        likelihood: "possible",
        why: "An ageing cell can mimic fussy charging once the coil checks out.",
      },
    ],
    relatedIcs: [
      {
        icId: "chg",
        note: "Persistent charging trouble after the coil checks out points at the charge-control IC.",
      },
    ],
  },
  "v-charge-dead": {
    kind: "verdict",
    title: "CHARGE PATH FAULT",
    summary:
      "A watch that ignores a charger you know works usually has a break in the charging path — most likely the back coil, the cell, or the charge circuitry in the sealed module. A free bench assessment tells them apart.",
    suspects: [
      {
        partIds: ["charge-coil"],
        likelihood: "primary",
        why: "The inductive coil takes the charge first; a damaged coil is the leading cause of a watch that won't couple at all.",
      },
      {
        partIds: ["battery"],
        likelihood: "likely",
        why: "A dead or deeply failed cell can refuse to accept any charge.",
      },
      {
        partIds: ["sip"],
        likelihood: "possible",
        why: "If the coil and cell test fine, the charge-management circuitry in the module is next.",
      },
    ],
    relatedIcs: [
      {
        icId: "chg",
        note: "A watch that won't take charge often traces to the charge-control IC.",
      },
      {
        icId: "pmic",
        note: "Power management in the sealed module can also block charging.",
      },
    ],
  },
  "v-crystal": {
    kind: "verdict",
    title: "COVER GLASS DAMAGE",
    summary:
      "Damage confined to the cover glass with a healthy picture is usually just a crystal replacement. We check the panel underneath is truly clear before quoting, since a hard knock can reach it.",
    suspects: [
      {
        partIds: ["crystal"],
        likelihood: "primary",
        why: "Surface cracks and chips with a working display point squarely at the cover crystal.",
      },
      {
        partIds: ["display"],
        likelihood: "possible",
        why: "A heavy impact can hide damage in the laminated panel that only shows up later.",
      },
      {
        partIds: ["gasket"],
        likelihood: "possible",
        why: "Once the glass is opened the water seal is disturbed and usually needs renewing.",
      },
    ],
  },
  "v-glass-display": {
    kind: "verdict",
    title: "SCREEN ASSEMBLY DAMAGE",
    summary:
      "Cracked glass together with lines, blank patches or dead touch means the damage has reached the bonded panel. On a watch the crystal and display come as one laminated assembly, so both are usually replaced together — and the seal renewed.",
    suspects: [
      {
        partIds: ["crystal", "display"],
        likelihood: "primary",
        label: "Screen (crystal + display)",
        why: "Impact that cracks the glass and disturbs the image has reached the bonded stack; the laminated crystal and panel are replaced as a unit.",
      },
      {
        partIds: ["gasket"],
        likelihood: "possible",
        why: "Opening the screen breaks the water seal, so the gasket is renewed at the same time.",
      },
    ],
  },
  "v-touch": {
    kind: "verdict",
    title: "TOUCH / DIGITISER FAULT",
    summary:
      "A clear picture with dead or erratic touch is usually the digitiser layer, which on a watch is laminated into the display assembly. We confirm it isn't just a software or moisture issue first.",
    suspects: [
      {
        partIds: ["display"],
        likelihood: "primary",
        why: "The touch layer is bonded to the panel, so unresponsive or ghosting touch normally means the display assembly.",
      },
      {
        partIds: ["crystal"],
        likelihood: "possible",
        why: "A cracked crystal over the touch layer can interfere with touch even when the picture looks fine.",
      },
    ],
    relatedIcs: [
      {
        icId: "soc",
        note: "The touch controller feeds the main SoC — persistent touch faults can trace there on the bench.",
      },
    ],
  },
  "v-panel": {
    kind: "verdict",
    title: "DISPLAY PANEL FAULT",
    summary:
      "Lines, tint or blank patches while touch still works points at the panel itself rather than the glass. A display replacement usually clears it; we verify the module signal on the bench first.",
    suspects: [
      {
        partIds: ["display"],
        likelihood: "primary",
        why: "Colour lines, tint and dead patches are the signature of a failing OLED panel.",
      },
      {
        partIds: ["sip"],
        likelihood: "possible",
        why: "Less often the display driver in the sealed module produces the same picture faults — we test before replacing.",
      },
    ],
    relatedIcs: [
      {
        icId: "soc",
        note: "The display driver is part of the main SoC; a driver fault can mimic a bad panel.",
      },
    ],
  },
  "v-swell": {
    kind: "verdict",
    title: "SWOLLEN CELL — HANDLE WITH CARE",
    urgent: true,
    summary:
      "Stop charging it and, if you can, power it down. A swelling cell is pressure-loaded — don't press, bend or try to close the gap, and keep it away from heat. Bring it in soon; replacement is routine for us, and the sooner the cell is out the safer your screen and data are.",
    suspects: [
      {
        partIds: ["battery"],
        likelihood: "primary",
        why: "Gas building inside a failing cell physically lifts the screen — it will not settle on its own.",
      },
      {
        partIds: ["crystal"],
        likelihood: "possible",
        why: "A screen popped up by the swelling often needs reseating or replacing once the new cell is in.",
      },
      {
        partIds: ["gasket"],
        likelihood: "possible",
        why: "The water seal is broken once the screen lifts and is renewed with the repair.",
      },
    ],
  },
  "v-drain-parasitic": {
    kind: "verdict",
    title: "PARASITIC DRAIN",
    summary:
      "Warm and running down even while idle suggests something is drawing power in the background. Most often a tired cell working too hard, occasionally a leaky rail in the sealed module. A free bench check tells them apart.",
    suspects: [
      {
        partIds: ["battery"],
        likelihood: "primary",
        why: "A worn cell self-heats and empties fast; on a watch it's the most common cause of idle warmth and drain.",
      },
      {
        partIds: ["sip"],
        likelihood: "possible",
        why: "A leaking power rail inside the module can drain even a healthy cell and warm the case.",
      },
    ],
    relatedIcs: [
      {
        icId: "pmic",
        note: "Unexplained drain and warmth after a new cell can be a leaky rail — a power-management job on the bench.",
      },
    ],
  },
  "v-batt-wear": {
    kind: "verdict",
    title: "BATTERY WEAR",
    summary:
      "Charging fine but not lasting is the classic worn-cell story. Most likely a straightforward battery replacement with a health check — usually done while you wait.",
    suspects: [
      {
        partIds: ["battery"],
        likelihood: "primary",
        why: "Watch cells fade with charge cycles; short runtime with no heat or swelling is textbook wear.",
      },
      {
        partIds: ["sip"],
        likelihood: "possible",
        why: "Rarely a background fault in the module drains even a healthy cell — we rule that out on the bench.",
      },
    ],
    relatedIcs: [
      {
        icId: "pmic",
        note: "Drain that survives a new cell points at a power-management fault in the module.",
      },
    ],
  },
  "v-taptic": {
    kind: "verdict",
    title: "TAPTIC ENGINE FAULT",
    summary:
      "A rattle instead of a tap, or no buzz at all once the settings are right, usually means the taptic engine has failed. Replacing it normally restores clean wrist feedback; we confirm it isn't a loose connector first.",
    suspects: [
      {
        partIds: ["taptic"],
        likelihood: "primary",
        why: "A buzzing rattle, or a dead actuator with correct settings, is the standard taptic-engine failure.",
      },
      {
        partIds: ["sip"],
        likelihood: "possible",
        why: "Less often the drive signal from the sealed module is missing — we check that before replacing the engine.",
      },
    ],
  },
  "v-crown-haptic": {
    kind: "verdict",
    title: "CROWN CLICK / HAPTIC",
    summary:
      "Working wrist taps but a dead-feeling crown press usually points at the crown's own switch and haptic rather than the main taptic engine. Often a crown repair; we test the button stack on the bench.",
    suspects: [
      {
        partIds: ["crown"],
        likelihood: "primary",
        why: "A crown that turns but no longer clicks or taps usually has a worn switch or ingress in its own stack.",
      },
      {
        partIds: ["taptic"],
        likelihood: "possible",
        why: "Some crown feedback is produced by the main engine, so we confirm which one has gone silent.",
      },
    ],
  },
  "v-haptic-settings": {
    kind: "verdict",
    title: "CHECK HAPTIC SETTINGS FIRST",
    summary:
      "Before any hardware look, make sure haptics are turned up and the watch isn't in silent or theatre mode — that resolves plenty of 'no taps' reports. If the settings are already right, the taptic engine is the first hardware suspect, and the assessment is free.",
    suspects: [
      {
        partIds: ["taptic"],
        likelihood: "primary",
        why: "With haptics enabled and still silent, the taptic engine is the leading on-watch suspect.",
      },
      {
        partIds: ["sip"],
        likelihood: "possible",
        why: "A missing drive signal from the module can also silence the taps — we check it on the bench.",
      },
    ],
  },
  "v-seal": {
    kind: "verdict",
    title: "WATER SEAL / GASKET",
    summary:
      "A water-resistance warning or a gap without a soaking usually means the perimeter seal is perished or pinched, or the case has been disturbed. Renewing the gasket and reseating the case normally restores the rating; we pressure-check where we can.",
    suspects: [
      {
        partIds: ["gasket"],
        likelihood: "primary",
        why: "The perimeter gasket is what holds water out; a perished or pinched seal is the usual cause of a lost rating.",
      },
      {
        partIds: ["case"],
        likelihood: "possible",
        why: "A knocked or slightly sprung case can break the seal even with a good gasket.",
      },
    ],
  },
  "v-water-speaker": {
    kind: "verdict",
    title: "WATER IN THE SPEAKER",
    summary:
      "Muffled or watery audio after a dunk is usually water sitting in the speaker cavity. Sometimes drying and a clean is enough; if the driver is corroded it may need replacing, and we'll check the seal that let water in.",
    suspects: [
      {
        partIds: ["speaker"],
        likelihood: "primary",
        why: "The speaker cavity traps water first, so muffled or bubbly sound after a soak points there.",
      },
      {
        partIds: ["gasket"],
        likelihood: "possible",
        why: "Water reaching the speaker means the seal let it in — the gasket is checked and renewed as needed.",
      },
    ],
    relatedIcs: [
      {
        icId: "audio",
        note: "If audio stays distorted after drying, the audio circuit may be corroded — a board-level check.",
      },
    ],
  },
  "v-water-damage": {
    kind: "verdict",
    title: "LIQUID INSIDE — POWER IT DOWN",
    urgent: true,
    summary:
      "Power it off and keep it off the charger — running or charging a wet watch drives corrosion and can be unsafe. Don't try to dry it with heat. Bring it in promptly; the sooner it's opened, cleaned and assessed, the better the odds for the board and your data.",
    suspects: [
      {
        partIds: ["sip"],
        likelihood: "primary",
        why: "Liquid that reaches the sealed module corrodes it quickly — glitching and shutdowns after a soak point there.",
      },
      {
        partIds: ["display"],
        likelihood: "possible",
        why: "Moisture under the glass commonly disrupts the panel and touch until it's cleaned.",
      },
      {
        partIds: ["battery"],
        likelihood: "possible",
        why: "A liquid-exposed cell can behave erratically and is checked for safety during the clean-up.",
      },
    ],
    relatedIcs: [
      {
        icId: "pmic",
        note: "Liquid corrosion often lands on the power-management circuitry — a board-level clean and assessment.",
      },
    ],
  },
  "v-pair-soft": {
    kind: "verdict",
    title: "SOFTWARE / PAIRING FIRST",
    summary:
      "Dropouts that ease with a toggle or restart, or that track your phone's own Bluetooth mood, are usually software rather than a broken part. In our experience un-pairing and re-pairing, then updating both devices, clears most of these before any hardware is involved — worth doing first, and the assessment is free if it persists.",
    suspects: [
      {
        partIds: ["sip"],
        likelihood: "primary",
        why: "The Bluetooth radio and its firmware live in the sealed module; when pairing misbehaves the fix is usually a re-pair or update, not a part.",
      },
    ],
  },
  "v-pair-persist": {
    kind: "verdict",
    title: "PERSISTENT PAIRING FAULT",
    summary:
      "If it still drops right beside the phone after a clean re-pair and updates, it's worth a bench look — though in our experience this is more often software or the phone side than a broken watch. We start by confirming the radio and its firmware before ever suspecting an antenna.",
    suspects: [
      {
        partIds: ["sip"],
        likelihood: "primary",
        why: "The module runs the Bluetooth radio and its firmware, so a genuine hardware fault here shows up first — after software and re-pairing are exhausted.",
      },
      {
        partIds: ["antenna"],
        likelihood: "possible",
        why: "Only if the radio and software both check out do we consider the antenna flex — it is rarely the real cause.",
      },
    ],
    relatedIcs: [
      {
        icId: "wifi",
        note: "The wireless combo circuit is a board-level check, and only after re-pairing and updates are ruled out.",
      },
    ],
  },
};

const WATCH_DIAGNOSTICS: DeviceDiagnostics<WatchPartId, N> = {
  device: "watch",
  symptoms: [
    {
      id: "no-power",
      label: "Won't turn on",
      tagline: "Black screen, no response",
      start: "pw-q1",
    },
    {
      id: "no-charge",
      label: "Won't charge",
      tagline: "Won't fill on the puck",
      start: "ch-q1",
    },
    {
      id: "cracked",
      label: "Cracked or faulty screen",
      tagline: "Glass or picture damaged",
      start: "cr-q1",
    },
    {
      id: "battery-drain",
      label: "Battery drains fast",
      tagline: "Dies before the day does",
      start: "bt-q1",
    },
    {
      id: "no-haptics",
      label: "No taps / haptics",
      tagline: "Silent on the wrist",
      start: "hp-q1",
    },
    {
      id: "water",
      label: "Got wet / won't seal",
      tagline: "Water resistance in doubt",
      start: "wt-q1",
    },
    {
      id: "no-pair",
      label: "Won't pair / keeps dropping",
      tagline: "Bluetooth to phone unstable",
      start: "bp-q1",
    },
  ],
  nodes,
};

export default WATCH_DIAGNOSTICS;
