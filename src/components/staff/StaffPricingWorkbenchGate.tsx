"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// The pricing workbench is staff-only and renders nothing for the public, yet
// it (and its BayIntakeModal → IntakeForm subtree, plus zod) is a heavy client
// chunk. This gate keeps all of that out of the eager homepage bundle: it does
// one cheap /api/staff/session probe, and only an authenticated staff browser
// ever downloads or hydrates the workbench chunk. The probe is a plain fetch
// with a structural check — importing the zod-backed source helpers here would
// pull the value graph we are trying to defer back into the eager bundle.
//
// ssr:false is legal because this is a client component; the homepage RSC stays
// static (revalidate = 3600), so it must NOT read cookies() to gate on the
// server — that would force per-request dynamic rendering for every visitor.
const StaffPricingWorkbench = dynamic(
  () => import("./StaffPricingWorkbench"),
  { ssr: false },
);

async function probeStaffSession(signal: AbortSignal): Promise<boolean> {
  try {
    const res = await fetch("/api/staff/session", { signal });
    if (!res.ok) return false;
    const body = (await res.json()) as {
      ok?: boolean;
      data?: { role?: string };
    };
    const role = body?.data?.role;
    return body?.ok === true && (role === "STAFF" || role === "ADMIN");
  } catch {
    return false;
  }
}

export default function StaffPricingWorkbenchGate() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    probeStaffSession(controller.signal).then((ok) => {
      if (!controller.signal.aborted) setAuthenticated(ok);
    });
    return () => controller.abort();
  }, []);

  if (!authenticated) return null;
  return <StaffPricingWorkbench />;
}
