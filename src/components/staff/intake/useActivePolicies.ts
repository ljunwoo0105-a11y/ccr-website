import { useEffect, useRef, useState } from "react";

import {
  parseActivePolicyResponse,
  resolvePolicyLoad,
  type PolicyLoadResult,
  type PolicyLoadState,
} from "./policies";

export function useActivePolicies(): PolicyLoadState {
  const requestIdRef = useRef(0);
  const [policyState, setPolicyState] = useState<PolicyLoadState>({
    kind: "loading",
    requestId: 0,
  });

  useEffect(() => {
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    let active = true;
    setPolicyState({ kind: "loading", requestId });

    async function loadPolicies() {
      let result: PolicyLoadResult;
      try {
        const response = await fetch("/api/staff/policies/active", {
          cache: "no-store",
        });
        const raw: unknown = await response.json();
        result = response.ok
          ? parseActivePolicyResponse(raw)
          : {
              kind: "failed",
              message: "Required policies could not be loaded.",
            };
      } catch (caught) {
        result = {
          kind: "failed",
          message:
            caught instanceof Error
              ? "Required policies could not be loaded."
              : "Required policies could not be loaded.",
        };
      }
      if (active) {
        setPolicyState((currentState) =>
          resolvePolicyLoad(currentState, requestId, result)
        );
      }
    }

    void loadPolicies();
    return () => {
      active = false;
    };
  }, []);

  return policyState;
}
