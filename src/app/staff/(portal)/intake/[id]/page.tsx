import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, X } from "lucide-react";
import { db } from "@/lib/db";
import { BUSINESS, QUALITY_LABELS } from "@/lib/config";
import { formatAud, formatDateTime } from "@/lib/utils";
import { intakeStatusBadge, statusLabel, warrantyLabel } from "@/components/staff/ui";
import { parseJsonStringArray } from "@/components/staff/types";
import {
  PRE_CONDITION_GROUPS,
  cosmeticGradeLabel,
  parsePreCondition,
} from "@/components/staff/precondition";
import IntakeActions from "@/components/staff/IntakeActions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Intake Report", robots: { index: false } };

export default async function IntakeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const intake = await db.repairIntake.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      staff: { select: { name: true } },
    },
  });
  if (!intake) notFound();

  const repairs = parseJsonStringArray(intake.repairTypes);
  const pre = parsePreCondition(intake.preCondition);

  return (
    <div className="space-y-6 print:space-y-4 print:text-[12px]">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/staff/intake"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          All intakes
        </Link>
        <span className={intakeStatusBadge(intake.status)}>
          {statusLabel(intake.status)}
        </span>
      </div>

      {/* Shop header — looks right on screen, mandatory for the printout. */}
      <header className="card flex flex-wrap items-start justify-between gap-4 print:rounded-none print:border-0 print:border-b print:border-slate-300 print:p-0 print:pb-4 print:shadow-none">
        <div>
          <p className="text-lg font-bold tracking-wide text-slate-900">
            CCR <span className="font-normal">COOL CASE REPAIR</span>
          </p>
          <p className="text-xs text-slate-500">
            {BUSINESS.address.line1}, {BUSINESS.address.line2},{" "}
            {BUSINESS.address.suburb} {BUSINESS.address.state}{" "}
            {BUSINESS.address.postcode}
          </p>
          <p className="text-xs text-slate-500">
            {BUSINESS.phone} · {BUSINESS.email}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-900">
            Repair intake &amp; condition report
          </p>
          <p className="text-xs text-slate-500">
            Job #{intake.id.slice(-8).toUpperCase()}
          </p>
          <p className="text-xs text-slate-500">
            Checked in {formatDateTime(intake.createdAt)}
          </p>
        </div>
      </header>

      <IntakeActions id={intake.id} status={intake.status} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 print:grid-cols-2 print:gap-4">
        {/* Left column */}
        <div className="space-y-6 print:space-y-4">
          <section className="card print:rounded-none print:border-slate-300 print:p-4 print:shadow-none">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Customer
            </h2>
            <dl className="space-y-1.5 text-sm">
              <Row label="Name" value={intake.customer.name} />
              <Row label="Phone" value={intake.customer.phone} />
              <Row label="Email" value={intake.customer.email ?? "—"} />
              <Row label="Suburb" value={intake.customer.suburb ?? "—"} />
            </dl>
          </section>

          <section className="card print:rounded-none print:border-slate-300 print:p-4 print:shadow-none">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Device
            </h2>
            <dl className="space-y-1.5 text-sm">
              <Row label="Type" value={intake.deviceType} />
              <Row label="Brand / model" value={`${intake.brand} ${intake.model}`} />
              <Row label="IMEI" value={intake.imei ?? "—"} />
              <Row label="Serial no." value={intake.serialNo ?? "—"} />
              <Row label="Accessories left" value={intake.accessories ?? "None"} />
            </dl>
          </section>

          <section className="card print:rounded-none print:border-slate-300 print:p-4 print:shadow-none">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Job &amp; pricing
            </h2>
            <dl className="space-y-1.5 text-sm">
              <Row label="Repairs" value={repairs.join(", ") || "—"} />
              <Row
                label="Part quality"
                value={
                  intake.partQuality
                    ? QUALITY_LABELS[
                        intake.partQuality as keyof typeof QUALITY_LABELS
                      ] ?? intake.partQuality
                    : "Not decided"
                }
              />
              <Row
                label="Warranty"
                value={
                  intake.warrantyDays !== null
                    ? warrantyLabel(intake.warrantyDays)
                    : "—"
                }
              />
              <Row
                label="Quoted price"
                value={
                  intake.quotedPrice !== null
                    ? formatAud(intake.quotedPrice)
                    : "To be confirmed"
                }
              />
              <Row
                label="Deposit paid"
                value={
                  intake.depositPaid !== null
                    ? formatAud(intake.depositPaid)
                    : "—"
                }
              />
              <Row label="Status" value={statusLabel(intake.status)} />
              <Row
                label="Completed"
                value={
                  intake.completedAt ? formatDateTime(intake.completedAt) : "—"
                }
              />
              <Row label="Staff member" value={intake.staff.name} />
            </dl>
          </section>
        </div>

        {/* Right column — condition checklist */}
        <div className="space-y-6 print:space-y-4">
          <section className="card print:rounded-none print:border-slate-300 print:p-4 print:shadow-none">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Pre-repair condition
            </h2>
            {!pre && (
              <p className="text-sm text-slate-500">
                Condition record could not be read.
              </p>
            )}
            {pre && (
              <div className="space-y-4">
                {PRE_CONDITION_GROUPS.map((group) => (
                  <div key={group.title}>
                    <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {group.title}
                    </h3>
                    <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 print:border-slate-300">
                      {group.fields.map((field) => {
                        const value = Boolean(pre[field.key]);
                        return (
                          <li
                            key={field.key}
                            className="flex items-center justify-between gap-3 px-3 py-1.5 text-sm"
                          >
                            <span className="text-slate-700">{field.label}</span>
                            {value ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                                <Check className="h-4 w-4" aria-hidden /> Yes
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-semibold text-slate-500">
                                <X className="h-4 w-4" aria-hidden /> No
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
                <dl className="space-y-1.5 text-sm">
                  <Row
                    label="Cosmetic grade"
                    value={cosmeticGradeLabel(pre.cosmeticGrade)}
                  />
                  <Row
                    label="Battery health"
                    value={
                      pre.batteryHealthPct !== null &&
                      pre.batteryHealthPct !== undefined
                        ? `${pre.batteryHealthPct}%`
                        : "Not recorded"
                    }
                  />
                </dl>
              </div>
            )}
          </section>

          {intake.conditionNotes && (
            <section className="card print:rounded-none print:border-slate-300 print:p-4 print:shadow-none">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Condition notes
              </h2>
              <p className="whitespace-pre-wrap text-sm text-slate-700">
                {intake.conditionNotes}
              </p>
            </section>
          )}

          <section className="card print:rounded-none print:border-slate-300 print:p-4 print:shadow-none">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Customer acknowledgement
            </h2>
            <p className="mb-3 text-xs leading-relaxed text-slate-500">
              The customer confirmed the condition record is accurate, and
              acknowledged that repairs may reveal further faults, that the
              quoted price may change after teardown (with approval before
              proceeding), that data should be backed up beforehand, and that{" "}
              {BUSINESS.name} is not responsible for data loss.
            </p>
            <p className="text-sm text-slate-700">
              Signed (typed):{" "}
              <span className="font-semibold text-slate-900">
                {intake.customerSignature ?? "—"}
              </span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {formatDateTime(intake.createdAt)}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{value}</dd>
    </div>
  );
}
