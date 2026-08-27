/**
 * Voiceover manifest — files live in public/. Written once the TTS
 * segments are downloaded; order matches the scene order.
 */
export const VO_FILES = [
  'vo-1.wav',
  'vo-2.wav',
  'vo-3.wav',
  'vo-4.wav',
  'vo-5.wav',
  'vo-6.wav',
];

/** Seconds of scene shown before its VO starts */
export const VO_DELAYS = [0.7, 0.4, 0.4, 0.4, 0.4, 0.5];

/** Seconds of hold after VO ends before next scene */
export const TAIL_PADS = [0.8, 0.7, 0.7, 0.7, 0.7, 2.4];

/** Minimum scene length in seconds regardless of VO length */
export const MIN_SCENE_SECS = [5.5, 8, 8.5, 7.5, 8, 9];
