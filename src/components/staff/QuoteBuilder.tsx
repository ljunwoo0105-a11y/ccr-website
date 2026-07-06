"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Check,
  ChevronRight,
  Loader2,
  Mail,
  Pencil,
  Percent,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { QUALITY_LABELS } from "@/lib/config";
import { formatAud, cn, applyDiscount, discountLabel } from "@/lib/utils";

type DiscountType = "PERCENT" | "AMOUNT";
import {
  PRE_CONDITION_GROUPS,
  COSMETIC_GRADES,
  defaultPreCondition,
} from "@/components/staff/precondition";
import type { PreCondition } from "@/lib/validation";

interface PartOption {
  id: string;
  quality: string;
  colour: string | null;
  sellPrice: number;
  warrantyDays: number;
  stockQty: number;
}

interface LineItem {
  partId: string;
  repairType: string;
  quality: string;
  colour: string | null;
  sellPrice: number;
  warrantyDays: number;
  discountType: DiscountType | null;
  discountValue: number | null;
}

interface ApiEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

const STANDARD = "Standard";

async function fetchCatalog<T>(params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/staff/quote/catalog${qs ? `?${qs}` : ""}`);
  const json = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || !json.ok || json.data === undefined) {
    throw new Error(json.error ?? "Could not load options");
  }
  return json.data;
}

function qualityName(q: string): string {
  return QUALITY_LABELS[q as keyof typeof QUALITY_LABELS] ?? q;
}

function warrantyText(days: number): string {
  if (days >= 360) return `${Math.round(days / 30.4)} mo warranty`;
  if (days >= 30 && days % 30 === 0) return `${days / 30} mo warranty`;
  return `${days} day warranty`;
}

export default function QuoteBuilder() {
  // --- Device cascade -------------------------------------------------------
  const [deviceType, setDeviceType] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");

  const [deviceTypes, setDeviceTypes] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [repairTypes, setRepairTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // --- Repair line items ----------------------------------------------------
  const [items, setItems] = useState<LineItem[]>([]);
  const [discountOpen, setDiscountOpen] = useState<number | null>(null);

  // Current "add a repair" line being built
  const [curRepair, setCurRepair] = useState("");
  const [curQuality, setCurQuality] = useState("");
  const [curColour, setCurColour] = useState("");
  const [lineParts, setLineParts] = useState<PartOption[]>([]);
  const [loadingParts, setLoadingParts] = useState(false);

  // --- Customer + condition -------------------------------------------------
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [conditionNotes, setConditionNotes] = useState("");
  const [includeCondition, setIncludeCondition] = useState(false);
  const [preCondition, setPreCondition] = useState<PreCondition>(
    defaultPreCondition()
  );
  const [sendEmail, setSendEmail] = useState(true);

  // --- Submission -----------------------------------------------------------
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState<{
    total: number;
    emailed: boolean;
    emailError: string | null;
  } | null>(null);

  // --- Cascade loads --------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    setLoading("device");
    setCatalogError(null);
    fetchCatalog<{ deviceTypes: string[] }>({})
      .then((d) => !cancelled && setDeviceTypes(d.deviceTypes))
      .catch((e) => !cancelled && setCatalogError(String(e.message ?? e)))
      .finally(() => !cancelled && setLoading(null));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!deviceType) return;
    let cancelled = false;
    setLoading("brand");
    fetchCatalog<{ brands: string[] }>({ deviceType })
      .then((d) => !cancelled && setBrands(d.brands))
      .catch((e) => !cancelled && setCatalogError(String(e.message ?? e)))
      .finally(() => !cancelled && setLoading(null));
    return () => {
      cancelled = true;
    };
  }, [deviceType]);

  useEffect(() => {
    if (!deviceType || !brand) return;
    let cancelled = false;
    setLoading("model");
    fetchCatalog<{ models: string[] }>({ deviceType, brand })
      .then((d) => !cancelled && setModels(d.models))
      .catch((e) => !cancelled && setCatalogError(String(e.message ?? e)))
      .finally(() => !cancelled && setLoading(null));
    return () => {
      cancelled = true;
    };
  }, [deviceType, brand]);

  useEffect(() => {
    if (!deviceType || !brand || !model) return;
    let cancelled = false;
    setLoading("repair");
    fetchCatalog<{ repairTypes: string[] }>({ deviceType, brand, model })
      .then((d) => !cancelled && setRepairTypes(d.repairTypes))
      .catch((e) => !cancelled && setCatalogError(String(e.message ?? e)))
      .finally(() => !cancelled && setLoading(null));
    return () => {
      cancelled = true;
    };
  }, [deviceType, brand, model]);

  // Parts for the repair currently being added
  useEffect(() => {
    if (!deviceType || !brand || !model || !curRepair) {
      setLineParts([]);
      return;
    }
    let cancelled = false;
    setLoadingParts(true);
    fetchCatalog<{ parts: PartOption[] }>({
      deviceType,
      brand,
      model,
      repairType: curRepair,
    })
      .then((d) => !cancelled && setLineParts(d.parts))
      .catch((e) => !cancelled && setCatalogError(String(e.message ?? e)))
      .finally(() => !cancelled && setLoadingParts(false));
    return () => {
      cancelled = true;
    };
  }, [deviceType, brand, model, curRepair]);

  // --- Derived for the current line ----------------------------------------
  const qualities = useMemo(() => {
    const map = new Map<string, PartOption[]>();
    for (const p of lineParts) {
      const arr = map.get(p.quality) ?? [];
      arr.push(p);
      map.set(p.quality, arr);
    }
    return Array.from(map.entries()).map(([q, ps]) => {
      const prices = ps.map((p) => p.sellPrice);
      return {
        quality: q,
        priceFrom: Math.min(...prices),
        multiplePrices: new Set(prices).size > 1,
        warrantyDays: ps[0]!.warrantyDays,
      };
    });
  }, [lineParts]);

  const coloursForQuality = useMemo(() => {
    if (!curQuality) return [];
    const set = new Set<string>();
    for (const p of lineParts) {
      if (p.quality === curQuality) set.add(p.colour ?? STANDARD);
    }
    return Array.from(set);
  }, [lineParts, curQuality]);

  useEffect(() => {
    if (curQuality && coloursForQuality.length === 1 && !curColour) {
      setCurColour(coloursForQuality[0]!);
    }
  }, [curQuality, coloursForQuality, curColour]);

  const curPart = useMemo(() => {
    if (!curQuality || !curColour) return null;
    return (
      lineParts.find(
        (p) => p.quality === curQuality && (p.colour ?? STANDARD) === curColour
      ) ?? null
    );
  }, [lineParts, curQuality, curColour]);

  const availableRepairs = useMemo(
    () => repairTypes.filter((r) => !items.some((i) => i.repairType === r)),
    [repairTypes, items]
  );

  const total = useMemo(
    () =>
      Math.round(
        items.reduce(
          (sum, i) =>
            sum + applyDiscount(i.sellPrice, i.discountType, i.discountValue),
          0
        ) * 100
      ) / 100,
    [items]
  );

  const savings = useMemo(
    () =>
      Math.round(
        items.reduce(
          (sum, i) =>
            sum +
            (i.sellPrice -
              applyDiscount(i.sellPrice, i.discountType, i.discountValue)),
          0
        ) * 100
      ) / 100,
    [items]
  );

  // --- Handlers -------------------------------------------------------------
  function pickDeviceType(v: string) {
    setDeviceType(v);
    setBrand(""); setModel("");
    setBrands([]); setModels([]); setRepairTypes([]);
    setItems([]); resetCurrentLine();
  }
  function pickBrand(v: string) {
    setBrand(v);
    setModel(""); setModels([]); setRepairTypes([]);
    setItems([]); resetCurrentLine();
  }
  function pickModel(v: string) {
    setModel(v);
    setRepairTypes([]);
    setItems([]); resetCurrentLine();
  }
  function resetCurrentLine() {
    setCurRepair(""); setCurQuality(""); setCurColour(""); setLineParts([]);
  }

  function addLine() {
    if (!curPart || !curRepair) return;
    setItems((prev) => [
      ...prev,
      {
        partId: curPart.id,
        repairType: curRepair,
        quality: curQuality,
        colour: curColour === STANDARD ? null : curColour,
        sellPrice: curPart.sellPrice,
        warrantyDays: curPart.warrantyDays,
        discountType: null,
        discountValue: null,
      },
    ]);
    resetCurrentLine();
  }

  function removeLine(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
    setDiscountOpen(null);
  }

  function setLineDiscount(
    idx: number,
    type: DiscountType | null,
    value: number | null
  ) {
    setItems((prev) =>
      prev.map((it, i) =>
        i === idx
          ? { ...it, discountType: type, discountValue: type ? value : null }
          : it
      )
    );
  }

  function resetAll() {
    setDeviceType(""); setBrand(""); setModel("");
    setBrands([]); setModels([]); setRepairTypes([]);
    setItems([]); resetCurrentLine();
    setName(""); setEmail(""); setPhone(""); setConditionNotes("");
    setIncludeCondition(false); setPreCondition(defaultPreCondition());
    setDone(null); setSubmitError(null);
  }

  function setCondField(key: keyof PreCondition, value: unknown) {
    setPreCondition((prev) => ({ ...prev, [key]: value }) as PreCondition);
  }

  const canSubmit =
    items.length > 0 && name.trim().length > 0 && /^\S+@\S+\.\S+$/.test(email);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (items.length === 0 || submitting) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/staff/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim() ? phone.trim() : undefined,
          },
          items: items.map((i) => {
            const hasDiscount =
              !!i.discountType &&
              i.discountValue != null &&
              i.discountValue > 0;
            return {
              partId: i.partId,
              colour: i.colour ?? undefined,
              discountType: hasDiscount ? i.discountType : undefined,
              discountValue: hasDiscount ? i.discountValue : undefined,
            };
          }),
          preCondition: includeCondition ? preCondition : undefined,
          conditionNotes: conditionNotes.trim() || undefined,
          sendEmail,
        }),
      });
      const json = (await res.json()) as ApiEnvelope<{
        total: number;
        emailed: boolean;
        emailError: string | null;
      }>;
      if (!res.ok || !json.ok || !json.data) {
        setSubmitError(json.error ?? "Could not save the repair form");
        return;
      }
      setDone(json.data);
    } catch {
      setSubmitError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // --- Success --------------------------------------------------------------
  if (done) {
    return (
      <div className="card text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
          <Check className="h-6 w-6 text-emerald-700" aria-hidden />
        </div>
        <h2 className="mt-4 text-xl font-bold text-slate-900">
          Repair form saved
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {brand} {model} · {items.length} repair{items.length === 1 ? "" : "s"}{" "}
          ·{" "}
          <span className="font-semibold text-slate-900">
            {formatAud(done.total)}
          </span>
        </p>
        <p className="mt-3 text-sm">
          {done.emailed ? (
            <span className="text-emerald-700">Emailed to {email}</span>
          ) : done.emailError ? (
            <span className="text-rose-600">
              Saved, but the email failed: {done.emailError}
            </span>
          ) : (
            <span className="text-slate-500">Saved (no email sent)</span>
          )}
        </p>
        <button
          type="button"
          onClick={resetAll}
          className="btn-primary mx-auto mt-6"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          New quote
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {catalogError && (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {catalogError}
        </p>
      )}

      <Step n={1} title="Device type" value={deviceType} onEdit={() => pickDeviceType("")}>
        <ChipGrid options={deviceTypes} loading={loading === "device"} onPick={pickDeviceType} />
      </Step>

      {deviceType && (
        <Step n={2} title="Brand" value={brand} onEdit={() => pickBrand("")}>
          <ChipGrid options={brands} loading={loading === "brand"} onPick={pickBrand} />
        </Step>
      )}

      {brand && (
        <Step n={3} title="Model" value={model} onEdit={() => pickModel("")}>
          <ChipGrid options={models} loading={loading === "model"} onPick={pickModel} />
        </Step>
      )}

      {/* Repairs — one device, one or more repair lines */}
      {model && (
        <div className="card space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ccr-primary text-[10px] font-bold text-white">
              4
            </span>
            Repairs
          </h3>

          {/* Added line items */}
          {items.length > 0 && (
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {items.map((it, idx) => {
                const net = applyDiscount(
                  it.sellPrice,
                  it.discountType,
                  it.discountValue
                );
                const dLabel = discountLabel(it.discountType, it.discountValue);
                const discounted = net < it.sellPrice;
                return (
                  <li key={idx} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="font-medium text-slate-900">
                          {it.repairType}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {qualityName(it.quality)}
                          {it.colour ? ` · ${it.colour}` : ""} ·{" "}
                          {warrantyText(it.warrantyDays)}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="text-right">
                          {discounted ? (
                            <>
                              <span className="block text-xs text-slate-400 line-through">
                                {formatAud(it.sellPrice)}
                              </span>
                              <span className="font-semibold text-slate-900">
                                {formatAud(net)}
                              </span>
                              <span className="block text-[11px] font-semibold text-emerald-600">
                                {dLabel}
                              </span>
                            </>
                          ) : (
                            <span className="font-semibold text-slate-900">
                              {formatAud(net)}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setDiscountOpen(discountOpen === idx ? null : idx)
                          }
                          className={cn(
                            "rounded p-1 transition",
                            discounted || discountOpen === idx
                              ? "text-ccr-primary"
                              : "text-slate-400 hover:bg-slate-100 hover:text-ccr-primary"
                          )}
                          aria-label="Discount"
                          title="Add a discount"
                        >
                          <Percent className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeLine(idx)}
                          className="rounded p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          aria-label={`Remove ${it.repairType}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    </div>
                    {discountOpen === idx && (
                      <DiscountEditor
                        type={it.discountType}
                        value={it.discountValue}
                        onChange={(t, v) => setLineDiscount(idx, t, v)}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {/* Add a repair */}
          <div className="rounded-lg border border-dashed border-slate-300 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {items.length === 0 ? "Add a repair" : "Add another repair"}
            </p>

            {availableRepairs.length === 0 && !curRepair ? (
              <p className="text-sm text-slate-500">
                {repairTypes.length === 0
                  ? "No catalog repairs for this device yet — add them in the Price List."
                  : "All available repairs for this device have been added."}
              </p>
            ) : !curRepair ? (
              <ChipGrid
                options={availableRepairs}
                loading={loading === "repair"}
                onPick={setCurRepair}
              />
            ) : (
              <div className="space-y-4">
                {/* current repair pill */}
                <p className="flex items-center gap-2 text-sm font-medium text-slate-900">
                  <Check className="h-4 w-4 text-emerald-600" aria-hidden />
                  {curRepair}
                  <button
                    type="button"
                    onClick={resetCurrentLine}
                    className="ml-1 inline-flex items-center gap-1 text-xs font-medium text-ccr-primary hover:text-ccr-secondary"
                  >
                    <Pencil className="h-3 w-3" aria-hidden />
                    Change
                  </button>
                </p>

                {/* quality */}
                {!curQuality ? (
                  loadingParts ? (
                    <Spinner />
                  ) : qualities.length === 0 ? (
                    <p className="text-sm text-slate-500">No parts for this repair.</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {qualities.map((q) => (
                        <button
                          key={q.quality}
                          type="button"
                          onClick={() => setCurQuality(q.quality)}
                          className="flex items-center justify-between rounded-lg border border-slate-200 p-4 text-left transition hover:border-ccr-primary/50"
                        >
                          <span>
                            <span className="block font-semibold text-slate-900">
                              {qualityName(q.quality)}
                            </span>
                            <span className="block text-xs text-slate-500">
                              {warrantyText(q.warrantyDays)}
                            </span>
                          </span>
                          <span className="text-lg font-bold text-ccr-primary">
                            {q.multiplePrices ? "from " : ""}
                            {formatAud(q.priceFrom)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )
                ) : (
                  <p className="flex items-center gap-2 text-sm text-slate-700">
                    <Check className="h-4 w-4 text-emerald-600" aria-hidden />
                    {qualityName(curQuality)}
                    <button
                      type="button"
                      onClick={() => {
                        setCurQuality("");
                        setCurColour("");
                      }}
                      className="ml-1 inline-flex items-center gap-1 text-xs font-medium text-ccr-primary hover:text-ccr-secondary"
                    >
                      <Pencil className="h-3 w-3" aria-hidden />
                      Change
                    </button>
                  </p>
                )}

                {/* colour */}
                {curQuality && (
                  <div className="flex flex-wrap gap-2">
                    {coloursForQuality.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCurColour(c)}
                        className={cn(
                          "rounded-full border px-4 py-2 text-sm font-medium transition",
                          curColour === c
                            ? "border-ccr-primary bg-ccr-primary text-white"
                            : "border-slate-300 text-slate-700 hover:border-ccr-primary"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}

                {/* add */}
                {curPart && (
                  <button
                    type="button"
                    onClick={addLine}
                    className="btn-primary w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                    Add {curRepair} — {formatAud(curPart.sellPrice)}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Total */}
          {items.length > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-slate-900 px-5 py-4 text-white">
              <span className="text-sm">
                {items.length} repair{items.length === 1 ? "" : "s"} · {brand} {model}
                {savings > 0 && (
                  <span className="block text-xs text-emerald-300">
                    incl. {formatAud(savings)} discount
                  </span>
                )}
              </span>
              <span className="text-2xl font-bold">{formatAud(total)}</span>
            </div>
          )}
        </div>
      )}

      {/* Customer + condition */}
      {items.length > 0 && (
        <div className="card space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ccr-primary text-[10px] font-bold text-white">
              5
            </span>
            Customer details
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="qb-name">Name</label>
              <input id="qb-name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
            </div>
            <div>
              <label className="label" htmlFor="qb-email">Email</label>
              <input id="qb-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" placeholder="customer@email.com" />
            </div>
            <div>
              <label className="label" htmlFor="qb-phone">Phone <span className="font-normal text-slate-400">(optional)</span></label>
              <input id="qb-phone" type="tel" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="off" />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="qb-notes">
              Device condition notes <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea id="qb-notes" rows={2} className="input resize-y" value={conditionNotes} onChange={(e) => setConditionNotes(e.target.value)} placeholder="e.g. heavy screen cracking, rear glass intact, no water damage…" />
          </div>

          <div>
            <button
              type="button"
              onClick={() => setIncludeCondition((v) => !v)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-ccr-primary hover:text-ccr-secondary"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              {includeCondition ? "Hide" : "Record"} full condition checklist
            </button>
            {includeCondition && (
              <div className="mt-3 space-y-4 rounded-lg border border-slate-200 p-4">
                {PRE_CONDITION_GROUPS.map((group) => (
                  <fieldset key={group.title}>
                    <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {group.title}
                    </legend>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {group.fields.map((f) => (
                        <label key={f.key} className="flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={Boolean(preCondition[f.key])}
                            onChange={(e) => setCondField(f.key, e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-ccr-primary focus:ring-ccr-primary"
                          />
                          {f.label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="qb-cosmetic">Cosmetic grade</label>
                    <select
                      id="qb-cosmetic"
                      className="input"
                      value={preCondition.cosmeticGrade}
                      onChange={(e) => setCondField("cosmeticGrade", e.target.value)}
                    >
                      {COSMETIC_GRADES.map((g) => (
                        <option key={g.value} value={g.value}>{g.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label" htmlFor="qb-batt">Battery health % <span className="font-normal text-slate-400">(optional)</span></label>
                    <input
                      id="qb-batt"
                      type="number"
                      min={0}
                      max={100}
                      className="input"
                      value={preCondition.batteryHealthPct ?? ""}
                      onChange={(e) =>
                        setCondField(
                          "batteryHealthPct",
                          e.target.value === "" ? null : Number(e.target.value)
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-ccr-primary focus:ring-ccr-primary" />
            Email this repair form to the customer
          </label>

          {submitError && (
            <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{submitError}</p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={!canSubmit || submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Mail className="h-4 w-4" aria-hidden />
            )}
            {submitting
              ? "Saving…"
              : `Generate repair form — ${formatAud(total)}`}
          </button>
        </div>
      )}
    </form>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Step({
  n,
  title,
  value,
  onEdit,
  children,
}: {
  n: number;
  title: string;
  value: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ccr-primary text-[10px] font-bold text-white">
            {n}
          </span>
          {title}
        </h3>
        {value && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 text-xs font-medium text-ccr-primary hover:text-ccr-secondary"
          >
            <Pencil className="h-3 w-3" aria-hidden />
            Change
          </button>
        )}
      </div>
      {value ? (
        <p className="flex items-center gap-2 text-sm font-medium text-slate-900">
          <Check className="h-4 w-4 text-emerald-600" aria-hidden />
          {value}
        </p>
      ) : (
        children
      )}
    </div>
  );
}

function ChipGrid({
  options,
  loading,
  onPick,
}: {
  options: string[];
  loading?: boolean;
  onPick: (v: string) => void;
}) {
  if (loading) return <Spinner />;
  if (options.length === 0)
    return <p className="text-sm text-slate-500">Nothing available yet.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onPick(opt)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-ccr-primary hover:bg-ccr-primary/5 hover:text-ccr-primary"
        >
          {opt}
          <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden />
        </button>
      ))}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-500">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      Loading…
    </div>
  );
}

function DiscountEditor({
  type,
  value,
  onChange,
}: {
  type: DiscountType | null;
  value: number | null;
  onChange: (type: DiscountType | null, value: number | null) => void;
}) {
  const active: DiscountType = type ?? "PERCENT";
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 p-2">
      <span className="text-xs font-medium text-slate-500">Discount</span>
      <div className="inline-flex overflow-hidden rounded-md border border-slate-300">
        <button
          type="button"
          onClick={() => onChange("PERCENT", value)}
          className={cn(
            "px-3 py-1 text-xs font-semibold transition",
            active === "PERCENT"
              ? "bg-ccr-primary text-white"
              : "bg-white text-slate-600"
          )}
        >
          %
        </button>
        <button
          type="button"
          onClick={() => onChange("AMOUNT", value)}
          className={cn(
            "border-l border-slate-300 px-3 py-1 text-xs font-semibold transition",
            active === "AMOUNT"
              ? "bg-ccr-primary text-white"
              : "bg-white text-slate-600"
          )}
        >
          $
        </button>
      </div>
      <input
        type="number"
        min={0}
        step="0.01"
        value={value ?? ""}
        placeholder={active === "PERCENT" ? "e.g. 50" : "e.g. 20"}
        onChange={(e) =>
          onChange(active, e.target.value === "" ? null : Number(e.target.value))
        }
        className="input w-24 py-1.5"
        aria-label="Discount value"
      />
      <button
        type="button"
        onClick={() => onChange("PERCENT", 50)}
        className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 transition hover:border-ccr-primary hover:text-ccr-primary"
      >
        50% off
      </button>
      {(type || value != null) && (
        <button
          type="button"
          onClick={() => onChange(null, null)}
          className="text-xs font-medium text-rose-600 hover:underline"
        >
          Clear
        </button>
      )}
    </div>
  );
}
