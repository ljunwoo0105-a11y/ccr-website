import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {CCRTile, RegMark, Star, Ticker, useRise, useStamp} from './chrome';
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

/* ---------- Compact vertical chrome ---------- */

const VDocStrip: React.FC = () => (
  <div
    style={{
      height: 54,
      background: C.carbon950,
      color: 'rgba(244,241,232,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 40px',
      flexShrink: 0,
    }}
  >
    <span style={{...mnlDim, fontSize: 14}}>FIELD SERVICE MANUAL · QLD 4300</span>
    <span style={{...mnlDim, ...mnlNum, fontSize: 14, color: C.signal400}}>0452 385 321</span>
  </div>
);

const VSheetHeader: React.FC<{no: string; title: string}> = ({no, title}) => {
  const frame = useCurrentFrame();
  const draw = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div style={{padding: '0 40px', flexShrink: 0}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0', position: 'relative'}}>
        <RegMark size={16} />
        <span style={{...mnlDimLg, ...mnlNum, fontSize: 16, color: C.signal600}}>SHEET {no}</span>
        <span style={{...mnlDim, fontSize: 14, color: C.carbon500}}>{title}</span>
        <span style={{...mnlDim, ...mnlNum, fontSize: 14, color: C.carbon500, marginLeft: 'auto'}}>{no} / 05</span>
        <div
          style={{position: 'absolute', left: 0, bottom: 0, height: 2, width: `${draw * 100}%`, background: C.carbon950}}
        />
      </div>
    </div>
  );
};

