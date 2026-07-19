import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BUSINESS } from "@/lib/config";
import { formatDateTime } from "@/lib/utils";
import { intakeStatusBadge, statusLabel } from "@/components/staff/ui";

type IntakeDetailHeaderProps = {
  readonly id: string;
  readonly status: string;
  readonly createdAt: Date;
};

export function IntakeDetailHeader(props: IntakeDetailHeaderProps) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/admin/intake"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-carbon-700 hover:text-carbon-950"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          All intakes
        </Link>
        <span className={intakeStatusBadge(props.status)}>
          {statusLabel(props.status)}
        </span>
      </div>

      <header className="card flex flex-wrap items-start justify-between gap-4 print:rounded-none print:border-0 print:border-b print:border-slate-300 print:p-0 print:pb-4 print:shadow-none">
        <div>
          <p className="text-lg font-bold tracking-wide text-carbon-950">
            CCR <span className="font-normal">COOL CASE REPAIR</span>
          </p>
          <p className="text-xs text-carbon-500">
            {BUSINESS.address.line1}, {BUSINESS.address.line2},{" "}
            {BUSINESS.address.suburb} {BUSINESS.address.state}{" "}
            {BUSINESS.address.postcode}
          </p>
          <p className="text-xs text-carbon-500">
            {BUSINESS.phone} &middot; {BUSINESS.email}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-carbon-950">
            Repair intake &amp; condition report
          </p>
          <p className="text-xs text-carbon-500">
            Job #{props.id.slice(-8).toUpperCase()}
          </p>
          <p className="text-xs text-carbon-500">
            Checked in {formatDateTime(props.createdAt)}
          </p>
        </div>
      </header>
    </>
  );
}
