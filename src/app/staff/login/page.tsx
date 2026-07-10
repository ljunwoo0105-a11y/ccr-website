import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "@/components/staff/LoginForm";

export const metadata: Metadata = {
  title: "Staff Login",
  robots: { index: false, follow: false },
};

/**
 * Staff portal login. Lives outside the (portal) route group so the
 * authenticated shell (which redirects guests here) never wraps it. Uses the
 * light staff/admin theme, not the dark public marketing theme.
 */
export default function StaffLoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  return (
    <main className="mnl-page flex min-h-screen items-center justify-center px-6 py-20">
      <div className="w-full max-w-[400px]">
        {/* Stamp header */}
        <div className="mb-5 flex items-center gap-3">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center border border-carbon-950 bg-carbon-950 font-display text-lg leading-none text-bone-100 shadow-hard-signal"
            aria-hidden="true"
          >
            CCR
          </span>
          <div>
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-signal-600">
              Field Service Manual
            </p>
            <p className="font-display text-sm uppercase tracking-wide text-carbon-950">
              Cool Case Repair
            </p>
          </div>
        </div>
        <div className="card shadow-hard-lg">
          <h1 className="mnl-title text-xl text-carbon-950">Staff sign in</h1>
          <p className="mnl-dim mt-1.5 text-carbon-500">
            Staff &amp; admin portal · authorised access
          </p>
          <div className="mt-7">
            <LoginForm next={searchParams.next} />
          </div>
        </div>
        <p className="mt-6 text-center">
          <Link
            href="/"
            className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-carbon-500 underline-offset-4 transition-colors hover:text-signal-600 hover:underline"
          >
            &larr; Back to coolcaserepair.com.au
          </Link>
        </p>
      </div>
    </main>
  );
}
