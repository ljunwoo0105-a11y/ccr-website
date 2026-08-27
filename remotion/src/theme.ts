import {loadFont as loadArchivoBlack} from '@remotion/google-fonts/ArchivoBlack';
import {loadFont as loadArchivo} from '@remotion/google-fonts/Archivo';
import {loadFont as loadIBMPlexMono} from '@remotion/google-fonts/IBMPlexMono';

const archivoBlack = loadArchivoBlack();
const archivo = loadArchivo('normal', {weights: ['400', '500', '600']});
const plexMono = loadIBMPlexMono('normal', {weights: ['400', '500', '600']});

export const FONT_DISPLAY = archivoBlack.fontFamily;
export const FONT_SANS = archivo.fontFamily;
export const FONT_MONO = plexMono.fontFamily;

/** Manifold palette — lifted verbatim from src/app/globals.css of the website */
export const C = {
  bone50: '#FAF8F2',
  bone100: '#F4F1E8',
  bone200: '#ECE7DA',
  bone300: '#E0DACA',
  bone400: '#CFC7B2',
  carbon950: '#161511',
  carbon900: '#211F19',
  carbon700: '#3D3A30',
  carbon500: '#686456',
  carbon400: '#8B8778',
  carbon200: '#B9B4A3',
  carbon150: '#CFC9B8',
  signal600: '#D63E00',
  signal500: '#F24C00',
  signal400: '#FF6B24',
  signal100: '#FBE3D5',
  copper500: '#B26E3A',
  copper300: '#D9A167',
} as const;

/** Drafting label voices (mnl-dim / mnl-dim-lg / display / title) */
export const mnlDim: React.CSSProperties = {
  fontFamily: FONT_MONO,
  fontSize: 15,
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.18em',
};

export const mnlDimLg: React.CSSProperties = {
  fontFamily: FONT_MONO,
  fontSize: 17,
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.22em',
};

export const mnlDisplay: React.CSSProperties = {
  fontFamily: FONT_DISPLAY,
  fontWeight: 400,
  textTransform: 'uppercase',
  letterSpacing: '-0.015em',
  lineHeight: 0.92,
};

export const mnlTitle: React.CSSProperties = {
  fontFamily: FONT_DISPLAY,
  fontWeight: 400,
  textTransform: 'uppercase',
  letterSpacing: '0em',
  lineHeight: 1.05,
};

export const mnlNum: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: '"tnum"',
};

/** Hard offset shadows — zero blur, zero spread, always */
export const hardSm = `2px 2px 0 0 ${C.carbon950}`;
export const hard = `3px 3px 0 0 ${C.carbon950}`;
export const hardLg = `4px 4px 0 0 rgba(22,21,17,0.9)`;
export const hardXl = `6px 6px 0 0 rgba(22,21,17,0.9)`;
export const hardSignal = `3px 3px 0 0 ${C.signal500}`;

/** Dot-grid drafting paper background */
export const paperBg: React.CSSProperties = {
  backgroundColor: C.bone100,
  backgroundImage: `radial-gradient(rgba(22,21,17,0.055) 1.5px, transparent 1.5px)`,
  backgroundSize: '26px 26px',
};

export const hatch = (color = 'rgba(22,21,17,0.14)', gap = 7): React.CSSProperties => ({
  backgroundImage: `repeating-linear-gradient(-45deg, ${color} 0, ${color} 1px, transparent 1px, transparent ${gap}px)`,
});
