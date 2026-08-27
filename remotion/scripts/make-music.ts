/**
 * Deterministic synth music bed for the CCR promo video.
 * Writes ../public/music.wav — 75s, 44.1kHz, 16-bit stereo.
 * Style: understated workshop groove — soft kick, ticking hats,
 * warm triangle bass, quiet pad, sparse pentatonic pings.
 */

const SR = 44100;
const DUR = 75;
const N = Math.ceil(SR * DUR);
const L = new Float64Array(N);
const R = new Float64Array(N);

// Seeded LCG so the track is reproducible
let seed = 20260803;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};

const BPM = 96;
const BEAT = 60 / BPM; // 0.625s
const BAR = BEAT * 4; // 2.5s
const TOTAL_BARS = Math.floor(DUR / BAR);

// Am — F — C — G (roots + triads), workshop-positive
const CHORDS = [
  { root: 55.0, triad: [220.0, 261.63, 329.63] }, // A1, Am: A3 C4 E4
  { root: 43.65, triad: [174.61, 220.0, 261.63] }, // F1, F: F3 A3 C4
  { root: 65.41, triad: [196.0, 261.63, 329.63] }, // C2, C: G3 C4 E4
  { root: 49.0, triad: [196.0, 246.94, 293.66] }, // G1, G: G3 B3 D4
];

const PENTA = [440.0, 523.25, 587.33, 659.26, 783.99]; // A C D E G (4th/5th oct)

const clampIdx = (i: number) => Math.max(0, Math.min(N - 1, i));

function addKick(t0: number, gain: number) {
  const dur = 0.22;
  const start = Math.floor(t0 * SR);
  let phase = 0;
  for (let i = 0; i < dur * SR; i++) {
    const t = i / SR;
    const f = 45 + 75 * Math.exp(-t * 30); // 120 -> 45 Hz sweep
    phase += (2 * Math.PI * f) / SR;
    const env = Math.exp(-t * 18);
    const s = Math.sin(phase) * env * gain;
    const idx = clampIdx(start + i);
    L[idx] += s;
    R[idx] += s;
  }
}

function addHat(t0: number, gain: number, open = false) {
  const dur = open ? 0.12 : 0.045;
  const start = Math.floor(t0 * SR);
  let prev = 0;
  for (let i = 0; i < dur * SR; i++) {
    const t = i / SR;
    const n = rand() * 2 - 1;
    const hp = n - prev; // crude highpass (differentiator)
    prev = n;
    const env = Math.exp(-t * (open ? 40 : 90));
    const s = hp * env * gain;
    const idx = clampIdx(start + i);
    L[idx] += s * 0.7;
    R[idx] += s * 1.0; // hats sit slightly right
  }
}

function addRim(t0: number, gain: number) {
  const dur = 0.09;
  const start = Math.floor(t0 * SR);
  let prev = 0;
  for (let i = 0; i < dur * SR; i++) {
    const t = i / SR;
    const n = rand() * 2 - 1;
    const hp = n - prev;
    prev = n;
    const ping = Math.sin(2 * Math.PI * 890 * t) * 0.5;
    const env = Math.exp(-t * 55);
    const s = (hp * 0.6 + ping) * env * gain;
    const idx = clampIdx(start + i);
    L[idx] += s;
    R[idx] += s * 0.8;
  }
}

function triangle(phase: number) {
  const p = phase / (2 * Math.PI) - Math.floor(phase / (2 * Math.PI));
  return p < 0.5 ? 4 * p - 1 : 3 - 4 * p;
}

function addBass(t0: number, freq: number, dur: number, gain: number) {
  const start = Math.floor(t0 * SR);
  let phase = 0;
  let lp = 0;
  const a = 0.15; // one-pole lowpass coefficient
  for (let i = 0; i < dur * SR; i++) {
    const t = i / SR;
    phase += (2 * Math.PI * freq) / SR;
    const attack = Math.min(1, t / 0.008);
    const release = Math.min(1, Math.max(0, (dur - t) / 0.05));
    const raw = triangle(phase) * 0.8 + Math.sin(phase) * 0.4;
    lp += a * (raw - lp);
    const s = lp * attack * release * gain;
    const idx = clampIdx(start + i);
    L[idx] += s;
    R[idx] += s;
  }
}

function addPad(t0: number, freqs: number[], dur: number, gain: number) {
  const start = Math.floor(t0 * SR);
  let lp = 0;
  const phases = freqs.map(() => 0);
  const detunes = freqs.map((_, i) => 1 + (i - 1) * 0.0012);
  for (let i = 0; i < dur * SR; i++) {
    const t = i / SR;
    let raw = 0;
    for (let v = 0; v < freqs.length; v++) {
      phases[v] += (2 * Math.PI * freqs[v] * detunes[v]) / SR;
      raw += Math.sin(phases[v]) + 0.3 * Math.sin(phases[v] * 2);
    }
    raw /= freqs.length;
    lp += 0.08 * (raw - lp);
    const attack = Math.min(1, t / 0.9);
    const release = Math.min(1, Math.max(0, (dur - t) / 0.9));
    const s = lp * attack * release * gain;
    const idx = clampIdx(start + i);
    L[idx] += s * 1.0;
    R[idx] += s * 0.85;
  }
}

