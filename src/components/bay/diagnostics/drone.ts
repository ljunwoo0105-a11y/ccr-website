// ---------------------------------------------------------------------------
// Drone fault-trace wizard — research-backed trees (see phone.ts for the
// reference implementation and types.ts for the content rules: hedged
// language, no prices, /quote CTA, no-tools questions).
//
// Grounding (docs/research/diagnostic-research.md, CONFIRMED rows):
//  - Gimbal "motor overloaded": ask about the transport lock / protector /
//    sticker / debris FIRST, then third-party filters/lenses, THEN hardware.
//  - Weak/lost GPS: environment (buildings, trees, indoors, metal) is the
//    primary cause — rank it first, then gps/antennas. On-screen: yellow/red
//    bar or fewer than ~12 satellites.
//  - REFUTED and NOT encoded: "GPS loss → auto ATTI → visible drift as a
//    discriminator".
// ---------------------------------------------------------------------------

import type { DeviceDiagnostics, DiagNode } from "./types";
import type { DronePartId } from "../rig-data/drone";

type N =
  // gimbal error
  | "g-q1"
  | "g-q2"
  | "g-q3"
  // weak / lost GPS
  | "gps-q1"
  | "gps-q2"
  | "gps-q3"
  // imu / compass calibration
  | "cal-q1"
  | "cal-q2"
  // won't power up
  | "np-q1"
  | "np-q2"
  // one motor won't spin
  | "mot-q1"
  | "mot-q2"
  // camera / footage
  | "cam-q1"
  | "cam-q2"
  // crash damage
  | "crash-q1"
  // battery puffed
  | "swell-q1"
  | "swell-q2"
  // verdicts
  | "v-gimbal-clamp"
  | "v-gimbal-filter"
  | "v-gimbal-hw"
  | "v-crash-damage"
  | "v-gps-env"
  | "v-gps-hw"
  | "v-compass"
  | "v-imu"
  | "v-cal-ok"
  | "v-battery-power"
  | "v-power-path"
  | "v-power-fc"
  | "v-motor-bearing"
  | "v-esc-motor"
  | "v-videotx"
  | "v-camera"
  | "v-battery-swell"
  | "v-battery-wear";

