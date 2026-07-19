"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { LogOut } from "lucide-react";
import {
  fetchCatalogOptions,
  fetchDiagnoses,
  fetchPricingMatch,
  fetchStaffSession,
} from "./pricing-workbench/source";
import {
  initialWorkbenchState,
  isCascadeReady,
  pricingWorkbenchReducer,
  selectedDiagnosisLabel,
} from "./pricing-workbench/state";
import ResultPanel from "./pricing-workbench/ResultPanel";
import WorkbenchControls from "./pricing-workbench/WorkbenchControls";
import type { WorkbenchSelection } from "./pricing-workbench/types";

const browserFetch = globalThis.fetch.bind(globalThis);

export default function StaffPricingWorkbench() {
  const [state, dispatch] = useReducer(
    pricingWorkbenchReducer,
    initialWorkbenchState
  );
  const requestIdRef = useRef(0);
  const selectedDiagnosis = state.diagnoses.find(
    (diagnosis) => diagnosis.id === state.selectedDiagnosisId
  );

  useEffect(() => {
    const controller = new AbortController();
    const requestId = nextRequestId(requestIdRef);
    dispatch({ type: "LOAD_STARTED", requestId, target: "session" });
    fetchStaffSession(browserFetch, controller.signal)
      .then((session) => {
        if (session.kind === "authenticated") {
          dispatch({ type: "SESSION_AUTHENTICATED", role: session.user.role });
        } else {
          dispatch({ type: "SESSION_ANONYMOUS" });
        }
      })
      .catch((caught) => {
        if (isAbortError(caught)) return;
        dispatch({ type: "SESSION_ANONYMOUS" });
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (state.session !== "authenticated") return;
    const controller = new AbortController();
    const requestId = nextRequestId(requestIdRef);
    dispatch({
      type: "LOAD_STARTED",
      requestId,
      target: catalogTarget(state.selection),
    });
    fetchCatalogOptions(browserFetch, state.selection, controller.signal)
      .then((result) => {
        dispatch({ type: "OPTIONS_LOADED", ...result, requestId });
      })
      .catch((caught) => {
        if (isAbortError(caught)) return;
        dispatch({
          type: "LOAD_FAILED",
          requestId,
          message: "Could not load protected catalog options",
        });
      });
    return () => controller.abort();
  }, [state.session, state.selection]);

  useEffect(() => {
    if (state.session !== "authenticated" || !isCascadeReady(state.selection)) {
      return;
    }
    const controller = new AbortController();
    const requestId = nextRequestId(requestIdRef);
    dispatch({ type: "LOAD_STARTED", requestId, target: "diagnoses" });
    fetchDiagnoses(browserFetch, state.selection, controller.signal)
      .then((values) => {
        dispatch({ type: "DIAGNOSES_LOADED", values, requestId });
      })
      .catch((caught) => {
        if (isAbortError(caught)) return;
        dispatch({
          type: "LOAD_FAILED",
          requestId,
          message: "Could not load diagnosis rules",
        });
      });
    return () => controller.abort();
  }, [state.session, state.selection]);

  useEffect(() => {
    if (!selectedDiagnosis || !isCascadeReady(state.selection)) return;
    const controller = new AbortController();
    const requestId = nextRequestId(requestIdRef);
    dispatch({ type: "LOAD_STARTED", requestId, target: "match" });
    fetchPricingMatch(
      browserFetch,
      { ...state.selection, symptomCode: selectedDiagnosis.symptomCode },
      controller.signal
    )
      .then((result) => {
        dispatch({ type: "MATCH_LOADED", result, requestId });
      })
      .catch((caught) => {
        if (isAbortError(caught)) return;
        dispatch({
          type: "LOAD_FAILED",
          requestId,
          message: "Could not resolve final pricing match",
        });
      });
    return () => controller.abort();
  }, [selectedDiagnosis, state.selection]);

  if (state.session !== "authenticated") return null;

  return (
    <section
      data-staff-pricing
      className="border-b border-carbon-950 bg-bone-100"
    >
      <div className="mnl-container py-8">
        <WorkbenchControls state={state} dispatch={dispatch} />

        {state.match ? (
          <ResultPanel
            result={state.match}
            diagnosisLabel={selectedDiagnosisLabel(state)}
            selectedPartId={state.selectedPartId}
            onSelectPart={(value) => dispatch({ type: "SELECT_PART", value })}
            canStartIntake={state.role === "ADMIN"}
          />
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-carbon-150 pt-4">
          <p className="mnl-dim text-carbon-500">
            Repair prices are shown in the teardown bay — pick a part or run a
            diagnosis.
          </p>
          <StaffSignOut />
        </div>
      </div>
    </section>
  );
}

/**
 * Staff have no portal access, so the way out of the session has to live on
 * the public page alongside the pricing surfaces.
 */
function StaffSignOut() {
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch("/api/staff/logout", { method: "POST" });
    } finally {
      window.location.assign("/");
    }
  }

  return (
    <button
      type="button"
      className="mnl-chip"
      onClick={() => void handleSignOut()}
      disabled={signingOut}
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      {signingOut ? "Signing out…" : "Sign out"}
    </button>
  );
}

function nextRequestId(ref: React.MutableRefObject<number>): number {
  ref.current += 1;
  return ref.current;
}

function catalogTarget(selection: WorkbenchSelection) {
  if (!selection.deviceType) return "deviceTypes";
  if (!selection.brand) return "brands";
  if (!selection.model) return "models";
  return "repairTypes";
}

function isAbortError(value: unknown): boolean {
  return value instanceof DOMException && value.name === "AbortError";
}
