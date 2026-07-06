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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-20">
      <div className="w-full max-w-[400px]">
        <div className="card">
          <p className="text-2xl font-bold tracking-tight text-ccr-primary">CCR</p>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">
            Staff sign in
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Cool Case Repair — staff &amp; admin portal
          </p>
          <div className="mt-8">
            <LoginForm next={searchParams.next} />
          </div>
        </div>
        <p className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm font-medium text-slate-500 hover:text-ccr-primary"
          >
            &larr; Back to coolcaserepair.com.au
          </Link>
        </p>
      </div>
    </main>
  );
}
