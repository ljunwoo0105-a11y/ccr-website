# Diagnostic content research — verified claims

Source: deep-research workflow (fan-out web search → fetch → 3-vote adversarial
verification). 23 sources fetched → 113 claims → **18 confirmed, 7 refuted**.
The final synthesis pass hit a session limit, so this is the raw verified-claims
ledger — the authoritative input for the `diagnostics/*` wizard trees and
`board-data.ts` IC dossiers. Every "primary"-rank cause in the data files should
trace to a CONFIRMED row here (or be softened to "likely"/"possible").

Tone rules unchanged: hedged language, no prices, `/quote` CTA.

## CONFIRMED (use these)

### Phone — won't turn on / black screen
- **Rule-out order is battery/charge-port first, logic-board LAST.** iFixit's
  won't-turn-on chain: force-restart → dead battery → dirty port/cable → faulty
  battery/port → power button → display → *finally* logic board.
  (ifixit.com/Troubleshooting/iPhone/Won't+Turn+On) — **matches `phone.ts`
  v-power-path ranking.**
- **A deeply drained battery looks dead even on a charger** — charge 10–30 min
  before concluding hardware failure. Good first no-tools step.
- **"Dead" phone may be a failed display** — if it makes sound / vibrates (mute
  toggle), the display (oled/display-flex) is the cause, not power. **Matches
  `phone.ts` np-q1 → v-screen-path.**
- Firmware crash is a *primary-tier* won't-turn-on cause when there's no
  damage/liquid history → **Phase 3: add a "try a force-restart first" step.**
- Backlight-failure branch applies only to LCD iPhones (8/SE/XR/11); OLED has no
  separate backlight. Software image failure is *rare* → rank "possible".

### Watch
- **Ping from the paired phone**: vibrates/sounds but screen black → display is
  the likely fault (not power/battery). Branch on ping response.
- Not-charging causes are mostly external first: bad cable/pad/outlet, depleted
  battery; leave on charger ≥1 hr before suspecting coil/battery.
- **URGENT**: watch getting hot on the charger (esp. while failing to power on)
  is a battery/charge-circuit hazard → red-flag branch.

### Laptop
- **Cable-wiggle test**: intermittent power / physical jack looseness → DC power
  jack (`dc-jack`). Charges only when plug held/wiggled → damaged adapter cable
  or failed dc-jack.
- Power reaches the board but **no LEDs and no fan** → mainboard, not jack/adapter.

### Drone (DJI-class)
- **Gimbal Motor Overloaded**: most common non-hardware cause is the transport
  protector/buckle or protection sticker left on, or debris jamming the gimbal →
  first no-tools question "is the clamp/protector still on?".
- Third-party filters/lenses on the gimbal can overload the motor → ask about it.
- **Weak/lost GPS**: environment (buildings, trees, indoors, metal, HV towers) is
  the primary cause, not hardware — rank environment first, then gps/antennas.
- GPS strength is on-screen: DJI Fly bar turns yellow/red; DJI GO <3 bars or <12
  satellites. Usable see-it-yourself question.

## REFUTED (do NOT encode)
- ❌ "Flashlight test reveals backlight failure" — refuted 0-3.
- ❌ "GPS loss → auto ATTI mode → visible drift as a discriminator" — refuted 0-3.
- ❌ "AC adapter is the #1 laptop no-start cause, rule out first" — refuted 1-2.
- ❌ "'No battery detected' → bad battery primary, mainboard fallback" — refuted 0-3.
- ❌ "Fast discharge after ~80% = failed battery" — refuted 0-3.
- ❌ "Watch won't pair → software glitch primary / broken BT antenna if persists"
  — both refuted 0-3 (keep watch-pairing verdicts vague / software-first only if
  re-sourced).

## Board-level IC sources (for board-data.ts TECH notes)
Confirmed forum threads underpinning the charging-IC (Tristar/Hydra) and
NAND-pairing / data-recovery framing:
- forum.ipadrehab.com — iPhone Tristar (U2/charging IC) repair threads
- badcaps.net — iPhone XS NAND-flash data recovery
- repair.wiki — recovering original sysconfig/NAND data (SoC↔NAND pairing)

## Primary sources
- ifixit.com/Troubleshooting/iPhone/Won't+Turn+On/405189 (primary)
- ifixit.com/Troubleshooting/iPhone/Black+Screen/479710 (primary)
- ifixit.com/Wiki/iPhone_Wont_Turn_On, /Wiki/Apple_Watch_Troubleshooting
- ifixit.com/Answers — iPad "turns on when plugged in but won't charge", "battery or other IC"
- support.dji.com — Gimbal Motor Overloaded; GPS signal weak/lost
- insidemylaptop.com, laptoprepair101.com — laptop power-jack / charging
