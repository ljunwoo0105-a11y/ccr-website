"use client";

// ---------------------------------------------------------------------------
// Demand-mode helper for the WebGL scenes.
//
// A prefers-reduced-motion visitor should get a STATIC scene, not one redrawn
// at 60fps forever. R3F's frameloop="demand" only renders when something calls
// invalidate() — but the scenes animate with time-based maath damping, so a
// single invalidate() (one frame) would freeze a transition mid-way. And the
// interaction handlers live in the DOM shell OUTSIDE the <Canvas>, where
// useThree()/invalidate() aren't reachable.
//
// useDemandLoop() bridges both problems: DemandDriver (mounted inside the
// Canvas) publishes invalidate() to a ref the shell owns, and keeps the loop
// alive for a short "wake window" after each wake() so damping settles and
// then parks. In frameloop="always" mode every invalidate() is a harmless
// no-op, so the exact same wiring is safe for reduced- and full-motion paths.
// ---------------------------------------------------------------------------

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type MutableRefObject,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";

const now = () =>
  typeof performance !== "undefined" ? performance.now() : 0;

export interface DemandLoop {
  /** Kick the render loop and keep it alive for one wake window. Safe to call
   *  from DOM event handlers outside the Canvas. */
  wake: () => void;
  invalidateRef: MutableRefObject<(() => void) | null>;
  until: MutableRefObject<number>;
}

/**
 * @param wakeMs how long (ms) to keep rendering after a wake() — long enough
 *   for the scene's damping to settle. Default 1200ms.
 */
export function useDemandLoop(wakeMs = 1200): DemandLoop {
  const invalidateRef = useRef<(() => void) | null>(null);
  const until = useRef(0);

  const wake = useCallback(() => {
    until.current = now() + wakeMs;
    invalidateRef.current?.();
  }, [wakeMs]);

  // Stable object so effects can depend on the loop without re-running.
  return useMemo(() => ({ wake, invalidateRef, until }), [wake]);
}

/** Mount as a direct child of the <Canvas>. Publishes invalidate() to the
 *  shell and sustains the loop while inside a wake window. */
export function DemandDriver({ bind }: { bind: DemandLoop }) {
  const invalidate = useThree((s) => s.invalidate);
  const { invalidateRef, until, wake } = bind;

  useEffect(() => {
    invalidateRef.current = invalidate;
    // Paint a burst on (re)mount so the scene fully renders/settles (env map,
    // first damp frames) and then parks — independent of any observer firing.
    wake();
    return () => {
      invalidateRef.current = null;
    };
  }, [invalidate, invalidateRef, wake]);

  useFrame((state) => {
    if (now() < until.current) state.invalidate();
  });

  return null;
}
