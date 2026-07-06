import "server-only";
import nodemailer from "nodemailer";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { BUSINESS, SITE_URL } from "@/lib/config";
import { formatAud, applyDiscount, discountLabel } from "@/lib/utils";

/**
 * Outgoing email. With SMTP_* configured, sends via SMTP. Without it (local
 * dev), each email is written to var/outbox/<timestamp>.html so the team can
 * preview exactly what customers would receive.
 */

interface SendArgs {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendArgs): Promise<void> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT ?? 587),
      secure: Number(SMTP_PORT ?? 587) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    await transporter.sendMail({
      from: SMTP_FROM ?? `${BUSINESS.name} <${BUSINESS.email}>`,
      to,
      subject,
      html,
    });
    return;
  }

  // Dev fallback: write to var/outbox for preview.
  const outDir = path.join(process.cwd(), "var", "outbox");
  await mkdir(outDir, { recursive: true });
  const file = path.join(
    outDir,
    `${Date.now()}-${to.replace(/[^a-z0-9@.]/gi, "_")}.html`
  );
  await writeFile(file, `<!-- to: ${to} | subject: ${subject} -->\n${html}`);
  console.info(`[email] SMTP not configured — wrote preview to ${file}`);
}

interface QuoteEmailArgs {
  name: string;
  brand: string;
  model: string;
  repairType: string;
  /** Cheapest-tier price. Null → "inspection required" wording. */
  fromPrice: number | null;
}

/**
 * The estimate email. Deliberately shows ONE "from" price (cheapest quality
 * tier) and pushes an in-store inspection for the accurate figure — per
 * business policy, per-tier pricing is never disclosed in writing.
 */
export function renderQuoteEmail({
  name,
  brand,
  model,
  repairType,
  fromPrice,
}: QuoteEmailArgs): { subject: string; html: string } {
  const priceBlock =
    fromPrice !== null
      ? `<p style="margin:0 0 6px;font-size:15px;color:#334155;">Estimated price for your repair:</p>
         <p style="margin:0;font-size:34px;font-weight:700;color:#0b4fa3;">from ${formatAud(fromPrice)}<span style="font-size:15px;color:#64748b;font-weight:400;">*</span></p>
         <p style="margin:10px 0 0;font-size:13px;color:#64748b;">*Starting price using our most affordable part option. Bring your device in for a <strong>free inspection</strong> to get an accurate quote — we'll walk you through part quality and warranty options in store.</p>`
      : `<p style="margin:0;font-size:18px;font-weight:600;color:#0b4fa3;">This repair needs a quick look first.</p>
         <p style="margin:10px 0 0;font-size:14px;color:#475569;">Bring your device in for a <strong>free inspection</strong> and we'll give you an exact price on the spot — most inspections take just a few minutes.</p>`;

  const address = `${BUSINESS.address.line1}, ${BUSINESS.address.line2}, ${BUSINESS.address.suburb} ${BUSINESS.address.state} ${BUSINESS.address.postcode}`;

  const html = `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Segoe UI,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <div style="background:linear-gradient(135deg,#0b4fa3,#1273cf);border-radius:12px 12px 0 0;padding:22px 28px;">
      <p style="margin:0;font-size:20px;font-weight:800;color:#ffffff;letter-spacing:1px;">CCR <span style="font-weight:400;">COOL CASE REPAIR</span></p>
      <p style="margin:4px 0 0;font-size:12px;color:#cfe3ff;">Springfield Central's device repair specialists</p>
    </div>
    <div style="background:#ffffff;padding:28px;border:1px solid #e2e8f0;border-top:none;">
      <p style="margin:0 0 14px;font-size:15px;color:#0f172a;">Hi ${escapeHtml(name)},</p>
      <p style="margin:0 0 18px;font-size:14px;color:#475569;">Thanks for your quote request for your <strong>${escapeHtml(brand)} ${escapeHtml(model)}</strong> — <strong>${escapeHtml(repairType)}</strong>.</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px 22px;margin:0 0 20px;">
        ${priceBlock}
      </div>
      <p style="margin:0 0 6px;font-size:14px;color:#475569;">Why get inspected in store?</p>
      <ul style="margin:0 0 18px;padding-left:18px;font-size:13px;color:#475569;line-height:1.7;">
        <li>Exact pricing across part quality options (with warranty up to 12 months)</li>
        <li>Most repairs done on the spot while you wait</li>
        <li>Price Beat Guarantee on comparable quotes</li>
      </ul>
      <a href="${BUSINESS.googleMapsUrl}" style="display:inline-block;background:#e8542f;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 22px;border-radius:8px;">Get directions to our store</a>
      <p style="margin:20px 0 0;font-size:13px;color:#475569;">Or call/text us on <a href="${BUSINESS.phoneHref}" style="color:#0b4fa3;font-weight:600;">${BUSINESS.phone}</a> — mention this email.</p>
    </div>
    <div style="background:#0f172a;border-radius:0 0 12px 12px;padding:18px 28px;">
      <p style="margin:0;font-size:12px;color:#94a3b8;">${BUSINESS.name} · ${address}</p>
      <p style="margin:6px 0 0;font-size:11px;color:#64748b;">This estimate is valid for 14 days and may change after physical inspection. <a href="${SITE_URL}/privacy" style="color:#94a3b8;">Privacy</a></p>
    </div>
  </div>
</body>
</html>`;

  return {
    subject: `Your repair estimate — ${brand} ${model} ${repairType}`,
    html,
  };
}

