import { formatAud, formatDateTime } from "@/lib/utils";
import { statusLabel, warrantyLabel } from "@/components/staff/ui";
import { IntakeDetailRow } from "./IntakeDetailRow";
import { intakePartQualityLabel } from "./quality";

type CustomerSummary = {
  readonly name: string;
  readonly phone: string;
  readonly email: string | null;
  readonly suburb: string | null;
};

type DeviceSummary = {
  readonly deviceType: string;
  readonly brand: string;
  readonly model: string;
  readonly imei: string | null;
  readonly serialNo: string | null;
  readonly accessories: string | null;
};

type JobSummary = {
  readonly repairs: readonly string[];
  readonly partQuality: string | null;
  readonly warrantyDays: number | null;
  readonly quotedPrice: number | null;
  readonly pricingSource: string;
  readonly matchedPartId: string | null;
  readonly depositPaid: boolean;
  readonly status: string;
  readonly completedAt: Date | null;
  readonly staffName: string;
};

type IntakeDetailSummaryProps = {
  readonly customer: CustomerSummary;
  readonly device: DeviceSummary;
  readonly job: JobSummary;
};

export function IntakeDetailSummary(props: IntakeDetailSummaryProps) {
  return (
    <div className="space-y-6 print:space-y-4">
      <CustomerSection customer={props.customer} />
      <DeviceSection device={props.device} />
      <JobSection job={props.job} />
    </div>
  );
}

function CustomerSection({ customer }: { readonly customer: CustomerSummary }) {
  return (
    <section className="card print:rounded-none print:border-slate-300 print:p-4 print:shadow-none">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-carbon-500">
        Customer
      </h2>
      <dl className="space-y-1.5 text-sm">
        <IntakeDetailRow label="Name" value={customer.name} />
        <IntakeDetailRow label="Phone" value={customer.phone} />
        <IntakeDetailRow label="Email" value={customer.email ?? "\u2014"} />
        <IntakeDetailRow label="Suburb" value={customer.suburb ?? "\u2014"} />
      </dl>
    </section>
  );
}

function DeviceSection({ device }: { readonly device: DeviceSummary }) {
  return (
    <section className="card print:rounded-none print:border-slate-300 print:p-4 print:shadow-none">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-carbon-500">
        Device
      </h2>
      <dl className="space-y-1.5 text-sm">
        <IntakeDetailRow label="Type" value={device.deviceType} />
        <IntakeDetailRow
          label="Brand / model"
          value={`${device.brand} ${device.model}`}
        />
        <IntakeDetailRow label="IMEI" value={device.imei ?? "\u2014"} />
        <IntakeDetailRow label="Serial no." value={device.serialNo ?? "\u2014"} />
        <IntakeDetailRow
          label="Accessories left"
          value={device.accessories ?? "None"}
        />
      </dl>
    </section>
  );
}

function JobSection({ job }: { readonly job: JobSummary }) {
  return (
    <section className="card print:rounded-none print:border-slate-300 print:p-4 print:shadow-none">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-carbon-500">
        Job &amp; pricing
      </h2>
      <dl className="space-y-1.5 text-sm">
        <IntakeDetailRow
          label="Repairs"
          value={job.repairs.join(", ") || "\u2014"}
        />
        <IntakeDetailRow
          label="Part quality"
          value={intakePartQualityLabel(job.partQuality)}
        />
        <IntakeDetailRow
          label="Warranty"
          value={
            job.warrantyDays !== null ? warrantyLabel(job.warrantyDays) : "\u2014"
          }
        />
        <IntakeDetailRow
          label="Quoted price"
          value={
            job.quotedPrice !== null ? formatAud(job.quotedPrice) : "To be confirmed"
          }
        />
        <IntakeDetailRow
          label="Pricing source"
          value={pricingSourceLabel(job.pricingSource)}
        />
        {job.matchedPartId && (
          <IntakeDetailRow label="Matched part" value={job.matchedPartId} />
        )}
        <IntakeDetailRow
          label="Deposit paid"
          value={job.depositPaid ? "Yes" : "No"}
        />
        <IntakeDetailRow label="Status" value={statusLabel(job.status)} />
        <IntakeDetailRow
          label="Completed"
          value={job.completedAt ? formatDateTime(job.completedAt) : "\u2014"}
        />
        <IntakeDetailRow label="Staff member" value={job.staffName} />
      </dl>
    </section>
  );
}

function pricingSourceLabel(source: string): string {
  if (source === "MATCHED") return "Matched catalog";
  if (source === "MANUAL") return "Manual quote";
  return source;
}