const nodes: Record<N, DiagNode<DronePartId, N>> = {
  // ---- Symptom: gimbal error ---------------------------------------------
  "g-q1": {
    kind: "question",
    question:
      "Before take-off, is the little gimbal transport clamp, or a protective sticker, still on the camera?",
    help: "Check the head can swing freely — look for a clip-on guard, a film sticker, or grit jamming the movement.",
    focusParts: ["gimbal", "camera"],
    options: [
      {
        id: "still-on",
        label: "Yes — the clamp, sticker or debris is still there",
        next: "v-gimbal-clamp",
      },
      {
        id: "removed",
        label: "No — it's clear and moves freely",
        next: "g-q2",
      },
    ],
  },
  "g-q2": {
    kind: "question",
    question: "Have you added a third-party filter or lens onto the camera?",
    help: "ND filters and add-on lenses change the weight the gimbal has to hold.",
    focusParts: ["camera", "gimbal"],
    options: [
      { id: "filter-yes", label: "Yes — there's an add-on filter/lens", next: "v-gimbal-filter" },
      { id: "filter-no", label: "No — standard lens only", next: "g-q3" },
    ],
  },
  "g-q3": {
    kind: "question",
    question: "Did the gimbal error start right after a crash or hard landing?",
    help: "Look for a bent arm, a head that hangs at an angle, or a horizon that stays tilted.",
    focusParts: ["gimbal", "camera", "arm-fr"],
    options: [
      { id: "after-crash", label: "Yes — it followed an impact", next: "v-crash-damage" },
      { id: "no-crash", label: "No — no crash involved", next: "v-gimbal-hw" },
    ],
  },

  // ---- Symptom: weak / lost GPS ------------------------------------------
  "gps-q1": {
    kind: "question",
    question:
      "Where were you flying — near buildings, trees, indoors, or over metal such as a car park?",
    help: "All of those block or bounce the satellite signal. Think about what was directly overhead and around you.",
    focusParts: ["gps", "antennas"],
    options: [
      {
        id: "near-obstruction",
        label: "Near buildings, trees, indoors or metal",
        next: "v-gps-env",
      },
      { id: "open-sky", label: "Out in the open with clear sky", next: "gps-q2" },
    ],
  },
  "gps-q2": {
    kind: "question",
    question:
      "Open the app — is the GPS bar yellow/red, or the satellite count under about 12, even out in the open?",
    help: "DJI Fly shows a coloured GPS bar; DJI GO shows a satellite number. Read it while standing in the clear.",
    focusParts: ["gps"],
    options: [
      { id: "weak-open", label: "Yes — weak even in the open", next: "gps-q3" },
      {
        id: "only-bad-spots",
        label: "It's only weak in tight or built-up spots",
        next: "v-gps-env",
      },
    ],
  },
  "gps-q3": {
    kind: "question",
    question: "Did the weak GPS start after a crash, or does the aircraft also warn about the compass?",
    help: "A knock can shift the antenna or its lead near the shell.",
    focusParts: ["gps", "antennas", "compass"],
    options: [
      { id: "after-crash", label: "Yes — after a crash", next: "v-crash-damage" },
      { id: "no-crash", label: "No crash, GPS-only", next: "v-gps-hw" },
    ],
  },

  // ---- Symptom: IMU / compass calibration --------------------------------
  "cal-q1": {
    kind: "question",
    question: "Read the alert — is it about the IMU, the compass, or general drift and tilting?",
    help: "The app usually names which sensor it wants calibrated.",
    focusParts: ["imu", "compass", "fc"],
    options: [
      { id: "imu-alert", label: "IMU calibration", next: "cal-q2" },
      { id: "compass-alert", label: "Compass / interference", next: "v-compass" },
      { id: "drift", label: "General drift or tilting in flight", next: "cal-q2" },
    ],
  },
  "cal-q2": {
    kind: "question",
    question:
      "After calibrating on a level surface, well away from metal, phones and speakers — does it pass and stay passed?",
    help: "Do it on the ground, on something flat and non-metallic, and watch whether the warning returns next flight.",
    focusParts: ["imu", "compass"],
    options: [
      { id: "passes", label: "Yes — it passes and flies straight", next: "v-cal-ok" },
      { id: "fails", label: "No — it fails or the warning comes back", next: "v-imu" },
    ],
  },

  // ---- Symptom: won't power up -------------------------------------------
  "np-q1": {
    kind: "question",
    question:
      "With a charged battery clicked in and the power button pressed, do the status LEDs light or the aircraft chime?",
    help: "Watch the arm/rear LEDs and listen for the start-up tones for 20–30 seconds.",
    focusParts: ["battery", "esc", "fc"],
    options: [
      { id: "nothing", label: "Nothing at all — completely dead", next: "np-q2" },
      {
        id: "reacts-no-boot",
        label: "Lights or a chime, but it won't finish starting",
        next: "v-power-fc",
      },
    ],
  },
  "np-q2": {
    kind: "question",
    question: "Take the battery off the aircraft and press its own button — do the pack's LEDs light?",
    help: "A smart pack shows its charge on its own LEDs when you tap the button.",
    focusParts: ["battery"],
    options: [
      { id: "batt-dead", label: "No — the pack's own lights stay dark", next: "v-battery-power" },
      { id: "batt-ok", label: "Yes — the pack lights up fine", next: "v-power-path" },
    ],
  },

  // ---- Symptom: one motor won't spin -------------------------------------
  "mot-q1": {
    kind: "question",
    question:
      "Powered off, spin each prop gently by hand. Does one feel gritty, stiff or notchy compared with the others?",
    help: "Turn each rotor a full circle — a worn bearing feels rough or catches.",
    focusParts: ["arm-fr", "arm-fl", "arm-rr", "arm-rl"],
    options: [
      { id: "one-gritty", label: "Yes — one feels rough or stiff", next: "v-motor-bearing" },
      { id: "all-smooth", label: "No — they all spin freely", next: "mot-q2" },
    ],
  },
  "mot-q2": {
    kind: "question",
    question: "Did the dead motor start after a crash, or did it just stop on a normal flight?",
    help: "A single rotor that won't spin up, or beeps differently from the rest, is the thing to note.",
    focusParts: ["esc", "arm-fr"],
    options: [
      { id: "after-crash", label: "After a crash or hard landing", next: "v-crash-damage" },
      { id: "no-crash", label: "It just stopped — no crash", next: "v-esc-motor" },
    ],
  },

  // ---- Symptom: camera / footage -----------------------------------------
  "cam-q1": {
    kind: "question",
    question:
      "Is the picture bad on the aircraft's own recording, or only on the live feed to your controller?",
    help: "Play back a clip from the SD card versus what you see live on the screen — they can differ.",
    focusParts: ["camera", "rc-board"],
    options: [
      { id: "recording-bad", label: "Bad on the recorded clip itself", next: "cam-q2" },
      { id: "live-only", label: "Only the live feed is poor or dropping", next: "v-videotx" },
    ],
  },
  "cam-q2": {
    kind: "question",
    question:
      "Is it blurry, soft or spotty (image quality), or is the horizon tilted and the shot jerky (movement)?",
    help: "Image faults look like smudges or soft focus; movement faults look like a leaning or shaky horizon.",
    focusParts: ["camera", "gimbal"],
    options: [
      { id: "image", label: "Blurry, soft or spotty image", next: "v-camera" },
      { id: "movement", label: "Tilted horizon or jerky movement", next: "v-gimbal-hw" },
    ],
  },

  // ---- Symptom: crash damage ---------------------------------------------
  "crash-q1": {
    kind: "question",
    question: "After the crash, what looks or sounds wrong first?",
    help: "Give it a slow once-over — arms, shell, the gimbal head, and whether it still powers up.",
    focusParts: ["arm-fr", "top-shell", "gimbal"],
    options: [
      { id: "arm-body", label: "A cracked arm, shell or landing leg", next: "v-crash-damage" },
      { id: "gimbal-camera", label: "The gimbal or camera is hanging / tilted", next: "v-gimbal-hw" },
      { id: "wont-power", label: "It won't power up at all now", next: "v-power-path" },
    ],
  },

  // ---- Symptom: battery puffed -------------------------------------------
  "swell-q1": {
    kind: "question",
    question:
      "Take the battery off and set it on a flat surface. Is it puffed or bulging, or does it rock instead of sitting flat?",
    help: "Look along each face for swelling; a healthy pack sits dead flat and square.",
    focusParts: ["battery"],
    options: [
      { id: "puffed", label: "Yes — puffed, bulging or rocking", next: "v-battery-swell" },
      { id: "flat", label: "No — it looks flat and normal", next: "swell-q2" },
    ],
  },
  "swell-q2": {
    kind: "question",
    question: "Does the pack get noticeably hot while charging or flying?",
    help: "Warm is normal; too-hot-to-hold is not.",
    focusParts: ["battery", "esc"],
    options: [
      { id: "hot", label: "Yes — it gets hot", next: "v-battery-swell" },
      { id: "drains", label: "No — it's just short flight times", next: "v-battery-wear" },
    ],
  },

  // ---- Verdicts (shared across trees) ------------------------------------
  "v-gimbal-clamp": {
    kind: "verdict",
    title: "GIMBAL — CLEAR THE LOCK FIRST",
    summary:
      "A 'gimbal motor overloaded' warning most often isn't a fault at all — the transport clamp, a protective sticker, or a bit of grit is stopping the head moving freely. Take the lock and any film off, clear any debris, and restart. If it still complains, the gimbal or camera is worth a proper look.",
    suspects: [
      {
        partIds: ["gimbal"],
        likelihood: "primary",
        why: "In our experience the overload almost always clears once the transport protector, sticker or debris is off the gimbal — it's the first thing we check.",
      },
      {
        partIds: ["camera"],
        likelihood: "possible",
        why: "If a clean, unlocked gimbal still reports overload, the camera block or its ribbon can be dragging on the movement.",
      },
    ],
  },
  "v-gimbal-filter": {
    kind: "verdict",
    title: "GIMBAL — THIRD-PARTY FILTER LOAD",
    summary:
      "Add-on filters and lenses change the weight the gimbal motors have to hold, and a heavy or badly-fitted one can trip an overload warning. Try flying with the standard lens; if that settles it, the filter was the cause. If it persists, we'd look at the gimbal itself.",
    suspects: [
      {
        partIds: ["gimbal"],
        likelihood: "primary",
        why: "Extra glass on the front loads the stabiliser motors — a common, easily-missed overload trigger.",
      },
      {
        partIds: ["camera"],
        likelihood: "possible",
        why: "A filter mount pressing on the lens can also strain the camera block.",
      },
    ],
  },
  "v-gimbal-hw": {
    kind: "verdict",
    title: "GIMBAL / CAMERA — HARDWARE",
    summary:
      "With the lock, stickers and filters ruled out, a gimbal that tilts, drifts or errors usually points at the stabiliser hardware — a motor, a bent axis arm, or the fine ribbon feeding the camera. These are among the most common bench jobs on a crashed drone, and a free assessment pins down which part.",
    suspects: [
      {
        partIds: ["gimbal"],
        likelihood: "primary",
        why: "The three-axis cage takes the worst of any knock — bent arms, strained motors and horizon tilt are its signature faults.",
      },
      {
        partIds: ["camera"],
        likelihood: "likely",
        why: "The camera's flat ribbon flexes with every gimbal movement and is a frequent failure after a crash.",
      },
      {
        partIds: ["fc"],
        likelihood: "possible",
        why: "Rarely the flight controller's orientation sensing is behind a stubborn tilt — we test this before replacing anything.",
      },
    ],
  },
  "v-crash-damage": {
    kind: "verdict",
    title: "CRASH DAMAGE — MULTI-PART",
    summary:
      "After a real impact the damage is often spread across a few parts — a cracked arm or shell, a knocked gimbal, sometimes strained landing legs. Bring it in and we'll map out everything that took a hit in one free assessment rather than guessing part-by-part.",
    suspects: [
      {
        partIds: ["arm-fr", "arm-fl", "arm-rr", "arm-rl"],
        likelihood: "primary",
        label: "Arms + motors",
        why: "Folding arms and their motors are the most exposed parts in a crash — cracks, bent shafts and grinding bearings are common.",
      },
      {
        partIds: ["top-shell", "bottom-shell"],
        likelihood: "likely",
        label: "Top / bottom shells",
        why: "The composite shells crack and their internal mounts stress-fracture on impact.",
      },
      {
        partIds: ["gimbal"],
        likelihood: "possible",
        why: "The exposed gimbal frequently bends or jams in a hard landing.",
      },
      {
        partIds: ["landing-gear"],
        likelihood: "possible",
        why: "Landing legs and feet take the final blow and can split or splay.",
      },
    ],
  },
  "v-gps-env": {
    kind: "verdict",
    title: "GPS — LIKELY YOUR SURROUNDINGS",
    summary:
      "Weak or dropping GPS is, in our experience, far more often about where you're flying than a broken part. Buildings, trees, being indoors, car parks and anything metal all block or reflect the satellite signal. Try again in the open, well away from structures — if a healthy lock comes back, nothing needs repairing.",
    suspects: [
      {
        partIds: ["gps"],
        likelihood: "primary",
        why: "Out near obstructions the ceramic patch antenna usually tests perfectly fine — it just can't see enough sky; we'd only suspect the module if weak lock follows you into clear, open areas.",
      },
      {
        partIds: ["antennas"],
        likelihood: "possible",
        why: "If the problem persists everywhere, the antenna routing near the shell is the next thing to check.",
      },
    ],
    relatedIcs: [
      {
        icId: "rf",
        note: "GPS runs through the board's RF front-end — see the board-level bench if a weak lock persists in open sky.",
      },
    ],
  },
  "v-gps-hw": {
    kind: "verdict",
    title: "GPS / ANTENNA — HARDWARE",
    summary:
      "A weak or missing lock that follows you into wide-open sky, with a low satellite count or a yellow/red bar every time, is harder to blame on surroundings. That usually points at the GPS patch or its antenna path. A bench check confirms it before any part is replaced.",
    suspects: [
      {
        partIds: ["gps"],
        likelihood: "primary",
        why: "A patch antenna damaged by a crash or water ingress gives a permanently weak lock even under clear sky.",
      },
      {
        partIds: ["antennas"],
        likelihood: "likely",
        why: "A pinched or broken antenna lead near the shell drops satellite reception.",
      },
      {
        partIds: ["fc"],
        likelihood: "possible",
        why: "Occasionally the flight controller's positioning circuitry is behind a stubborn no-GPS fault.",
      },
    ],
    relatedIcs: [
      {
        icId: "rf",
        note: "GPS reception passes through the RF front-end on the board — a stop on the board-level bench.",
      },
    ],
  },
  "v-compass": {
    kind: "verdict",
    title: "COMPASS INTERFERENCE / CALIBRATION",
    summary:
      "A compass-error or 'interference' warning is usually the magnetometer being confused by nearby metal, magnets, phones or speakers — or simply needing a calibration in a clean spot. Recalibrate on level ground well away from all of that. If the warning keeps returning, the compass module is worth checking.",
    suspects: [
      {
        partIds: ["compass"],
        likelihood: "primary",
        why: "The magnetometer is easily thrown by local magnetic fields; when a clean-area calibration won't hold, the module itself is the suspect.",
      },
      {
        partIds: ["fc"],
        likelihood: "possible",
        why: "The heading data lands on the flight controller — rarely, that path is the issue rather than the sensor.",
      },
    ],
  },
  "v-imu": {
    kind: "verdict",
    title: "IMU / CALIBRATION FAULT",
    summary:
      "Drift, tilt or an IMU-calibration warning that keeps coming back usually traces to the inertial sensor on its damping mounts, or the controller reading it. If a clean calibration won't pass or won't stay passed, we'd look at the IMU and its mounts on the bench.",
    suspects: [
      {
        partIds: ["imu"],
        likelihood: "primary",
        why: "The IMU rides on soft dampers to isolate vibration; perished mounts or a knocked sensor give the classic drift-and-tilt that calibration won't cure.",
      },
      {
        partIds: ["fc"],
        likelihood: "likely",
        why: "The flight controller processes the IMU data — a fault there can mimic a bad sensor.",
      },
      {
        partIds: ["compass"],
        likelihood: "possible",
        why: "A confused compass sometimes shows up alongside IMU complaints.",
      },
    ],
  },
  "v-cal-ok": {
    kind: "verdict",
    title: "CALIBRATION — LIKELY RESOLVED",
    summary:
      "If a calibration on level ground, away from metal, passes and the aircraft flies straight afterwards, there's usually no hardware fault — a periodic recalibration is normal maintenance. Only a warning that keeps returning despite a clean calibration points at the sensors.",
    suspects: [
      {
        partIds: ["imu"],
        likelihood: "primary",
        why: "A calibration that holds means the IMU is doing its job — we'd only revisit it if the warning comes back.",
      },
      {
        partIds: ["compass"],
        likelihood: "possible",
        why: "Likewise the compass; recurring warnings after a clean calibration are the trigger to check it.",
      },
    ],
  },
  "v-battery-power": {
    kind: "verdict",
    title: "FLIGHT BATTERY — NOT POWERING",
    summary:
      "If the pack's own lights stay dark off the aircraft, the smart battery is the most likely reason nothing powers up — its internal protection board may have tripped, or the cells may be too flat to wake. Charge it fully first; if it still won't light, the pack needs assessing.",
    suspects: [
      {
        partIds: ["battery"],
        likelihood: "primary",
        why: "Smart flight batteries carry their own protection electronics — a tripped or failed pack plays completely dead.",
      },
      {
        partIds: ["esc"],
        likelihood: "possible",
        why: "If a known-good pack also stays dead in the aircraft, the ESC power board that feeds the stack is next in line.",
      },
    ],
    relatedIcs: [
      {
        icId: "mosfet",
        note: "Burnt power MOSFETs on the ESC are the classic crash-then-dead failure — see the board bench.",
      },
    ],
  },
  "v-power-path": {
    kind: "verdict",
    title: "POWER PATH FAULT",
    summary:
      "A charged, healthy-looking pack that still won't bring the aircraft to life usually means power isn't getting through the stack — most often the ESC power board, sometimes the flight controller. A free bench assessment traces exactly where it stops.",
    suspects: [
      {
        partIds: ["esc"],
        likelihood: "primary",
        why: "The ESC board distributes battery power to everything downstream; burnt drivers stop the whole aircraft.",
      },
      {
        partIds: ["fc"],
        likelihood: "likely",
        why: "If power reaches the board but nothing boots, the flight controller may be failing to start the stack.",
      },
      {
        partIds: ["battery"],
        likelihood: "possible",
        why: "A pack that lights up on its own but can't hold load under the aircraft can still be the culprit.",
      },
    ],
    relatedIcs: [
      {
        icId: "mosfet",
        note: "Dead-after-power drones often trace to burnt MOSFETs on the ESC — a board-level job.",
      },
    ],
  },
  "v-power-fc": {
    kind: "verdict",
    title: "BOOT / FLIGHT-CONTROLLER FAULT",
    summary:
      "Lights or a chime but no full start-up means power is arriving — the aircraft just isn't completing its boot or arming. That usually points at the flight controller, occasionally the ESC. We'd trace the boot sequence on the bench; the assessment is free.",
    suspects: [
      {
        partIds: ["fc"],
        likelihood: "primary",
        why: "When an aircraft reacts but won't finish booting or arming, the flight controller is the usual suspect.",
      },
      {
        partIds: ["esc"],
        likelihood: "likely",
        why: "A partly-failed ESC can let the lights come on yet still block a clean start-up.",
      },
    ],
    relatedIcs: [
      {
        icId: "mosfet",
        note: "A partly-shorted ESC MOSFET can power the LEDs yet stall the boot — see the board bench.",
      },
    ],
  },
  "v-motor-bearing": {
    kind: "verdict",
    title: "MOTOR BEARING / ARM",
    summary:
      "A prop that feels gritty, stiff or notchy by hand is the sound of a worn or grit-packed motor bearing on that arm. Caught early it's a straightforward motor or bearing job; left too long it can strain the ESC that drives it.",
    suspects: [
      {
        partIds: ["arm-fr", "arm-fl", "arm-rr", "arm-rl"],
        likelihood: "primary",
        label: "Affected arm + motor",
        why: "Grinding, notchy bearings are a common wear item on the brushless motors — usually just the one arm is affected.",
      },
      {
        partIds: ["esc"],
        likelihood: "possible",
        why: "A motor fighting a dragging bearing pulls extra current and can stress its ESC channel over time.",
      },
    ],
    relatedIcs: [
      {
        icId: "mosfet",
        note: "A motor channel that keeps failing can take out its ESC MOSFET — a board-level check.",
      },
    ],
  },
  "v-esc-motor": {
    kind: "verdict",
    title: "MOTOR / ESC — ONE ROTOR DOWN",
    summary:
      "One motor that won't spin up, or beeps differently from the rest, usually points at that motor or the ESC channel driving it. A free bench test tells the two apart before anything is replaced.",
    suspects: [
      {
        partIds: ["esc"],
        likelihood: "primary",
        why: "A single dead or stuttering rotor most often traces to its speed-controller channel on the ESC board — a classic burnt-MOSFET failure.",
      },
      {
        partIds: ["arm-fr", "arm-fl", "arm-rr", "arm-rl"],
        likelihood: "likely",
        label: "Affected arm + motor",
        why: "The motor or its winding on that arm can also be the fault, especially after a crash.",
      },
      {
        partIds: ["fc"],
        likelihood: "possible",
        why: "Rarely the flight controller's signal to that channel is the issue.",
      },
    ],
    relatedIcs: [
      {
        icId: "mosfet",
        note: "A dead rotor is the textbook symptom of a burnt ESC MOSFET — see the board-level bench.",
      },
    ],
  },
  "v-videotx": {
    kind: "verdict",
    title: "VIDEO / TRANSMISSION FAULT",
    summary:
      "If the aircraft's own recording looks fine but the live feed to your controller is poor or missing, the trouble is on the transmission side rather than the camera — the video board or its antennas. Interference and range play a part too, so we check the easy causes first.",
    suspects: [
      {
        partIds: ["rc-board"],
        likelihood: "primary",
        why: "The video-transmission board handles the live downlink; when recordings are clean but the feed isn't, this is the usual suspect.",
      },
      {
        partIds: ["antennas"],
        likelihood: "likely",
        why: "Damaged or pinched antennas near the shell drop the live picture while onboard recording stays fine.",
      },
      {
        partIds: ["fc"],
        likelihood: "possible",
        why: "Occasionally the fault sits deeper in the aircraft's mainboard path.",
      },
    ],
    relatedIcs: [
      {
        icId: "rf",
        note: "The live downlink runs through the RF front-end — a stop on the board-level bench.",
      },
    ],
  },
  "v-camera": {
    kind: "verdict",
    title: "CAMERA MODULE",
    summary:
      "Blurry, soft or spotty footage that shows up on the aircraft's own recording usually points at the camera block itself — the sensor, the lens glass, or its ribbon. A camera-module job is a common fix, and a free assessment confirms it isn't the gimbal first.",
    suspects: [
      {
        partIds: ["camera"],
        likelihood: "primary",
        why: "Soft, spotty or cracked-looking footage on the onboard recording is the camera block's signature — sensor, lens or ribbon.",
      },
      {
        partIds: ["gimbal"],
        likelihood: "possible",
        why: "We rule the stabiliser cage out too, since a dragging gimbal can blur footage the camera itself is capturing cleanly.",
      },
    ],
  },
  "v-battery-swell": {
    kind: "verdict",
    title: "SWOLLEN / HOT BATTERY — HANDLE WITH CARE",
    urgent: true,
    summary:
      "Stop using and stop charging the pack now, and set it somewhere safe and non-flammable. A puffed or hot flight battery is pressure- and heat-loaded and should never be squeezed, punctured or 'flown flat'. Bring it in as soon as you can — swapping a failing pack is routine, and the sooner it's out the safer everything around it is.",
    suspects: [
      {
        partIds: ["battery"],
        likelihood: "primary",
        why: "Gas build-up or heat inside a failing LiPo pack is a genuine hazard — it will not recover and should be retired promptly.",
      },
      {
        partIds: ["bottom-shell"],
        likelihood: "possible",
        why: "A pack that has swollen inside the bay can distort the shell or its mounts, which we'd check once the battery is out.",
      },
    ],
  },
  "v-battery-wear": {
    kind: "verdict",
    title: "FLIGHT BATTERY — WORN PACK",
    summary:
      "A pack that charges but drops fast, or won't hold its charge between flights, is showing normal cell wear. Most likely a straightforward battery replacement after a health check — and we confirm the aircraft isn't over-drawing a healthy pack first.",
    suspects: [
      {
        partIds: ["battery"],
        likelihood: "primary",
        why: "Flight cells fade with charge cycles and cold flights — short flight times and sudden voltage sag are the classic signs.",
      },
      {
        partIds: ["esc"],
        likelihood: "possible",
        why: "Rarely, a power-hungry fault on the ESC drains even a healthy pack — worth ruling out.",
      },
    ],
    relatedIcs: [
      {
        icId: "mosfet",
        note: "Unexplained drain with a fresh pack can be a leaky ESC rail — a board-level check.",
      },
    ],
  },
};

