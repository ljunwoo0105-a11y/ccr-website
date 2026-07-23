# Boot-loop / short-cycle reboot diagnostics

Bench reference for the boot-loop diagnosis rules (Admin → Diagnoses,
`rule-phone-boot-loop-*` / `rule-iphone-*`). Everything here survived
3-vote adversarial verification against repair-community sources in
July 2026; anything that did not survive is listed under **Known gaps**
so it doesn't get treated as fact. Sources at the bottom.

## The two reboot signatures — tell them apart first

| Signature | What you see | Likely class |
| --- | --- | --- |
| **~3-minute cycle** | Boots to (or near) the lock screen, runs ~3 minutes, restarts, repeats forever | Missing-sensor kernel panic (watchdog). Very often a **charge-port dock flex** fault — the most common single cause is a bad aftermarket dock flex that omits the barometric sensor (Prs0) |
| **Seconds-scale loop** | Logo for a few seconds, restart, repeats; never reaches lock screen | Hard short / power-rail, PMIC, NAND — board-level territory. Triage with DC supply current shape (below) |

The iOS mechanism (verified): watchdog daemons (`thermalmonitord` etc.)
poll each model's required sensors; if a polled sensor never responds the
kernel panics and restarts. Only watchdog-polled sensors (thermal, prox,
mic, barometer) trigger this, and the required set varies by model and
iOS version.

## Panic-log triage (do this before opening the phone)

Settings → **Privacy** (iOS 16+: **Privacy & Security**) → Analytics &
Improvements → **Analytics Data** → files starting with **`panic-full`**.
Open the newest one; look for `thermalmonitord` and missing-sensor
strings.

### iPhone 12 series and older — named strings

| Panic string | Replace / check |
| --- | --- |
| `Prs0` (barometer) | Charge-port dock flex, or its FPC connector |
| `Mic1` | Charge-port dock flex. **SE 2020 caveat:** can also be a board trace break under the SIM tray |
| `Mic2` / `REARMIC2` | Power-button flex — common after back-glass repairs, esp. iPhone 11 series |
| `TG0B` / `TG0V` (battery temp/voltage) | Battery, battery connector, battery data line, or charging circuitry. **11 Pro / Pro Max:** battery data line routes through the charge-port flex, so that flex is also a candidate |
| `ANS2` | NAND / storage — board-level, quote accordingly |
| `AOP Panic - K2 - Bosch control channel write failure` | Charge-port dock flex (the Bosch part is the barometer on that flex); often triggers during loud audio |

### iPhone 13 and newer — per-model hex codes

Match against the **exact model**:

| Model | Code | Part |
| --- | --- | --- |
| 13 series | `0x800` | Charge-port flex |
| 13 series | `0x1000` | Proximity / front-sensor flex (`0x1800` = both) |
| 14 Pro | `0x40000` | Charge-port flex |
| 14 Pro | `0x80000` | Proximity / front-sensor flex |
| 15 Pro | `0xa1` | Battery |
| 15 Pro | `0x300000` | Charge-port flex |
| All 13+ | `0x20` | Charging circuit |
| All 13+ | `0x40` | Gas gauge |
| All 13+ | `0x400000` | Wireless charging coil |

## Bench isolation procedure (verified, iFixit)

1. Disconnect battery, then **all** connectors from the board.
2. Boot with the minimal set; if the symptom is gone, reconnect **one
   part at a time**, disconnecting the battery between each.
3. Use known-good battery, charge-port assembly and power-button cable,
   or results are meaningless.
4. **Expect a deliberate ~3-minute reboot on models after the iPhone X
   while sensor-carrying parts are disconnected** — that is the watchdog
   doing its job, not a new fault. Don't chase it.

## DC power supply signatures (indicative, not gospel)

- **Software-level boot loop:** current ramps to roughly 0.07–0.19 A,
  holds 20–30 s while iOS tries to load, drops to zero, repeats. The
  *shape* (ramp → hold → drop → repeat) is the signal; exact amps vary
  by model (single-sourced to Rossmann — treat bounds as indicative).
- **Hardware short:** sustained high draw (hundreds of mA) with no
  cycling. Board-level.

## AU price bands (mid-2026 snapshot — review before quoting)

| Repair path | Band (AUD) | Notes |
| --- | --- | --- |
| Battery replacement | $50–$120 low tier; shops $69–$160; Apple up to ~$169 (15+) | Airtasker floor under-represents shop rates on new models |
| Charge-port / dock flex | $60–$150 low tier; shops up to $199–$329 (15/16) | Use quality flexes — cheap ones missing the barometer CAUSE the 3-min reboot |
| Board-level microsolder | $95–$500, typically $150–$350 | AU shops mostly quote per device, no-fix-no-fee. MSIA tiers: $95–$120 (8), $95–$180 (X/XR/XS), $100–$200 (11), $150–$300 (12), $300 (13); FPC connector $85–$180 |
| Data recovery (dead phone) | $300–$400 (MSIA); market $300–$800 | |

## Known gaps — do NOT treat as covered

- **Android/Samsung bootloop rules** (eMMC wear, power-button flex,
  charging sub-board): no claims survived verification. Needs its own
  research pass; use the generic boot-loop inspection rule meanwhile.
- **iPhone 7 "loop disease"**, liquid-damage and PMIC/NAND as *distinct
  symptom profiles*: not verified as separate signatures.
- **Tristar/U2 as an itemised price line**: AU shops only publish generic
  board-level categories.
- Refuted, do not encode: "kernel panics are nearly always hardware"
  (0-3); "only power button or charge port can trigger boot" (0-3);
  Fone Fix's flat $80 port price (1-2).

## Sources

iFixit: Kernel Panics wiki, SMC Panic Assertion wiki, Hardware Isolation
guide 154139, solved threads 651841/800699/775826/743040/711179 ·
repair.wiki panic-log guide · Rossmann Group boot-loop service page ·
iPad Rehab article 49 · VCC Board Repairs panic list · REWA restart-log
analysis · Apple Support 108971 · AU pricing: Airtasker (June 2026),
Seki Gadgets, MSIA/datarecovered.com.au, Sydney Microsoldering.
