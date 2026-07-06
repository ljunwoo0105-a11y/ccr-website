"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, UserCheck, X } from "lucide-react";
import {
  DEVICE_TYPES,
  PART_QUALITIES,
  QUALITY_LABELS,
  QUALITY_DEFAULT_WARRANTY,
} from "@/lib/config";
import type { PreCondition } from "@/lib/validation";
import {
  COSMETIC_GRADES,
  PRE_CONDITION_GROUPS,
  defaultPreCondition,
  type PreConditionBooleanKey,
} from "@/components/staff/precondition";
import type { ApiEnvelope, CustomerMatch } from "@/components/staff/types";

const COMMON_REPAIRS = [
  "Screen Replacement",
  "Battery Replacement",
  "Charging Port Repair",
  "Back Glass Replacement",
  "Camera Repair",
  "Water Damage Assessment",
  "Data Recovery",
  "Software Fix",
  "Other",
];

export default function IntakeForm() {
  const router = useRouter();

  // Customer
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [suburb, setSuburb] = useState("");
  const [matches, setMatches] = useState<CustomerMatch[]>([]);
  const [matchesOpen, setMatchesOpen] = useState(false);
  const lookupIdRef = useRef(0);

  // Device
  const [deviceType, setDeviceType] = useState("Phone");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [imei, setImei] = useState("");
  const [serialNo, setSerialNo] = useState("");

  // Repairs
  const [repairs, setRepairs] = useState<string[]>([]);
  const [customRepair, setCustomRepair] = useState("");

  // Pre-condition
  const [pre, setPre] = useState<PreCondition>(defaultPreCondition());
  const [batteryHealth, setBatteryHealth] = useState("");

  // Notes
  const [accessories, setAccessories] = useState("");
  const [conditionNotes, setConditionNotes] = useState("");

  // Job
  const [partQuality, setPartQuality] = useState("");
  const [warrantyDays, setWarrantyDays] = useState("");
  const [quotedPrice, setQuotedPrice] = useState("");
  const [depositPaid, setDepositPaid] = useState("");

  // Acknowledgement
  const [signature, setSignature] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Lookup existing customers by phone as the staff member types.
  useEffect(() => {
    const trimmed = phone.trim();
    if (trimmed.length < 3) {
      setMatches([]);
      setMatchesOpen(false);
      return;
    }
    const lookupId = ++lookupIdRef.current;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/staff/customers?phone=${encodeURIComponent(trimmed)}`
        );
        const json = (await res.json()) as ApiEnvelope<CustomerMatch[]>;
        if (lookupId !== lookupIdRef.current) return;
        if (res.ok && json.ok && json.data) {
          setMatches(json.data);
          setMatchesOpen(json.data.length > 0);
        }
      } catch {
        /* lookup is best-effort */
      }
    }, 300);
    return () => clearTimeout(t);
  }, [phone]);

  function applyMatch(match: CustomerMatch) {
    setPhone(match.phone);
    setName(match.name);
    setEmail(match.email ?? "");
    setSuburb(match.suburb ?? "");
    setMatches([]);
    setMatchesOpen(false);
    lookupIdRef.current += 1; // cancel any in-flight lookup
  }

  function toggleRepair(repair: string) {
    setRepairs((prev) =>
      prev.includes(repair)
        ? prev.filter((r) => r !== repair)
        : [...prev, repair]
    );
  }

  function addCustomRepair() {
    const value = customRepair.trim();
    if (!value) return;
    if (!repairs.includes(value)) setRepairs((prev) => [...prev, value]);
    setCustomRepair("");
  }

  function setBool(key: PreConditionBooleanKey, value: boolean) {
    setPre((prev) => ({ ...prev, [key]: value }));
  }

  function handleQualityChange(next: string) {
    setPartQuality(next);
    if (next && QUALITY_DEFAULT_WARRANTY[next] !== undefined) {
      setWarrantyDays(String(QUALITY_DEFAULT_WARRANTY[next]));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (repairs.length === 0) {
      setError("Select at least one repair type.");
      return;
    }
    setBusy(true);
    try {
      const preCondition: PreCondition = {
        ...pre,
        batteryHealthPct:
          batteryHealth.trim() === ""
            ? null
            : Math.round(Number(batteryHealth)),
      };
      const payload: Record<string, unknown> = {
        customer: {
          name: name.trim(),
          phone: phone.trim(),
          ...(email.trim() ? { email: email.trim() } : {}),
          ...(suburb.trim() ? { suburb: suburb.trim() } : {}),
        },
        deviceType,
        brand: brand.trim(),
        model: model.trim(),
        ...(imei.trim() ? { imei: imei.trim() } : {}),
        ...(serialNo.trim() ? { serialNo: serialNo.trim() } : {}),
        repairTypes: repairs,
        preCondition,
        ...(accessories.trim() ? { accessories: accessories.trim() } : {}),
        ...(conditionNotes.trim()
          ? { conditionNotes: conditionNotes.trim() }
          : {}),
        ...(partQuality ? { partQuality } : {}),
        ...(warrantyDays.trim() !== ""
          ? { warrantyDays: Math.round(Number(warrantyDays)) }
          : {}),
        ...(quotedPrice.trim() !== ""
          ? { quotedPrice: Number(quotedPrice) }
          : {}),
        ...(depositPaid.trim() !== ""
          ? { depositPaid: Number(depositPaid) }
          : {}),
        customerSignature: signature.trim(),
      };
      const res = await fetch("/api/staff/intakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as ApiEnvelope<{ id: string }>;
      if (!res.ok || !json.ok || !json.data) {
        setError(json.error ?? "Could not save the intake");
        setBusy(false);
        return;
      }
      router.push(`/staff/intake/${json.data.id}`);
    } catch {
      setError("Network error — try again");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
        >
          {error}
        </p>
      )}

      {/* Customer */}
      <section className="card">
        <h2 className="mb-4 text-base font-semibold text-slate-900">
          Customer
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="relative">
            <label htmlFor="in-phone" className="label">
              Phone
            </label>
            <input
              id="in-phone"
              className="input"
              required
              inputMode="tel"
              placeholder="04xx xxx xxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="off"
            />
            {matchesOpen && (
              <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                {matches.map((match) => (
                  <li key={match.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
                      onClick={() => applyMatch(match)}
                    >
                      <UserCheck
                        className="h-4 w-4 shrink-0 text-emerald-600"
                        aria-hidden
                      />
                      <span>
                        <span className="font-medium text-slate-900">
                          {match.name}
                        </span>{" "}
                        <span className="text-slate-500">
                          {match.phone}
                          {match.suburb ? ` · ${match.suburb}` : ""}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <label htmlFor="in-name" className="label">
              Full name
            </label>
            <input
              id="in-name"
              className="input"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="in-email" className="label">
              Email <span className="text-slate-400">(optional)</span>
            </label>
            <input
              id="in-email"
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="in-suburb" className="label">
              Suburb <span className="text-slate-400">(optional)</span>
            </label>
            <input
              id="in-suburb"
              className="input"
              value={suburb}
              onChange={(e) => setSuburb(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Device */}
      <section className="card">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Device</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="in-device" className="label">
              Device type
            </label>
            <select
              id="in-device"
              className="input"
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
            >
              {DEVICE_TYPES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="in-brand" className="label">
              Brand
            </label>
            <input
              id="in-brand"
              className="input"
              required
              placeholder="Apple"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="in-model" className="label">
              Model
            </label>
            <input
              id="in-model"
              className="input"
              required
              placeholder="iPhone 14 Pro"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="in-imei" className="label">
              IMEI <span className="text-slate-400">(optional)</span>
            </label>
            <input
              id="in-imei"
              className="input"
              value={imei}
              onChange={(e) => setImei(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="in-serial" className="label">
              Serial no. <span className="text-slate-400">(optional)</span>
            </label>
            <input
              id="in-serial"
              className="input"
              value={serialNo}
              onChange={(e) => setSerialNo(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Repairs */}
      <section className="card">
        <h2 className="mb-1 text-base font-semibold text-slate-900">Repairs</h2>
        <p className="mb-4 text-sm text-slate-500">
          Select everything being done on this job.
        </p>
        <div className="flex flex-wrap gap-2">
          {COMMON_REPAIRS.map((repair) => {
            const selected = repairs.includes(repair);
            return (
              <button
                key={repair}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleRepair(repair)}
                className={
                  selected
                    ? "rounded-full border border-ccr-primary bg-ccr-primary px-3 py-1.5 text-sm font-medium text-white"
                    : "rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-ccr-primary hover:text-ccr-primary"
                }
              >
                {repair}
              </button>
            );
          })}
          {repairs
            .filter((r) => !COMMON_REPAIRS.includes(r))
            .map((repair) => (
              <span
                key={repair}
                className="inline-flex items-center gap-1.5 rounded-full border border-ccr-primary bg-ccr-primary px-3 py-1.5 text-sm font-medium text-white"
              >
                {repair}
                <button
                  type="button"
                  aria-label={`Remove ${repair}`}
                  onClick={() => toggleRepair(repair)}
                  className="rounded-full hover:bg-white/20"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </span>
            ))}
        </div>
        <div className="mt-4 flex max-w-sm gap-2">
          <input
            className="input"
            placeholder="Add a custom repair…"
            aria-label="Custom repair type"
            value={customRepair}
            onChange={(e) => setCustomRepair(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomRepair();
              }
            }}
          />
          <button
            type="button"
            className="btn-ghost px-3 py-2"
            onClick={addCustomRepair}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add
          </button>
        </div>
      </section>

      {/* Pre-repair condition */}
      <section className="card">
        <h2 className="mb-1 text-base font-semibold text-slate-900">
          Pre-repair condition
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          Check each item with the customer before the device leaves the
          counter.
        </p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {PRE_CONDITION_GROUPS.map((group) => (
            <fieldset key={group.title}>
              <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {group.title}
              </legend>
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {group.fields.map((field) => {
                  const checked = pre[field.key];
                  return (
                    <label
                      key={field.key}
                      className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5"
                    >
                      <span className="text-sm text-slate-700">
                        {field.label}
                      </span>
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={checked}
                        onChange={(e) => setBool(field.key, e.target.checked)}
                      />
                      <span
                        aria-hidden
                        className="relative h-6 w-11 shrink-0 rounded-full bg-slate-300 transition peer-checked:bg-ccr-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ccr-primary/50 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5"
                      />
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <fieldset>
            <legend className="label">Cosmetic grade</legend>
            <div className="flex flex-wrap gap-2">
              {COSMETIC_GRADES.map((grade) => (
                <label
                  key={grade.value}
                  className={
                    pre.cosmeticGrade === grade.value
                      ? "cursor-pointer rounded-lg border border-ccr-primary bg-ccr-primary/10 px-3 py-2 text-sm font-semibold text-ccr-primary"
                      : "cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400"
                  }
                >
                  <input
                    type="radio"
                    name="cosmeticGrade"
                    value={grade.value}
                    className="sr-only"
                    checked={pre.cosmeticGrade === grade.value}
                    onChange={() =>
                      setPre((prev) => ({
                        ...prev,
                        cosmeticGrade: grade.value,
                      }))
                    }
                  />
                  {grade.label}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="in-battery" className="label">
              Battery health % <span className="text-slate-400">(optional)</span>
            </label>
            <input
              id="in-battery"
              className="input max-w-[140px]"
              type="number"
              min={0}
              max={100}
              step={1}
              value={batteryHealth}
              onChange={(e) => setBatteryHealth(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Accessories & notes */}
      <section className="card">
        <h2 className="mb-4 text-base font-semibold text-slate-900">
          Accessories &amp; notes
        </h2>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label htmlFor="in-accessories" className="label">
              Accessories left with the device{" "}
              <span className="text-slate-400">(optional)</span>
            </label>
            <input
              id="in-accessories"
              className="input"
              placeholder="Case, SIM tray pin, charging cable…"
              value={accessories}
              onChange={(e) => setAccessories(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="in-notes" className="label">
              Condition notes <span className="text-slate-400">(optional)</span>
            </label>
            <textarea
              id="in-notes"
              className="input min-h-[80px]"
              placeholder="Scratches on the frame, dent on the corner…"
              value={conditionNotes}
              onChange={(e) => setConditionNotes(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Job */}
      <section className="card">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Job</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label htmlFor="in-quality" className="label">
              Part quality
            </label>
            <select
              id="in-quality"
              className="input"
              value={partQuality}
              onChange={(e) => handleQualityChange(e.target.value)}
            >
              <option value="">Not decided</option>
              {PART_QUALITIES.map((q) => (
                <option key={q} value={q}>
                  {QUALITY_LABELS[q]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="in-warranty" className="label">
              Warranty (days)
            </label>
            <input
              id="in-warranty"
              className="input"
              type="number"
              min={0}
              step={1}
              value={warrantyDays}
              onChange={(e) => setWarrantyDays(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="in-quoted" className="label">
              Quoted price (AUD)
            </label>
            <input
              id="in-quoted"
              className="input"
              type="number"
              min={0}
              step="0.01"
              value={quotedPrice}
              onChange={(e) => setQuotedPrice(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="in-deposit" className="label">
              Deposit paid (AUD)
            </label>
            <input
              id="in-deposit"
              className="input"
              type="number"
              min={0}
              step="0.01"
              value={depositPaid}
              onChange={(e) => setDepositPaid(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Acknowledgement */}
      <section className="card">
        <h2 className="mb-2 text-base font-semibold text-slate-900">
          Customer acknowledgement
        </h2>
        <p className="mb-4 rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
          I confirm the condition record above is accurate. I understand that
          repairs may reveal further faults not visible before teardown, and
          that the quoted price may change after inspection — any change will
          be discussed with me for approval before proceeding. I understand I
          should back up my data before the repair and that CCR Cool Case
          Repair is not responsible for any loss of data.
        </p>
        <div className="max-w-sm">
          <label htmlFor="in-signature" className="label">
            Customer types full name to confirm the condition record is
            accurate
          </label>
          <input
            id="in-signature"
            className="input"
            required
            placeholder="Full name"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
          />
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          className="btn-ghost"
          onClick={() => router.push("/staff/intake")}
        >
          Cancel
        </button>
        <button type="submit" className="btn-secondary" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Check device in
        </button>
      </div>
    </form>
  );
}