function addPing(t0: number, freq: number, gain: number) {
  const dur = 0.5;
  const start = Math.floor(t0 * SR);
  let phase = 0;
  for (let i = 0; i < dur * SR; i++) {
    const t = i / SR;
    phase += (2 * Math.PI * freq) / SR;
    const env = Math.exp(-t * 9);
    const s = (Math.sin(phase) + 0.25 * Math.sin(phase * 3)) * env * gain;
    const idx = clampIdx(start + i);
    L[idx] += s * 1.0; // pings sit slightly left
    R[idx] += s * 0.65;
  }
}

// ---- Arrangement ----
for (let bar = 0; bar < TOTAL_BARS; bar++) {
  const t0 = bar * BAR;
  const chord = CHORDS[bar % CHORDS.length];
  const intro = bar < 2; // sparse first two bars
  const outro = bar >= TOTAL_BARS - 2;

  // Pad on every bar
  addPad(t0, chord.triad, BAR + 0.4, intro ? 0.05 : 0.075);

  // Kick on quarters (skip some in intro/outro)
  for (let b = 0; b < 4; b++) {
    if (intro && b % 2 === 1) continue;
    addKick(t0 + b * BEAT, outro ? 0.3 : 0.42);
  }

  // Hats on eighth offbeats, occasional open hat at bar end
  if (!intro) {
    for (let e = 0; e < 8; e++) {
      const tt = t0 + (e * BEAT) / 2;
      if (e % 2 === 1) addHat(tt, 0.09 + rand() * 0.02, e === 7 && bar % 4 === 3);
    }
    // Rim on 2 and 4
    addRim(t0 + BEAT, 0.1);
    addRim(t0 + 3 * BEAT, 0.1);
  }

  // Bass: root eighths, octave pop on the "and" of 3
  if (!intro) {
    const f = chord.root;
    addBass(t0, f, BEAT * 0.9, 0.24);
    addBass(t0 + BEAT, f, BEAT * 0.45, 0.2);
    addBass(t0 + BEAT * 1.5, f, BEAT * 0.45, 0.18);
    addBass(t0 + BEAT * 2, f, BEAT * 0.9, 0.24);
    addBass(t0 + BEAT * 3, f * 2, BEAT * 0.45, 0.17);
    addBass(t0 + BEAT * 3.5, f, BEAT * 0.45, 0.2);
  } else {
    addBass(t0, chord.root, BAR * 0.95, 0.18);
  }

  // Sparse pentatonic pings — deterministic pattern, ~2 per bar
  if (!intro && !outro) {
    const p1 = PENTA[(bar * 3 + 1) % PENTA.length];
    const p2 = PENTA[(bar * 5 + 3) % PENTA.length];
    addPing(t0 + BEAT * 1.5, p1, 0.055);
    if (bar % 2 === 0) addPing(t0 + BEAT * 3.25, p2, 0.045);
  }
}

// ---- Master: normalize, soft clip, fades ----
let peak = 0;
for (let i = 0; i < N; i++) {
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const norm = peak > 0 ? 0.85 / peak : 1;
const fadeIn = SR * 0.6;
const fadeOut = SR * 2.5;
for (let i = 0; i < N; i++) {
  let g = norm;
  if (i < fadeIn) g *= i / fadeIn;
  if (i > N - fadeOut) g *= (N - i) / fadeOut;
  L[i] = Math.tanh(L[i] * g * 1.15);
  R[i] = Math.tanh(R[i] * g * 1.15);
}

// ---- Write 16-bit stereo WAV ----
const bytesPerSample = 2;
const numChannels = 2;
const dataSize = N * numChannels * bytesPerSample;
const buf = new ArrayBuffer(44 + dataSize);
const view = new DataView(buf);
const writeStr = (off: number, s: string) => {
  for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
};
writeStr(0, 'RIFF');
view.setUint32(4, 36 + dataSize, true);
writeStr(8, 'WAVE');
writeStr(12, 'fmt ');
view.setUint32(16, 16, true);
view.setUint16(20, 1, true); // PCM
view.setUint16(22, numChannels, true);
view.setUint32(24, SR, true);
view.setUint32(28, SR * numChannels * bytesPerSample, true);
view.setUint16(32, numChannels * bytesPerSample, true);
view.setUint16(34, 16, true);
writeStr(36, 'data');
view.setUint32(40, dataSize, true);
let off = 44;
for (let i = 0; i < N; i++) {
  view.setInt16(off, Math.max(-32768, Math.min(32767, Math.round(L[i] * 32767))), true);
  off += 2;
  view.setInt16(off, Math.max(-32768, Math.min(32767, Math.round(R[i] * 32767))), true);
  off += 2;
}

const outPath = new URL('../public/music.wav', import.meta.url).pathname;
// Bun on Windows: URL pathname starts with /C:/ — strip the leading slash
const cleaned = outPath.match(/^\/[A-Za-z]:\//) ? outPath.slice(1) : outPath;
await Bun.write(cleaned, buf);
console.log(`Wrote ${cleaned} (${(dataSize / 1024 / 1024).toFixed(1)} MB, ${DUR}s)`);
