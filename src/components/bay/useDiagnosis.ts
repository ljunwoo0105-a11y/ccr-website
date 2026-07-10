"use client";

// ---------------------------------------------------------------------------
// Wizard state for the Teardown Bay fault trace. Pure DOM-side hook — no
// three.js imports. The shell passes demand.wake as onMutate so every state
// transition repaints the (possibly demand-parked) canvas.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DeviceId } from "./rig-data";
import { loadDiagnostics } from "./diagnostics";
import type {
  DeviceDiagnostics,
  DiagNode,
  Likelihood,
  QuestionNode,
  VerdictNode,
} from "./diagnostics/types";

export interface RankInfo {
  likelihood: Likelihood;
  /** 1-based suspect row number — the "01/02/03" badge. */
  ordinal: number;
}

export type DiagPhase = "loading" | "error" | "menu" | "asking" | "verdict";

export interface Diagnosis {
  phase: DiagPhase;
  error: string | null;
  symptoms: DeviceDiagnostics["symptoms"];
  question: QuestionNode | null;
  verdict: VerdictNode | null;
  /** 1-based step counter while asking. */
  step: number;
  /** partId → rank, non-empty only at a verdict. */
  implicated: Record<string, RankInfo>;
  /** Parts softly spotlighted during the current question. */
  focusIds: readonly string[];
  /** Ordered partIds for the link line — primary suspect first. */
  chain: readonly string[];
  canGoBack: boolean;
  start: (symptomId: string) => void;
  answer: (optionId: string) => void;
  back: () => void;
  restart: () => void;
}

export function useDiagnosis(
  deviceId: DeviceId,
  active: boolean,
  onMutate?: () => void,
): Diagnosis {
  const [data, setData] = useState<DeviceDiagnostics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nodeId, setNodeId] = useState<string | null>(null);
  const [trail, setTrail] = useState<string[]>([]);

  // Device switch: flows are per-device — reset everything.
  useEffect(() => {
    setData(null);
    setError(null);
    setNodeId(null);
    setTrail([]);
  }, [deviceId]);

  // Lazy-load the device's wizard chunk the first time the tab opens.
  useEffect(() => {
    if (!active || data || error) return;
    let cancelled = false;
    loadDiagnostics(deviceId)
      .then((d) => {
        if (cancelled) return;
        setData(d);
        onMutate?.();
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [active, data, error, deviceId, onMutate]);

  // Gate every derived value on the loaded data belonging to the CURRENT
  // device. On a device switch, deviceId changes and BayScene remounts
  // synchronously, but `data`/`nodeId` reset only in the post-commit effect
  // above — so for one render `data` is the OLD device's. Without this gate,
  // `chain`/`implicated` would carry the previous device's suspects into the
  // freshly-mounted scene, painting stale link lines for a frame.
  const ready = data?.device === deviceId;
  const node: DiagNode | null =
    ready && nodeId
      ? (data!.nodes as Record<string, DiagNode>)[nodeId] ?? null
      : null;
  const question = node?.kind === "question" ? node : null;
  const verdict = node?.kind === "verdict" ? node : null;

  const phase: DiagPhase = error
    ? "error"
    : !ready
      ? "loading"
      : !node
        ? "menu"
        : question
          ? "asking"
          : "verdict";

  const start = useCallback(
    (symptomId: string) => {
      const s = data?.symptoms.find((x) => x.id === symptomId);
      if (!s) return;
      setTrail([]);
      setNodeId(s.start);
      onMutate?.();
    },
    [data, onMutate],
  );

  const answer = useCallback(
    (optionId: string) => {
      if (!data || !nodeId) return;
      const n = (data.nodes as Record<string, DiagNode>)[nodeId];
      if (n?.kind !== "question") return;
      const opt = n.options.find((o) => o.id === optionId);
      if (!opt) return;
      setTrail((t) => [...t, nodeId]);
      setNodeId(opt.next);
      onMutate?.();
    },
    [data, nodeId, onMutate],
  );

  const back = useCallback(() => {
    setTrail((t) => {
      if (t.length === 0) {
        setNodeId(null); // first question → back to the symptom menu
        return t;
      }
      setNodeId(t[t.length - 1]);
      return t.slice(0, -1);
    });
    onMutate?.();
  }, [onMutate]);

  const restart = useCallback(() => {
    setNodeId(null);
    setTrail([]);
    onMutate?.();
  }, [onMutate]);

  const { implicated, chain } = useMemo(() => {
    if (!verdict) {
      return { implicated: {} as Record<string, RankInfo>, chain: [] as string[] };
    }
    const imp: Record<string, RankInfo> = {};
    const ch: string[] = [];
    verdict.suspects.forEach((s, i) => {
      for (const p of s.partIds) {
        imp[p] = { likelihood: s.likelihood, ordinal: i + 1 };
        ch.push(p);
      }
    });
    return { implicated: imp, chain: ch };
  }, [verdict]);

  return {
    phase,
    error,
    symptoms: ready ? data!.symptoms : [],
    question,
    verdict,
    step: trail.length + 1,
    implicated,
    focusIds: question?.focusParts ?? [],
    chain,
    canGoBack: nodeId !== null,
    start,
    answer,
    back,
    restart,
  };
}
