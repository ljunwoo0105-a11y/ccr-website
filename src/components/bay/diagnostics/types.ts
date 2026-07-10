// ---------------------------------------------------------------------------
// Teardown Bay diagnostics — the guided fault-trace wizard schema.
//
// CONTENT RULES (every author, human or agent, follows these):
//  1. Never diagnose definitively. Every summary/why uses hedged language:
//     "most likely", "usually", "in our experience".
//  2. Every verdict CTA leads to /quote — free assessment framing. NO PRICES.
//  3. `urgent: true` verdicts lead with safety wording (stop charging, power
//     down, bring it in) — battery swelling, heat, liquid.
//  4. Questions must be answerable at home with NO tools and NO disassembly:
//     things you can see / hear / feel.
//  5. Vocabulary stays consistent with services-data.ts commonRepairs.
//
// The node graph is FLAT (Record keyed by node id), not a nested tree:
// back-navigation is a UI-side stack, and multiple symptom entries may
// converge on shared verdict nodes.
// ---------------------------------------------------------------------------

import type { DeviceId } from "../rig-data";
import type { BoardIcId } from "../board-data";

export type { DeviceId };

/** Ranked confidence. Verdicts list suspects in this order, primary first. */
export type Likelihood = "primary" | "likely" | "possible";

/**
 * One suspect row in a verdict. `partIds` usually has one entry; multiple
 * entries mean "highlight all of these as one suspect" (tablet twin battery
 * cells, the four drone arms). P is the device's part-id union — a typo is
 * a compile error.
 */
export interface Suspect<P extends string = string> {
  partIds: readonly [P, ...P[]];
  likelihood: Likelihood;
  /** Plain-English "why we suspect this" — 1–2 hedged sentences. */
  why: string;
  /** Display override when partIds > 1 ("Battery (both cells)"). */
  label?: string;
}

/** Cross-link from a verdict into the SHEET 02 board-level bench. */
export interface IcLink {
  icId: BoardIcId;
  /** "If a new port doesn't fix it, this is board-level — often U7." */
  note: string;
}

export interface WizardOption<N extends string = string> {
  /** Stable per-node option id, e.g. "no-signs". */
  id: string;
  /** Short button text: "No — completely dead". */
  label: string;
  /** Sub-copy clarifier: "No LED, no vibration, no warmth". */
  hint?: string;
  next: N;
}

export interface QuestionNode<
  P extends string = string,
  N extends string = string,
> {
  kind: "question";
  question: string;
  /** What to look/listen/feel for — no tools needed. */
  help?: string;
  options: readonly WizardOption<N>[];
  /** Parts softly spotlighted in 3D while this question shows. */
  focusParts?: readonly P[];
}

export interface VerdictNode<P extends string = string> {
  kind: "verdict";
  /** Short stamp for the card: "POWER PATH FAULT". */
  title: string;
  /** Plain-English wrap-up. Hedged language required. */
  summary: string;
  /** 1–4 suspects, ordered primary → possible. */
  suspects: readonly Suspect<P>[];
  /** Ties the verdict into the SHEET 02 board. */
  relatedIcs?: readonly IcLink[];
  /** Safety-critical — UI renders a warning band. */
  urgent?: boolean;
}

export type DiagNode<P extends string = string, N extends string = string> =
  | QuestionNode<P, N>
  | VerdictNode<P>;

/** Entry menu item — the wizard's start screen lists these per device. */
export interface SymptomEntry<N extends string = string> {
  id: string;
  /** "Won't turn on" */
  label: string;
  /** "Black screen, no response" */
  tagline?: string;
  start: N;
}

export interface DeviceDiagnostics<
  P extends string = string,
  N extends string = string,
> {
  device: DeviceId;
  symptoms: readonly SymptomEntry<N>[];
  /** Flat node graph. Converging branches (shared verdicts) encouraged. */
  nodes: Record<N, DiagNode<P, N>>;
}