interface RepairFormLine {
  repairType: string;
  qualityLabel: string;
  colour?: string | null;
  warrantyDays?: number | null;
  listPrice: number;
  discountType?: string | null;
  discountValue?: number | null;
}

interface RepairFormEmailArgs {
  name: string;
  brand: string;
  model: string;
  items: RepairFormLine[];
  total: number;
  conditionNotes?: string | null;
}

function warrantyText(days: number | null | undefined): string {
  if (!days || days <= 0) return "";
  if (days >= 360) return `${Math.round(days / 30.4)}-mo warranty`;
  if (days >= 30 && days % 30 === 0) return `${days / 30}-mo warranty`;
  return `${days}-day warranty`;
}

/**
 * The in-store repair-form email. Unlike renderQuoteEmail (public — cheapest
 * "from" price only), this is generated by staff at the counter for specific
 * part choices, so it discloses the EXACT agreed price per repair line and the
 * combined total. One device may carry several repairs (screen + battery + …).
 * Only ever sent for staff-created RepairForm records.
 */
export function renderRepairFormEmail({
  name,
  brand,
  model,
  items,
  total,
  conditionNotes,
}: RepairFormEmailArgs): { subject: string; html: string } {
  const address = `${BUSINESS.address.line1}, ${BUSINESS.address.line2}, ${BUSINESS.address.suburb} ${BUSINESS.address.state} ${BUSINESS.address.postcode}`;

  const itemRows = items
    .map((it) => {
      const meta = [
        it.qualityLabel,
        it.colour ? escapeHtml(it.colour) : "",
        warrantyText(it.warrantyDays),
      ]
        .filter(Boolean)
        .join(" · ");
      const net = applyDiscount(it.listPrice, it.discountType, it.discountValue);
      const label = discountLabel(it.discountType, it.discountValue);
      const priceCell =
        net < it.listPrice
          ? `<span style="color:#94a3b8;text-decoration:line-through;font-weight:400;font-size:12px;">${formatAud(it.listPrice)}</span>
             <span style="display:block;">${formatAud(net)}</span>
             <span style="display:block;color:#16a34a;font-size:11px;font-weight:600;">${escapeHtml(label)}</span>`
          : `${formatAud(net)}`;
      return `<tr>
        <td style="padding:9px 0;font-size:13px;color:#0f172a;vertical-align:top;">
          <strong>${escapeHtml(it.repairType)}</strong>
          <span style="display:block;font-size:11px;color:#64748b;">${meta}</span>
        </td>
        <td style="padding:9px 0;font-size:13px;color:#0f172a;text-align:right;font-weight:600;vertical-align:top;white-space:nowrap;">${priceCell}</td>
      </tr>`;
    })
    .join("");

  const savings =
    Math.round(
      items.reduce(
        (s, it) =>
          s +
          (it.listPrice -
            applyDiscount(it.listPrice, it.discountType, it.discountValue)),
        0
      ) * 100
    ) / 100;
  const savingsRow =
    savings > 0
      ? `<div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:6px;">
           <span style="font-size:12px;color:#16a34a;">You save</span>
           <span style="font-size:13px;font-weight:600;color:#16a34a;">${formatAud(savings)}</span>
         </div>`
      : "";

  const summary =
    items.length === 1
      ? items[0]!.repairType
      : `${items.length} repairs`;

  const conditionBlock = conditionNotes
    ? `<p style="margin:0 0 6px;font-size:13px;color:#475569;font-weight:600;">Device condition noted in store</p>
       <p style="margin:0 0 18px;font-size:13px;color:#475569;line-height:1.6;">${escapeHtml(conditionNotes)}</p>`
    : "";

  const html = `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Segoe UI,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <div style="background:linear-gradient(135deg,#0b4fa3,#1273cf);border-radius:12px 12px 0 0;padding:22px 28px;">
      <p style="margin:0;font-size:20px;font-weight:800;color:#ffffff;letter-spacing:1px;">CCR <span style="font-weight:400;">COOL CASE REPAIR</span></p>
      <p style="margin:4px 0 0;font-size:12px;color:#cfe3ff;">Your repair quote</p>
    </div>
    <div style="background:#ffffff;padding:28px;border:1px solid #e2e8f0;border-top:none;">
      <p style="margin:0 0 14px;font-size:15px;color:#0f172a;">Hi ${escapeHtml(name)},</p>
      <p style="margin:0 0 18px;font-size:14px;color:#475569;">Here's the repair quote we put together in store for your <strong>${escapeHtml(brand)} ${escapeHtml(model)}</strong>.</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px 22px;margin:0 0 20px;">
        <table style="width:100%;border-collapse:collapse;">${itemRows}</table>
        ${savingsRow}
        <div style="border-top:1px solid #e2e8f0;margin-top:8px;padding-top:14px;display:flex;justify-content:space-between;align-items:baseline;">
          <span style="font-size:13px;color:#475569;">Total</span>
          <span style="font-size:30px;font-weight:700;color:#0b4fa3;">${formatAud(total)}</span>
        </div>
      </div>
      ${conditionBlock}
      <p style="margin:0 0 6px;font-size:14px;color:#475569;">Ready to go ahead?</p>
      <ul style="margin:0 0 18px;padding-left:18px;font-size:13px;color:#475569;line-height:1.7;">
        <li>Most repairs are completed on the spot while you wait</li>
        <li>Backed by our parts &amp; workmanship warranty</li>
        <li>Price Beat Guarantee on comparable written quotes</li>
      </ul>
      <a href="${BUSINESS.googleMapsUrl}" style="display:inline-block;background:#e8542f;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 22px;border-radius:8px;">Get directions to our store</a>
      <p style="margin:20px 0 0;font-size:13px;color:#475569;">Questions? Call or text us on <a href="${BUSINESS.phoneHref}" style="color:#0b4fa3;font-weight:600;">${BUSINESS.phone}</a>.</p>
    </div>
    <div style="background:#0f172a;border-radius:0 0 12px 12px;padding:18px 28px;">
      <p style="margin:0;font-size:12px;color:#94a3b8;">${BUSINESS.name} · ${address}</p>
      <p style="margin:6px 0 0;font-size:11px;color:#64748b;">This quote is valid for 14 days and may change if the device condition differs on inspection. <a href="${SITE_URL}/privacy" style="color:#94a3b8;">Privacy</a></p>
    </div>
  </div>
</body>
</html>`;

  return {
    subject: `Your repair quote — ${brand} ${model} (${summary})`,
    html,
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
