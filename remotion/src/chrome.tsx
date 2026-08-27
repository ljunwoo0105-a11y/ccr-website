import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT_DISPLAY, FONT_MONO, hardSignal, hatch, mnlDim, mnlDimLg, mnlNum} from './theme';

/** Registration crosshair — pure CSS, like .mnl-reg on the site */
export const RegMark: React.FC<{size?: number; color?: string}> = ({size = 18, color = C.carbon950}) => (
  <div style={{position: 'relative', width: size, height: size}}>
    <div style={{position: 'absolute', left: '50%', top: 0, width: 1.5, height: '100%', background: color}} />
    <div style={{position: 'absolute', top: '50%', left: 0, height: 1.5, width: '100%', background: color}} />
  </div>
);

/** Spring-driven stamp-in: scale overshoot + settle, like a rubber stamp hitting paper */
export const useStamp = (startFrame: number, opts?: {rotate?: number}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({
    frame: frame - startFrame,
    fps,
    config: {damping: 14, stiffness: 220, mass: 0.6},
  });
  const visible = frame >= startFrame;
  const scale = interpolate(s, [0, 1], [1.45, 1]);
  const rotate = interpolate(s, [0, 1], [opts?.rotate ?? -4, 0]);
  return {
    opacity: visible ? Math.min(1, s * 3) : 0,
    transform: `scale(${visible ? scale : 1.45}) rotate(${visible ? rotate : opts?.rotate ?? -4}deg)`,
  };
};

/** Slide-up + fade entrance */
export const useRise = (startFrame: number, distance = 26) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({
    frame: frame - startFrame,
    fps,
    config: {damping: 22, stiffness: 160, mass: 0.7},
  });
  const visible = frame >= startFrame;
  return {
    opacity: visible ? s : 0,
    transform: `translateY(${visible ? interpolate(s, [0, 1], [distance, 0]) : distance}px)`,
  };
};

/** Top ink doc strip: FIELD SERVICE MANUAL · ... | phone */
export const DocStrip: React.FC = () => (
  <div
    style={{
      height: 52,
      background: C.carbon950,
      color: 'rgba(244,241,232,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 64px',
      flexShrink: 0,
    }}
  >
    <span style={{...mnlDim, fontSize: 14}}>FIELD SERVICE MANUAL · SPRINGFIELD CENTRAL QLD 4300</span>
    <span style={{...mnlDim, ...mnlNum, fontSize: 14, color: C.signal400}}>CALL OR TEXT 0452 385 321</span>
  </div>
);

/** Sheet header rule: ⊕ SHEET 0X — TITLE ......... hatch  0X / 05 */
export const SheetHeader: React.FC<{no: string; title: string; total?: string; drawFrom?: number}> = ({
  no,
  title,
  total = '05',
  drawFrom = 0,
}) => {
  const frame = useCurrentFrame();
  const draw = interpolate(frame - drawFrom, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div style={{padding: '0 64px', flexShrink: 0}}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 22,
          padding: '18px 0',
          position: 'relative',
        }}
      >
        <RegMark />
        <span style={{...mnlDimLg, ...mnlNum, color: C.signal600}}>SHEET {no}</span>
        <span style={{...mnlDim, color: C.carbon500}}>{title}</span>
        <div style={{marginLeft: 'auto', height: 14, width: 120, ...hatch()}} />
        <span style={{...mnlDim, ...mnlNum, color: C.carbon500}}>
          {no} / {total}
        </span>
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            height: 2,
            width: `${draw * 100}%`,
            background: C.carbon950,
          }}
        />
      </div>
    </div>
  );
};

/** Bottom footer rule: footnote | CCR·K1 / REV 2026.07 */
export const SheetFooter: React.FC<{note: string}> = ({note}) => (
  <div style={{padding: '0 64px', marginTop: 'auto', flexShrink: 0}}>
    <div
      style={{
        borderTop: `1.5px solid ${C.carbon150}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 0 22px',
      }}
    >
      <span style={{...mnlDim, color: C.carbon500}}>{note}</span>
      <span style={{...mnlDim, ...mnlNum, color: C.carbon500}}>CCR·K1 / REV 2026.07</span>
    </div>
  </div>
);

/** The CCR stamp tile (logo) — carbon square, Archivo Black, hard orange shadow */
export const CCRTile: React.FC<{size?: number}> = ({size = 44}) => (
  <div
    style={{
      width: size,
      height: size,
      background: C.carbon950,
      color: C.bone100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: FONT_DISPLAY,
      fontSize: size * 0.41,
      lineHeight: 1,
      boxShadow: size > 60 ? `${size * 0.07}px ${size * 0.07}px 0 0 ${C.signal500}` : hardSignal,
      flexShrink: 0,
    }}
  >
    CCR
  </div>
);

/** Marquee ticker on an ink strip */
export const Ticker: React.FC<{items: string[]; pxPerFrame?: number}> = ({items, pxPerFrame = 4}) => {
  const frame = useCurrentFrame();
  const text = items.join('  ·  ') + '  ·  ';
  const repeated = text.repeat(6);
  const shift = (frame * pxPerFrame) % (repeated.length * 3);
  return (
    <div
      style={{
        background: C.carbon950,
        overflow: 'hidden',
        padding: '13px 0',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 17,
          fontWeight: 500,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: C.bone100,
          transform: `translateX(${-shift}px)`,
          display: 'inline-block',
        }}
      >
        {repeated}
      </div>
    </div>
  );
};

/** Five-point star */
export const Star: React.FC<{size?: number; color?: string}> = ({size = 40, color = C.signal500}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block'}}>
    <path
      d="M12 1.6l3.1 6.9 7.3.7-5.5 5 1.6 7.2L12 17.6l-6.5 3.8 1.6-7.2-5.5-5 7.3-.7z"
      fill={color}
      stroke={C.carbon950}
      strokeWidth={1.2}
    />
  </svg>
);
