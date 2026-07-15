import { useEffect, useRef, useState } from "react";

import type { CustomerMatch } from "../types";
import { isCustomerMatchesEnvelope } from "./responses";

export type CustomerLookup = {
  readonly matches: readonly CustomerMatch[];
  readonly matchesOpen: boolean;
  readonly clearMatches: () => void;
  readonly cancelLookup: () => void;
};

export function useCustomerLookup(phone: string): CustomerLookup {
  const [matches, setMatches] = useState<CustomerMatch[]>([]);
  const [matchesOpen, setMatchesOpen] = useState(false);
  const lookupIdRef = useRef(0);

  useEffect(() => {
    const trimmed = phone.trim();
    if (trimmed.length < 3) {
      setMatches([]);
      setMatchesOpen(false);
      return;
    }
    const lookupId = lookupIdRef.current + 1;
    lookupIdRef.current = lookupId;
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/staff/customers?phone=${encodeURIComponent(trimmed)}`
        );
        const json: unknown = await response.json();
        if (lookupId !== lookupIdRef.current) return;
        if (response.ok && isCustomerMatchesEnvelope(json) && json.ok && json.data) {
          setMatches([...json.data]);
          setMatchesOpen(json.data.length > 0);
        }
      } catch {
        /* lookup is best-effort */
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [phone]);

  return {
    matches,
    matchesOpen,
    clearMatches: () => {
      setMatches([]);
      setMatchesOpen(false);
    },
    cancelLookup: () => {
      lookupIdRef.current += 1;
    },
  };
}
