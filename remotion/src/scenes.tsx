import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {
  CCRTile,
  DocStrip,
  RegMark,
  SheetFooter,
  SheetHeader,
  Star,
  Ticker,
  useRise,
  useStamp,
} from './chrome';
import {
  C,
  FONT_DISPLAY,
  FONT_MONO,
  FONT_SANS,
  hard,
  hardLg,
  hardSm,
  hardSignal,
  hatch,
  mnlDim,
  mnlDimLg,
  mnlDisplay,
  mnlNum,
  mnlTitle,
  paperBg,
} from './theme';

const Shell: React.FC<{children: React.ReactNode; sheetNo: string; sheetTitle: string; footNote: string}> = ({
  children,
  sheetNo,
  sheetTitle,
  footNote,
}) => (
  <AbsoluteFill style={{...paperBg, display: 'flex', flexDirection: 'column'}}>
    <DocStrip />
    <SheetHeader no={sheetNo} title={sheetTitle} />
    {children}
    <SheetFooter note={footNote} />
  </AbsoluteFill>
);

const Chip: React.FC<{label: string; startFrame: number; signal?: boolean}> = ({label, startFrame, signal}) => {
  const stamp = useStamp(startFrame, {rotate: -3});
  return (
    <div
      style={{
        ...stamp,
        border: `1.5px solid ${C.carbon950}`,
        background: signal ? C.signal500 : C.bone50,
        color: C.carbon950,
        boxShadow: hard,
        padding: '14px 26px',
        fontFamily: FONT_MONO,
        fontSize: 24,
        fontWeight: 600,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* SHEET 00 — Cover / teardown bay                                     */
/* ------------------------------------------------------------------ */
export const SceneCover: React.FC = () => {
  const logo = useStamp(6, {rotate: -5});
  const lockup = useRise(14);
  const line1 = useRise(22);
  const line2 = useRise(27);
  const line3 = useRise(32);
  const badge = useRise(44);

  return (
    <Shell sheetNo="00" sheetTitle="TEARDOWN BAY" footNote="DRAWN BY: CCR SERVICE DESK · CHECKED: QC · SCALE 1:1 · UNITS MM">
      <div style={{flex: 1, padding: '54px 64px 0', display: 'flex', flexDirection: 'column'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 34}}>
          <div style={logo}>
            <CCRTile size={150} />
          </div>
          <div style={lockup}>
            <div style={{...mnlDimLg, fontSize: 30, color: C.carbon950}}>COOL CASE REPAIR</div>
            <div style={{...mnlDim, fontSize: 19, color: C.carbon500, marginTop: 10}}>
              TECH TEARDOWN &amp; REPAIR CO.
            </div>
          </div>
        </div>

        <div style={{...mnlDisplay, fontSize: 126, color: C.carbon950, marginTop: 56}}>
          <div style={line1}>EVERY FIX</div>
          <div style={line2}>STARTS WITH</div>
          <div style={line3}>
            A <span style={{color: C.signal500}}>TEARDOWN.</span>
          </div>
        </div>

        <div style={{display: 'flex', gap: 24, marginTop: 54}}>
          <Chip label="CRACKED?" startFrame={50} />
          <Chip label="FLAT?" startFrame={58} />
          <Chip label="DROWNED?" startFrame={66} />
          <Chip label="BRING IT IN." startFrame={80} signal />
        </div>

        <div style={{...badge, ...mnlDim, fontSize: 17, color: C.carbon500, marginTop: 44}}>
          WALK-IN REPAIR LAB · ORION SPRINGFIELD CENTRAL · OPEN 7 DAYS
        </div>
      </div>
    </Shell>
  );
};

/* ------------------------------------------------------------------ */
/* SHEET 01 — Work orders (services)                                   */
/* ------------------------------------------------------------------ */
const SERVICES = [
  {no: 'WO-01', name: 'PHONE REPAIR', desc: 'Cracked screens, dead batteries and everything in between — iPhone, Samsung, Pixel, OPPO and more.'},
  {no: 'WO-02', name: 'TABLET & IPAD', desc: 'Glass, LCD, battery and charging repairs for iPad, Galaxy Tab and other tablets.'},
  {no: 'WO-03', name: 'COMPUTER & LAPTOP', desc: 'Screens, batteries, keyboards, upgrades and tune-ups for Windows PCs and Mac.'},
  {no: 'WO-04', name: 'DRONE REPAIR', desc: 'Crash damage, gimbal and camera repairs for DJI and other popular drones.'},
  {no: 'WO-05', name: 'WATCH & CAR KEY', desc: 'Smart watch screens and batteries, plus car key shells, buttons and batteries.'},
  {no: 'WO-06', name: 'IT SOLUTIONS', desc: 'Setup, data transfer, email and network help for homes and small businesses.'},
];

const TICKER_ITEMS = [
  'SCREENS', 'BATTERIES', 'CHARGE PORTS', 'BACK GLASS', 'WATER DAMAGE', 'MICRO-SOLDERING',
  'DATA RECOVERY', 'CAMERAS', 'DRONE GIMBALS', 'WATCH CRYSTALS', 'CAR KEYS', 'SSD UPGRADES',
  'PRICE BEAT GUARANTEE',
];

export const SceneServices: React.FC = () => {
  const title = useRise(4);
  return (
    <AbsoluteFill style={{...paperBg, display: 'flex', flexDirection: 'column'}}>
      <DocStrip />
      <SheetHeader no="01" title="WORK ORDERS" />
      <div style={{flex: 1, padding: '30px 64px 24px', display: 'flex', flexDirection: 'column'}}>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 30, ...title}}>
          <div style={{...mnlDisplay, fontSize: 84, color: C.carbon950}}>WORK ORDERS.</div>
          <div style={{...mnlDim, fontSize: 16, color: C.carbon500}}>SIX STANDING ORDERS · NO BOOKING NEEDED</div>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 26,
            marginTop: 34,
            flex: 1,
          }}
        >
          {SERVICES.map((s, i) => {
            const stamp = useStamp(14 + i * 7, {rotate: i % 2 === 0 ? -2.5 : 2.5});
            return (
              <div
                key={s.no}
                style={{
                  ...stamp,
                  border: `1.5px solid ${C.carbon950}`,
                  background: C.bone50,
                  boxShadow: hardLg,
                  padding: '26px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <span style={{...mnlDim, ...mnlNum, fontSize: 16, color: C.signal600}}>{s.no}</span>
                  <div style={{height: 12, width: 64, ...hatch('rgba(242,76,0,0.5)', 6)}} />
                </div>
                <div style={{...mnlTitle, fontSize: 34, color: C.carbon950, marginTop: 14}}>{s.name}</div>
                <div style={{fontFamily: FONT_SANS, fontSize: 18.5, lineHeight: 1.35, color: C.carbon700, marginTop: 12}}>
                  {s.desc}
                </div>
                <div style={{...mnlDim, fontSize: 14, color: C.carbon950, marginTop: 'auto', paddingTop: 12}}>
                  OPEN WORK ORDER <span style={{color: C.signal600}}>→</span>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{...mnlDim, fontSize: 15, color: C.carbon500, margin: '22px 0 14px'}}>
          ALL WORK ORDERS INCLUDE FREE DIAGNOSIS &amp; QUOTE
        </div>
      </div>
      <Ticker items={TICKER_ITEMS} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* SHEET 02 — The procedure                                            */
/* ------------------------------------------------------------------ */
const STEPS = [
  {n: '01', title: 'CHECK-IN', tag: 'T+0 MIN', body: 'Walk up to Kiosk K1 — no appointment. A firm price before we touch a screw.'},
  {n: '02', title: 'TEARDOWN & DIAGNOSE', tag: 'T+10 MIN', body: 'Fault confirmed on the bench. The quote is locked in.'},
  {n: '03', title: 'REPAIR', tag: 'SAME DAY*', body: 'Fitted in the part tier you chose — genuine, OEM or aftermarket — while you do a lap of the centre.'},
  {n: '04', title: 'QC & HANDBACK', tag: 'SIGNED OFF', body: 'Touch, cameras, mics, sensors, seal — tested against the QC checklist. Warranty starts today.'},
];

export const SceneProcedure: React.FC = () => {
  const frame = useCurrentFrame();
  const title = useRise(4);
  const kicker = useRise(10);
  const lineDraw = interpolate(frame, [16, 58], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <Shell sheetNo="02" sheetTitle="SERVICE PROCEDURE" footNote="*COMPLEX BOARD WORK & PART ORDERS QUOTED WITH A TIME FRAME AT CHECK-IN">
      <div style={{flex: 1, padding: '44px 64px 0', display: 'flex', flexDirection: 'column'}}>
        <div style={{...kicker, ...mnlDim, fontSize: 17, color: C.signal600}}>
          FOUR STEPS · ONE VISIT · WARRANTY STAMPED AT HANDBACK
        </div>
        <div style={{...title, ...mnlDisplay, fontSize: 92, color: C.carbon950, marginTop: 16}}>THE PROCEDURE.</div>

        <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: 70}}>
        <div style={{position: 'relative'}}>
          <div
            style={{
              position: 'absolute',
              top: 34,
              left: 0,
              width: `${lineDraw}%`,
              borderTop: `2px dashed ${C.carbon200}`,
            }}
          />
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 34}}>
            {STEPS.map((s, i) => {
              const stamp = useStamp(20 + i * 11, {rotate: -3});
              const body = useRise(26 + i * 11);
              return (
                <div key={s.n} style={{position: 'relative'}}>
                  <div
                    style={{
                      ...stamp,
                      width: 68,
                      height: 68,
                      background: C.signal500,
                      border: `1.5px solid ${C.carbon950}`,
                      boxShadow: hard,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: FONT_DISPLAY,
                      fontSize: 28,
                      color: C.carbon950,
                    }}
                  >
                    {s.n}
                  </div>
                  <div style={body}>
                    <div style={{...mnlTitle, fontSize: 27, color: C.carbon950, marginTop: 22, minHeight: 62}}>
                      {s.title}
                    </div>
                    <div style={{...mnlDim, ...mnlNum, fontSize: 16, color: C.signal600, marginTop: 8}}>{s.tag}</div>
                    <div style={{fontFamily: FONT_SANS, fontSize: 18.5, lineHeight: 1.4, color: C.carbon700, marginTop: 12}}>
                      {s.body}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </div>
      </div>
    </Shell>
  );
};

/* ------------------------------------------------------------------ */
/* SHEET 03 — Down to the board (micro-soldering)                      */
/* ------------------------------------------------------------------ */
const TRACES: string[] = [
  'M 250 180 L 250 120 L 120 120 L 120 60',
  'M 290 180 L 290 90 L 400 90 L 400 50',
  'M 320 220 L 420 220 L 420 150',
  'M 320 280 L 460 280',
  'M 290 320 L 290 400 L 380 400 L 380 450',
  'M 250 320 L 250 430 L 140 430',
  'M 180 300 L 90 300 L 90 380',
  'M 180 240 L 60 240 L 60 160',
];
const PAD_POS: Array<[number, number]> = [
  [120, 60], [400, 50], [420, 150], [460, 280], [380, 450], [140, 430], [90, 380], [60, 160],
];

const DIMROWS = [
  {label: 'IC & CONNECTOR REWORK', value: 'CHARGING · AUDIO · TOUCH'},
  {label: 'WATER DAMAGE TRIAGE', value: 'ULTRASONIC CLEAN + INSPECT'},
  {label: 'DATA RECOVERY', value: 'FROM DEAD BOARDS'},
  {label: 'DIAGNOSTIC FEE', value: 'FREE WITH ANY REPAIR'},
];

export const SceneBoard: React.FC = () => {
  const frame = useCurrentFrame();
  const title = useRise(6);
  const stampIn = useStamp(96, {rotate: -8});
  return (
    <Shell sheetNo="03" sheetTitle="BOARD-LEVEL SERVICE" footNote="HOT AIR · MICROSCOPE · A STEADY HAND ON NETS A FRACTION OF A MILLIMETRE WIDE">
      <div style={{flex: 1, padding: '10px 64px 0', display: 'flex', gap: 70, alignItems: 'center'}}>
        <div style={{width: 660, position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center'}}>
          <svg viewBox="0 0 520 500" width={660} height={634} style={{display: 'block'}}>
            {TRACES.map((d, i) => {
              const p = interpolate(frame, [8 + i * 5, 30 + i * 5], [1, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              return (
                <path
                  key={i}
                  d={d}
                  fill="none"
                  stroke={C.copper500}
                  strokeWidth={3}
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={p}
                />
              );
            })}
            {PAD_POS.map(([x, y], i) => {
              const o = interpolate(frame, [30 + i * 5, 36 + i * 5], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              return (
                <rect key={i} x={x - 8} y={y - 8} width={16} height={16} fill={C.copper300} stroke={C.carbon950} strokeWidth={1.5} opacity={o} />
              );
            })}
            {/* IC package */}
            <g opacity={interpolate(frame, [4, 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
              <rect x={180} y={180} width={140} height={140} fill={C.carbon950} />
              <rect x={180} y={180} width={140} height={140} fill="none" stroke={C.carbon950} strokeWidth={2} transform="translate(5 5)" opacity={0.35} />
              <text x={250} y={242} textAnchor="middle" fill={C.bone100} fontFamily={FONT_MONO} fontSize={19} fontWeight={600} letterSpacing={2}>
                CCR-4300
              </text>
              <text x={250} y={272} textAnchor="middle" fill={C.signal400} fontFamily={FONT_MONO} fontSize={14} letterSpacing={3}>
                U1 · REV 07
              </text>
              <circle cx={196} cy={196} r={4} fill={C.signal500} />
            </g>
          </svg>
        </div>

        <div style={{flex: 1}}>
          <div style={{...title, ...mnlDisplay, fontSize: 84, color: C.carbon950}}>
            DOWN TO
            <br />
            THE <span style={{color: C.signal500}}>BOARD.</span>
          </div>
          <div style={{marginTop: 44, display: 'flex', flexDirection: 'column', gap: 26}}>
            {DIMROWS.map((r, i) => {
              const rise = useRise(30 + i * 9);
              return (
                <div key={r.label} style={{...rise, display: 'flex', alignItems: 'baseline', gap: 18}}>
                  <span style={{...mnlDimLg, fontSize: 20, color: C.carbon950, whiteSpace: 'nowrap'}}>{r.label}</span>
                  <span style={{flex: 1, borderBottom: `1.5px dashed ${C.carbon200}`, transform: 'translateY(-5px)'}} />
                  <span style={{...mnlDim, fontSize: 17, color: C.carbon500, whiteSpace: 'nowrap'}}>{r.value}</span>
                </div>
              );
            })}
          </div>
          <div
            style={{
              ...stampIn,
              display: 'inline-block',
              marginTop: 56,
              border: `4px solid ${C.signal600}`,
              outline: `2px solid ${C.signal600}`,
              outlineOffset: 5,
              color: C.signal600,
              padding: '16px 34px',
              fontFamily: FONT_DISPLAY,
              fontSize: 46,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
            }}
          >
            NO FIX, NO FEE
          </div>
        </div>
      </div>
    </Shell>
  );
};

/* ------------------------------------------------------------------ */
/* SHEET 04 — QC log (reviews)                                         */
/* ------------------------------------------------------------------ */
const REVIEWS = [
  {entry: 'ENTRY 001', text: '“They had everything that I needed.”', author: 'LEE LUMAYAG'},
  {entry: 'ENTRY 002', text: '“Easy and happy service.”', author: 'MATT BREAKSPEAR'},
  {entry: 'ENTRY 003', text: '“Great service.”', author: 'GEORGE JACOB'},
];

export const SceneReviews: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const title = useRise(4);
  const rating = interpolate(frame, [10, 40], [0, 4.9], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const count = Math.round(
    interpolate(frame, [16, 52], [0, 1866], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
  );
  const badge1 = useStamp(70, {rotate: -3});
  const badge2 = useStamp(78, {rotate: 2.5});
  return (
    <Shell sheetNo="04" sheetTitle="QUALITY CONTROL LOG" footNote="FEED · GOOGLE BUSINESS PROFILE — UNEDITED CUSTOMER ENTRIES">
      <div style={{flex: 1, padding: '10px 64px 0', display: 'flex', gap: 80, alignItems: 'center'}}>
        <div style={{width: 640, flexShrink: 0}}>
          <div style={{...title, ...mnlDisplay, fontSize: 76, color: C.carbon950}}>QC LOG.</div>
          <div style={{display: 'flex', alignItems: 'baseline', gap: 20, marginTop: 26}}>
            <span style={{...mnlDisplay, ...mnlNum, fontSize: 230, color: C.carbon950}}>{rating.toFixed(1)}</span>
            <span style={{...mnlDimLg, fontSize: 30, color: C.carbon500}}>/ 5.0</span>
          </div>
          <div style={{display: 'flex', gap: 14, marginTop: 20}}>
            {[0, 1, 2, 3, 4].map((i) => {
              const stamp = useStamp(34 + i * 6, {rotate: -6});
              return (
                <div key={i} style={stamp}>
                  <Star size={62} />
                </div>
              );
            })}
          </div>
          <div style={{...mnlDim, ...mnlNum, fontSize: 19, color: C.carbon700, marginTop: 26}}>
            {count.toLocaleString('en-AU')}+ ENTRIES · VERIFIED GOOGLE REVIEWS
          </div>
          <div style={{display: 'flex', gap: 22, marginTop: 44}}>
            <div
              style={{
                ...badge1,
                background: C.carbon950,
                color: C.bone100,
                boxShadow: hardSignal,
                padding: '15px 24px',
                ...mnlDim,
                fontSize: 17,
              }}
            >
              WARRANTY ≤ 12 MO
            </div>
            <div
              style={{
                ...badge2,
                background: C.signal500,
                color: C.carbon950,
                border: `1.5px solid ${C.carbon950}`,
                boxShadow: hard,
                padding: '15px 24px',
                ...mnlDim,
                fontSize: 17,
                fontWeight: 600,
              }}
            >
              PRICE BEAT GUARANTEE
            </div>
          </div>
        </div>

        <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 24, justifyContent: 'center'}}>
          {REVIEWS.map((r, i) => {
            const stamp = useStamp(24 + i * 12, {rotate: i % 2 === 0 ? -2 : 2});
            return (
              <div
                key={r.entry}
                style={{
                  ...stamp,
                  border: `1.5px solid ${C.carbon950}`,
                  background: C.bone50,
                  boxShadow: hardLg,
                  padding: '24px 30px',
                }}
              >
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <span style={{...mnlDim, ...mnlNum, fontSize: 15, color: C.signal600}}>{r.entry}</span>
                  <span
                    style={{
                      ...mnlDim,
                      fontSize: 14,
                      color: C.bone100,
                      background: C.carbon950,
                      padding: '6px 14px',
                      boxShadow: hardSm,
                    }}
                  >
                    PASS ✓
                  </span>
                </div>
                <div style={{fontFamily: FONT_SANS, fontSize: 27, color: C.carbon950, marginTop: 14, lineHeight: 1.25}}>
                  {r.text}
                </div>
                <div style={{...mnlDim, fontSize: 15, color: C.carbon500, marginTop: 12}}>
                  — {r.author} · ★★★★★
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
};

/* ------------------------------------------------------------------ */
/* SHEET 05 — The depot (CTA, ink stamp page)                          */
/* ------------------------------------------------------------------ */
export const SceneCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const kicker = useRise(8);
  const line1 = useRise(14);
  const line2 = useRise(20);
  const plate = useStamp(40, {rotate: -2});
  const btn = useStamp(58, {rotate: 3});
  const drift = interpolate(frame, [0, 300], [0, -80]);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.carbon950,
        backgroundImage: `radial-gradient(rgba(244,241,232,0.05) 1.5px, transparent 1.5px)`,
        backgroundSize: '26px 26px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Giant outline wordmark backdrop */}
      <div
        style={{
          position: 'absolute',
          top: 30,
          left: 0,
          whiteSpace: 'nowrap',
          fontFamily: FONT_DISPLAY,
          fontSize: 250,
          textTransform: 'uppercase',
          lineHeight: 0.95,
          color: 'transparent',
          WebkitTextStroke: `2.5px rgba(242,76,0,0.4)`,
          transform: `translateX(${drift}px)`,
        }}
      >
        COOL CASE REPAIR
      </div>

      <div
        style={{
          height: 52,
          borderBottom: '1.5px solid rgba(244,241,232,0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 64px',
          position: 'relative',
        }}
      >
        <span style={{...mnlDim, fontSize: 14, color: 'rgba(244,241,232,0.7)'}}>
          SHEET 05 · THE DEPOT — FINAL PAGE
        </span>
        <span style={{...mnlDim, ...mnlNum, fontSize: 14, color: C.signal400}}>05 / 05</span>
      </div>

      <div style={{flex: 1, padding: '90px 64px 0', position: 'relative', display: 'flex', flexDirection: 'column'}}>
        <div style={{...kicker, display: 'flex', alignItems: 'center', gap: 18}}>
          <RegMark color={C.signal400} />
          <span style={{...mnlDim, fontSize: 19, color: C.signal400}}>FINAL INSTRUCTION</span>
        </div>
        <div style={{...mnlDisplay, fontSize: 158, color: C.bone100, marginTop: 26}}>
          <div style={line1}>BRING IT IN</div>
          <div style={{...line2}}>
            <span style={{color: C.signal500}}>BROKEN.</span>
          </div>
        </div>

        <div style={{display: 'flex', alignItems: 'flex-end', gap: 44, marginTop: 64}}>
          <div
            style={{
              ...plate,
              background: C.bone50,
              border: `1.5px solid ${C.carbon950}`,
              boxShadow: `6px 6px 0 0 ${C.signal500}`,
              padding: '30px 38px',
              display: 'flex',
              flexDirection: 'column',
              gap: 13,
            }}
          >
            <div style={{...mnlDimLg, ...mnlNum, fontSize: 21, color: C.carbon950}}>
              KIOSK K1 · ORION SPRINGFIELD CENTRAL
            </div>
            <div style={{...mnlDim, ...mnlNum, fontSize: 17, color: C.carbon700}}>
              1 MAIN ST, SPRINGFIELD CENTRAL QLD 4300 · NEAR FOOT LOCKER
            </div>
            <div style={{...mnlDim, ...mnlNum, fontSize: 17, color: C.carbon700}}>
              OPEN 7 DAYS · THURSDAY TILL 9PM
            </div>
            <div style={{...mnlDimLg, ...mnlNum, fontSize: 21, color: C.signal600, marginTop: 6}}>
              CALL OR TEXT 0452 385 321 · WWW.CCRSPRINGFIELD.COM
            </div>
          </div>
          <div
            style={{
              ...btn,
              background: C.signal500,
              color: C.carbon950,
              border: `1.5px solid ${C.carbon950}`,
              boxShadow: `4px 4px 0 0 ${C.bone100}`,
              padding: '24px 40px',
              fontFamily: FONT_MONO,
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            GET A FREE QUOTE →
          </div>
        </div>
      </div>

      <div style={{padding: '0 64px', marginTop: 'auto'}}>
        <div
          style={{
            borderTop: '1.5px solid rgba(244,241,232,0.18)',
            display: 'flex',
            justifyContent: 'space-between',
            padding: '14px 0 22px',
          }}
        >
          <span style={{...mnlDim, fontSize: 14, color: 'rgba(244,241,232,0.55)'}}>
            END OF MANUAL — REV 2026.07 · KEEP FOR YOUR RECORDS
          </span>
          <span style={{...mnlDim, ...mnlNum, fontSize: 14, color: 'rgba(244,241,232,0.55)'}}>DOC CCR-4300</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