const DRONE_DIAGNOSTICS: DeviceDiagnostics<DronePartId, N> = {
  device: "drone",
  symptoms: [
    {
      id: "gimbal-error",
      label: "Gimbal error",
      tagline: "'Motor overloaded' or tilting horizon",
      start: "g-q1",
    },
    {
      id: "weak-gps",
      label: "Weak or lost GPS",
      tagline: "Few satellites, drifting position",
      start: "gps-q1",
    },
    {
      id: "calibration",
      label: "IMU / compass warnings",
      tagline: "Won't calibrate, drift or tilt",
      start: "cal-q1",
    },
    {
      id: "no-power",
      label: "Won't power up",
      tagline: "No LEDs, no chime",
      start: "np-q1",
    },
    {
      id: "one-motor",
      label: "A motor won't spin",
      tagline: "One rotor down or grinding",
      start: "mot-q1",
    },
    {
      id: "footage",
      label: "Camera or footage issues",
      tagline: "Blurry image or lost feed",
      start: "cam-q1",
    },
    {
      id: "crash",
      label: "Crash damage",
      tagline: "Hit something — what now?",
      start: "crash-q1",
    },
    {
      id: "battery-swell",
      label: "Battery puffed or hot",
      tagline: "Bulging, won't sit flat",
      start: "swell-q1",
    },
  ],
  nodes,
};

export default DRONE_DIAGNOSTICS;