const VSheetFooter: React.FC<{note: string}> = ({note}) => (
  <div style={{padding: '0 40px', marginTop: 'auto', flexShrink: 0}}>
    <div
      style={{
        borderTop: `1.5px solid ${C.carbon150}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
        padding: '13px 0 20px',
      }}
    >
      <span style={{...mnlDim, fontSize: 12.5, color: C.carbon500}}>{note}</span>
      <span style={{...mnlDim, ...mnlNum, fontSize: 12.5, color: C.carbon500, whiteSpace: 'nowrap'}}>
        CCR·K1 / REV 2026.07
      </span>
    </div>
  </div>
);

const VShell: React.FC<{children: React.ReactNode; sheetNo: string; sheetTitle: string; footNote: string}> = ({
  children,
  sheetNo,
  sheetTitle,
  footNote,
}) => (
  <AbsoluteFill style={{...paperBg, display: 'flex', flexDirection: 'column'}}>
    <VDocStrip />
    <VSheetHeader no={sheetNo} title={sheetTitle} />
    {children}
    <VSheetFooter note={footNote} />
  </AbsoluteFill>
);

const VChip: React.FC<{label: string; startFrame: number; signal?: boolean}> = ({label, startFrame, signal}) => {
  const stamp = useStamp(startFrame, {rotate: -3});
  return (
    <div
      style={{
        ...stamp,
        border: `1.5px solid ${C.carbon950}`,
        background: signal ? C.signal500 : C.bone50,
        color: C.carbon950,
        boxShadow: hard,
        padding: '24px 20px',
        fontFamily: FONT_MONO,
        fontSize: 28,
        fontWeight: 600,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        textAlign: 'center',
      }}
    >
      {label}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* SHEET 00 — Cover                                                    */
/* ------------------------------------------------------------------ */
export const VSceneCover: React.FC = () => {
  const logo = useStamp(6, {rotate: -5});
  const lockup = useRise(14);
  const line1 = useRise(22);
  const line2 = useRise(27);
  const line3 = useRise(32);
  const badge = useRise(44);

  return (
    <VShell sheetNo="00" sheetTitle="TEARDOWN BAY" footNote="DRAWN BY: CCR SERVICE DESK · QC">
      <div
        style={{
          flex: 1,
          padding: '20px 48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-evenly',
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 36}}>
          <div style={logo}>
            <CCRTile size={158} />
          </div>
          <div style={lockup}>
            <div style={{...mnlDimLg, fontSize: 29, color: C.carbon950}}>COOL CASE REPAIR</div>
            <div style={{...mnlDim, fontSize: 18, color: C.carbon500, marginTop: 10}}>
              TECH TEARDOWN &amp; REPAIR CO.
            </div>
          </div>
        </div>

        <div style={{...mnlDisplay, fontSize: 130, color: C.carbon950}}>
          <div style={line1}>EVERY FIX</div>
          <div style={line2}>STARTS WITH</div>
          <div style={line3}>
            A <span style={{color: C.signal500}}>TEARDOWN.</span>
          </div>
        </div>

        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 26}}>
          <VChip label="CRACKED?" startFrame={50} />
          <VChip label="FLAT?" startFrame={58} />
          <VChip label="DROWNED?" startFrame={66} />
          <VChip label="BRING IT IN." startFrame={80} signal />
        </div>

        <div style={{...badge, ...mnlDim, fontSize: 18, lineHeight: 1.9, color: C.carbon500}}>
          WALK-IN REPAIR LAB
          <br />
          ORION SPRINGFIELD CENTRAL · OPEN 7 DAYS
        </div>
      </div>
    </VShell>
  );
};

/* ------------------------------------------------------------------ */
/* SHEET 01 — Work orders                                              */
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

export const VSceneServices: React.FC = () => {
  const title = useRise(4);
  return (
    <AbsoluteFill style={{...paperBg, display: 'flex', flexDirection: 'column'}}>
      <VDocStrip />
      <VSheetHeader no="01" title="WORK ORDERS" />
      <div style={{flex: 1, padding: '38px 48px 0', display: 'flex', flexDirection: 'column'}}>
        <div style={title}>
          <div style={{...mnlDisplay, fontSize: 88, color: C.carbon950}}>WORK ORDERS.</div>
          <div style={{...mnlDim, fontSize: 16, color: C.carbon500, marginTop: 16}}>
            SIX STANDING ORDERS · NO BOOKING NEEDED
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 26,
            marginTop: 38,
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
                  padding: '28px 30px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <span style={{...mnlDim, ...mnlNum, fontSize: 16, color: C.signal600}}>{s.no}</span>
                  <div style={{height: 12, width: 58, ...hatch('rgba(242,76,0,0.5)', 6)}} />
                </div>
                <div style={{...mnlTitle, fontSize: 34, color: C.carbon950, marginTop: 16}}>{s.name}</div>
                <div style={{fontFamily: FONT_SANS, fontSize: 20, lineHeight: 1.42, color: C.carbon700, marginTop: 14}}>
                  {s.desc}
                </div>
                <div style={{...mnlDim, fontSize: 14, color: C.carbon950, marginTop: 'auto', paddingTop: 14}}>
                  OPEN WORK ORDER <span style={{color: C.signal600}}>→</span>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{...mnlDim, fontSize: 14, color: C.carbon500, margin: '24px 0 16px'}}>
          ALL WORK ORDERS INCLUDE FREE DIAGNOSIS &amp; QUOTE
        </div>
      </div>
      <Ticker items={TICKER_ITEMS} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* SHEET 02 — The procedure (vertical timeline)                        */
/* ------------------------------------------------------------------ */
const STEPS = [
  {n: '01', title: 'CHECK-IN', tag: 'T+0 MIN', body: 'Walk up to Kiosk K1 — no appointment. A firm price before we touch a screw.'},
  {n: '02', title: 'TEARDOWN & DIAGNOSE', tag: 'T+10 MIN', body: 'Fault confirmed on the bench. The quote is locked in.'},
  {n: '03', title: 'REPAIR', tag: 'SAME DAY*', body: 'Fitted in the part tier you chose — genuine, OEM or aftermarket — while you do a lap of the centre.'},
  {n: '04', title: 'QC & HANDBACK', tag: 'SIGNED OFF', body: 'Touch, cameras, mics, sensors, seal — tested against the QC checklist. Warranty starts today.'},
];

export const VSceneProcedure: React.FC = () => {
  const frame = useCurrentFrame();
  const title = useRise(4);
  const kicker = useRise(10);
  const lineDraw = interpolate(frame, [16, 58], [0, 92], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <VShell sheetNo="02" sheetTitle="SERVICE PROCEDURE" footNote="*BOARD WORK QUOTED WITH A TIME FRAME">
      <div style={{flex: 1, padding: '44px 48px 0', display: 'flex', flexDirection: 'column'}}>
        <div style={{...kicker, ...mnlDim, fontSize: 17, color: C.signal600}}>
          FOUR STEPS · ONE VISIT · WARRANTY STAMPED
        </div>
        <div style={{...title, ...mnlDisplay, fontSize: 100, color: C.carbon950, marginTop: 16}}>
          THE
          <br />
          PROCEDURE.
        </div>

        <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: 30}}>
          <div style={{position: 'relative'}}>
            <div
              style={{
                position: 'absolute',
                left: 45,
                top: 12,
                height: `${lineDraw}%`,
                borderLeft: `2px dashed ${C.carbon200}`,
              }}
            />
            <div style={{display: 'flex', flexDirection: 'column', gap: 72}}>
              {STEPS.map((s, i) => {
                const stamp = useStamp(20 + i * 11, {rotate: -3});
                const body = useRise(26 + i * 11);
                return (
                  <div key={s.n} style={{display: 'flex', gap: 36, position: 'relative'}}>
                    <div
                      style={{
                        ...stamp,
                        width: 92,
                        height: 92,
                        background: C.signal500,
                        border: `1.5px solid ${C.carbon950}`,
                        boxShadow: hard,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: FONT_DISPLAY,
                        fontSize: 38,
                        color: C.carbon950,
                        flexShrink: 0,
                      }}
                    >
                      {s.n}
                    </div>
                    <div style={{...body, flex: 1, paddingTop: 4}}>
                      <div style={{display: 'flex', alignItems: 'baseline', gap: 20, flexWrap: 'wrap'}}>
                        <span style={{...mnlTitle, fontSize: 38, color: C.carbon950}}>{s.title}</span>
                        <span style={{...mnlDim, ...mnlNum, fontSize: 18, color: C.signal600}}>{s.tag}</span>
                      </div>
                      <div style={{fontFamily: FONT_SANS, fontSize: 23, lineHeight: 1.45, color: C.carbon700, marginTop: 10}}>
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
    </VShell>
  );
};

/* ------------------------------------------------------------------ */
/* SHEET 03 — Down to the board (stacked)                              */
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
  {label: 'WATER DAMAGE TRIAGE', value: 'ULTRASONIC CLEAN'},
  {label: 'DATA RECOVERY', value: 'FROM DEAD BOARDS'},
  {label: 'DIAGNOSTIC FEE', value: 'FREE WITH ANY REPAIR'},
];

export const VSceneBoard: React.FC = () => {
  const frame = useCurrentFrame();
  const title = useRise(6);
  const stampIn = useStamp(96, {rotate: -7});
  return (
    <VShell sheetNo="03" sheetTitle="BOARD-LEVEL SERVICE" footNote="HOT AIR · MICROSCOPE · STEADY HANDS">
      <div style={{flex: 1, padding: '40px 48px 0', display: 'flex', flexDirection: 'column'}}>
        <div style={{...title, ...mnlDisplay, fontSize: 100, color: C.carbon950}}>
          DOWN TO
          <br />
          THE <span style={{color: C.signal500}}>BOARD.</span>
        </div>

        <div style={{display: 'flex', justifyContent: 'center', margin: '26px 0'}}>
          <svg viewBox="0 0 520 500" width={730} height={702} style={{display: 'block'}}>
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
            <g opacity={interpolate(frame, [4, 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
              <rect x={180} y={180} width={140} height={140} fill={C.carbon950} />
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

        <div style={{display: 'flex', flexDirection: 'column', gap: 30}}>
          {DIMROWS.map((r, i) => {
            const rise = useRise(30 + i * 9);
            return (
              <div key={r.label} style={{...rise, display: 'flex', alignItems: 'baseline', gap: 16}}>
                <span style={{...mnlDimLg, fontSize: 20, color: C.carbon950, whiteSpace: 'nowrap'}}>{r.label}</span>
                <span style={{flex: 1, borderBottom: `1.5px dashed ${C.carbon200}`, transform: 'translateY(-5px)'}} />
                <span style={{...mnlDim, fontSize: 16, color: C.carbon500, whiteSpace: 'nowrap'}}>{r.value}</span>
              </div>
            );
          })}
        </div>

        <div style={{display: 'flex', justifyContent: 'center'}}>
          <div
            style={{
              ...stampIn,
              display: 'inline-block',
              marginTop: 60,
              border: `5px solid ${C.signal600}`,
              outline: `2.5px solid ${C.signal600}`,
              outlineOffset: 6,
              color: C.signal600,
              padding: '20px 44px',
              fontFamily: FONT_DISPLAY,
              fontSize: 56,
              textTransform: 'uppercase',
            }}
          >
            NO FIX, NO FEE
          </div>
        </div>
      </div>
    </VShell>
  );
};

/* ------------------------------------------------------------------ */
/* SHEET 04 — QC log (stacked)                                         */
/* ------------------------------------------------------------------ */
const REVIEWS = [
  {entry: 'ENTRY 001', text: '“They had everything that I needed.”', author: 'LEE LUMAYAG'},
  {entry: 'ENTRY 002', text: '“Easy and happy service.”', author: 'MATT BREAKSPEAR'},
  {entry: 'ENTRY 003', text: '“Great service.”', author: 'GEORGE JACOB'},
];

export const VSceneReviews: React.FC = () => {
  const frame = useCurrentFrame();
  const title = useRise(4);
  const rating = interpolate(frame, [10, 40], [0, 4.9], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const count = Math.round(
    interpolate(frame, [16, 52], [0, 1866], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
  );
  const badge1 = useStamp(74, {rotate: -3});
  const badge2 = useStamp(82, {rotate: 2.5});
  return (
    <VShell sheetNo="04" sheetTitle="QUALITY CONTROL LOG" footNote="GOOGLE BUSINESS PROFILE — UNEDITED">
      <div style={{flex: 1, padding: '40px 48px 0', display: 'flex', flexDirection: 'column'}}>
        <div style={{...title, ...mnlDisplay, fontSize: 86, color: C.carbon950}}>QC LOG.</div>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 18, marginTop: 4}}>
          <span style={{...mnlDisplay, ...mnlNum, fontSize: 240, color: C.carbon950}}>{rating.toFixed(1)}</span>
          <span style={{...mnlDimLg, fontSize: 30, color: C.carbon500}}>/ 5.0</span>
        </div>
        <div style={{display: 'flex', gap: 16, marginTop: 18}}>
          {[0, 1, 2, 3, 4].map((i) => {
            const stamp = useStamp(34 + i * 6, {rotate: -6});
            return (
              <div key={i} style={stamp}>
                <Star size={72} />
              </div>
            );
          })}
        </div>
        <div style={{...mnlDim, ...mnlNum, fontSize: 19, color: C.carbon700, marginTop: 28}}>
          {count.toLocaleString('en-AU')}+ ENTRIES · VERIFIED GOOGLE REVIEWS
        </div>

        <div style={{display: 'flex', flexDirection: 'column', gap: 28, marginTop: 44}}>
          {REVIEWS.map((r, i) => {
            const stamp = useStamp(24 + i * 12, {rotate: i % 2 === 0 ? -1.5 : 1.5});
            return (
              <div
                key={r.entry}
                style={{
                  ...stamp,
                  border: `1.5px solid ${C.carbon950}`,
                  background: C.bone50,
                  boxShadow: hardLg,
                  padding: '26px 30px',
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
                <div style={{fontFamily: FONT_SANS, fontSize: 30, color: C.carbon950, marginTop: 14, lineHeight: 1.3}}>
                  {r.text}
                </div>
                <div style={{...mnlDim, fontSize: 15, color: C.carbon500, marginTop: 12}}>
                  — {r.author} · ★★★★★
                </div>
              </div>
            );
          })}
        </div>

        <div style={{display: 'flex', gap: 22, marginTop: 48, flexWrap: 'wrap'}}>
          <div
            style={{
              ...badge1,
              background: C.carbon950,
              color: C.bone100,
              boxShadow: hardSignal,
              padding: '17px 26px',
              ...mnlDim,
              fontSize: 18,
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
              padding: '17px 26px',
              ...mnlDim,
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            PRICE BEAT GUARANTEE
          </div>
        </div>
      </div>
    </VShell>
  );
};

/* ------------------------------------------------------------------ */
/* SHEET 05 — The depot (ink CTA, stacked)                             */
/* ------------------------------------------------------------------ */
export const VSceneCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const kicker = useRise(8);
  const line1 = useRise(14);
  const line2 = useRise(20);
  const plate = useStamp(40, {rotate: -1.5});
  const btn = useStamp(58, {rotate: 2});
  const drift = interpolate(frame, [0, 300], [0, -70]);
  const drift2 = interpolate(frame, [0, 300], [-120, 0]);
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
      <div
        style={{
          position: 'absolute',
          top: 70,
          left: 0,
          fontFamily: FONT_DISPLAY,
          fontSize: 185,
          textTransform: 'uppercase',
          lineHeight: 0.95,
          color: 'transparent',
          WebkitTextStroke: `2px rgba(242,76,0,0.4)`,
          whiteSpace: 'nowrap',
          transform: `translateX(${drift}px)`,
        }}
      >
        COOL CASE REPAIR
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 120,
          left: 0,
          fontFamily: FONT_DISPLAY,
          fontSize: 185,
          textTransform: 'uppercase',
          lineHeight: 0.95,
          color: 'transparent',
          WebkitTextStroke: `2px rgba(242,76,0,0.28)`,
          whiteSpace: 'nowrap',
          transform: `translateX(${drift2}px)`,
        }}
      >
        BRING IT IN BROKEN
      </div>

      <div
        style={{
          height: 54,
          borderBottom: '1.5px solid rgba(244,241,232,0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 40px',
          position: 'relative',
        }}
      >
        <span style={{...mnlDim, fontSize: 14, color: 'rgba(244,241,232,0.7)'}}>SHEET 05 · THE DEPOT</span>
        <span style={{...mnlDim, ...mnlNum, fontSize: 14, color: C.signal400}}>05 / 05</span>
      </div>

      <div style={{flex: 1, padding: '250px 48px 0', position: 'relative', display: 'flex', flexDirection: 'column'}}>
        <div style={{...kicker, display: 'flex', alignItems: 'center', gap: 18}}>
          <RegMark color={C.signal400} size={17} />
          <span style={{...mnlDim, fontSize: 19, color: C.signal400}}>FINAL INSTRUCTION</span>
        </div>
        <div style={{...mnlDisplay, fontSize: 158, color: C.bone100, marginTop: 30}}>
          <div style={line1}>BRING IT</div>
          <div style={line1}>IN</div>
          <div style={line2}>
            <span style={{color: C.signal500}}>BROKEN.</span>
          </div>
        </div>

        <div
          style={{
            ...plate,
            background: C.bone50,
            border: `1.5px solid ${C.carbon950}`,
            boxShadow: `7px 7px 0 0 ${C.signal500}`,
            padding: '36px 40px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            marginTop: 90,
          }}
        >
          <div style={{...mnlDimLg, ...mnlNum, fontSize: 23, color: C.carbon950}}>
            KIOSK K1 · ORION SPRINGFIELD CENTRAL
          </div>
          <div style={{...mnlDim, ...mnlNum, fontSize: 17, lineHeight: 1.7, color: C.carbon700}}>
            1 MAIN ST, SPRINGFIELD CENTRAL QLD 4300
            <br />
            NEAR FOOT LOCKER · OPEN 7 DAYS · THU TILL 9PM
          </div>
          <div style={{...mnlDimLg, ...mnlNum, fontSize: 21, lineHeight: 1.65, color: C.signal600, marginTop: 6}}>
            CALL OR TEXT 0452 385 321
            <br />
            WWW.CCRSPRINGFIELD.COM
          </div>
        </div>

        <div
          style={{
            ...btn,
            alignSelf: 'flex-start',
            background: C.signal500,
            color: C.carbon950,
            border: `1.5px solid ${C.carbon950}`,
            boxShadow: `5px 5px 0 0 ${C.bone100}`,
            padding: '26px 42px',
            fontFamily: FONT_MONO,
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            marginTop: 56,
          }}
        >
          GET A FREE QUOTE →
        </div>
      </div>

      <div style={{padding: '0 40px', marginTop: 'auto', position: 'relative'}}>
        <div
          style={{
            borderTop: '1.5px solid rgba(244,241,232,0.18)',
            display: 'flex',
            justifyContent: 'space-between',
            padding: '13px 0 20px',
          }}
        >
          <span style={{...mnlDim, fontSize: 13, color: 'rgba(244,241,232,0.55)'}}>END OF MANUAL — REV 2026.07</span>
          <span style={{...mnlDim, ...mnlNum, fontSize: 13, color: 'rgba(244,241,232,0.55)'}}>DOC CCR-4300</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
