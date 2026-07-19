"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { LogOut } from "lucide-react";
import PriceListTable from "@/components/staff/PriceListTable";
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

        <StaffPriceListPanel />
      </div>
    </section>
  );
}

/**
 * Full price list for every repair on file — the staff view of the catalog.
 * Staff have no portal access, so this section (plus the quick match above)
 * is their entire pricing surface, including the way out of the session.
 */
function StaffPriceListPanel() {
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
    <div className="mt-10 border-t border-carbon-950 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-4 pb-4">
        <div>
          <p className="mnl-dim text-signal-600">STAFF PRICE LIST</p>
          <h3 className="mnl-display mt-1 text-2xl text-carbon-950 sm:text-3xl">
            All repair prices
          </h3>
        </div>
        <button
          type="button"
          className="mnl-chip"
          onClick={() => void handleSignOut()}
          disabled={signingOut}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
      <PriceListTable mode="staff" />
    </div>
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
