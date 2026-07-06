"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  CheckCircle2,
  ChevronRight,
  Loader2,
  MapPin,
  Phone,
} from "lucide-react";
import { BUSINESS, REFERRAL_SOURCES } from "@/lib/config";
import { quoteRequestSchema } from "@/lib/validation-public";
import { cn } from "@/lib/utils";
import { Reveal, EASE_PRECISION } from "@/components/motion/Reveal";
import Scanline from "@/components/motion/Scanline";

type Step = 1 | 2 | 3;

interface CatalogData {
  deviceTypes?: string[];
  brands?: string[];
  models?: string[];
  repairTypes?: string[];
}

interface ApiEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: "Your device" },
  { n: 2, label: "Your details" },
  { n: 3, label: "Done" },
];

const DEVICE_FIELD_KEYS = ["deviceType", "brand", "model", "repairType"];

/** Step panes slide 24px in the direction of travel — 300ms precision ease. */
const stepVariants: Variants = {
  enter: (direction: number) => ({
    x: direction < 0 ? -24 : 24,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: EASE_PRECISION },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 24 : -24,
    opacity: 0,
    transition: { duration: 0.3, ease: EASE_PRECISION },
  }),
};

async function fetchCatalog(
  params: Record<string, string>
): Promise<CatalogData> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/public/catalog${qs ? `?${qs}` : ""}`);
  const json = (await res.json()) as ApiEnvelope<CatalogData>;
  if (!res.ok || !json.ok || !json.data) {
    throw new Error(json.error ?? "Could not load options");
  }
  return json.data;
}

/** Translate raw zod messages into short, human field errors. */
function friendlyError(path: string, message: string): string {
  if (/at least 1 character/i.test(message)) return "Required";
  if (path === "referralSource") return "Please choose an option";
  if (path === "email" && /invalid email/i.test(message)) {
    return "Enter a valid email address";
  }
  if (DEVICE_FIELD_KEYS.includes(path) && /invalid/i.test(message)) {
    return "Please re-select your device";
  }
  return message;
}

export default function QuoteWizard() {
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState(1);
  // Incremented when a submit fails validation — drives the fieldset shake.
  const [shakeCount, setShakeCount] = useState(0);

  // --- Step 1: device selection -------------------------------------------
  const [deviceType, setDeviceType] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [repairType, setRepairType] = useState("");
  const [issueNotes, setIssueNotes] = useState("");

  const [deviceTypes, setDeviceTypes] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [repairTypes, setRepairTypes] = useState<string[]>([]);

  const [loadingDeviceTypes, setLoadingDeviceTypes] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingRepairTypes, setLoadingRepairTypes] = useState(false);

  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // --- Step 2: contact details ---------------------------------------------
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [suburb, setSuburb] = useState("");
  const [referralSource, setReferralSource] = useState("");
  const [referralOther, setReferralOther] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot — humans never see it

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // --- Cascading catalog loads ---------------------------------------------
  useEffect(() => {
    let cancelled = false;
    setLoadingDeviceTypes(true);
    setCatalogError(null);
    fetchCatalog({})
      .then((d) => {
        if (!cancelled) setDeviceTypes(d.deviceTypes ?? []);
      })
      .catch(() => {
        if (!cancelled) {
          setCatalogError(
            `We couldn't load the device list. Please try again or call us on ${BUSINESS.phone}.`
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingDeviceTypes(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (!deviceType) return;
    let cancelled = false;
    setLoadingBrands(true);
    setCatalogError(null);
    fetchCatalog({ deviceType })
      .then((d) => {
        if (!cancelled) setBrands(d.brands ?? []);
      })
      .catch(() => {
        if (!cancelled) {
          setCatalogError(
            `We couldn't load brands. Please try again or call us on ${BUSINESS.phone}.`
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingBrands(false);
      });
    return () => {
      cancelled = true;
    };
  }, [deviceType, reloadKey]);

  useEffect(() => {
    if (!deviceType || !brand) return;
    let cancelled = false;
    setLoadingModels(true);
    setCatalogError(null);
    fetchCatalog({ deviceType, brand })
      .then((d) => {
        if (!cancelled) setModels(d.models ?? []);
      })
      .catch(() => {
        if (!cancelled) {
          setCatalogError(
            `We couldn't load models. Please try again or call us on ${BUSINESS.phone}.`
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingModels(false);
      });
    return () => {
      cancelled = true;
    };
  }, [deviceType, brand, reloadKey]);

  useEffect(() => {
    if (!deviceType || !brand || !model) return;
    let cancelled = false;
    setLoadingRepairTypes(true);
    setCatalogError(null);
    fetchCatalog({ deviceType, brand, model })
      .then((d) => {
        if (!cancelled) setRepairTypes(d.repairTypes ?? []);
      })
      .catch(() => {
        if (!cancelled) {
          setCatalogError(
            `We couldn't load repair options. Please try again or call us on ${BUSINESS.phone}.`
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingRepairTypes(false);
      });
    return () => {
      cancelled = true;
    };
  }, [deviceType, brand, model, reloadKey]);

  // --- Selection handlers (reset downstream levels) -------------------------
  function onDeviceTypeChange(v: string) {
    setDeviceType(v);
    setBrand("");
    setModel("");
    setRepairType("");
    setBrands([]);
    setModels([]);
    setRepairTypes([]);
  }
  function onBrandChange(v: string) {
    setBrand(v);
    setModel("");
    setRepairType("");
    setModels([]);
    setRepairTypes([]);
  }
  function onModelChange(v: string) {
    setModel(v);
    setRepairType("");
    setRepairTypes([]);
  }

  const deviceComplete = Boolean(deviceType && brand && model && repairType);

  // --- Submit ----------------------------------------------------------------
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step === 1) {
      if (deviceComplete) {
        setDirection(1);
        setStep(2);
      }
      return;
    }
    if (step !== 2 || submitting) return;

    setSubmitError(null);

    const payload = {
      name,
      email,
      phone,
      suburb,
      referralSource,
      referralOther:
        referralSource === "OTHER" && referralOther.trim()
          ? referralOther
          : undefined,
      deviceType,
      brand,
      model,
      repairType,
      issueNotes: issueNotes.trim() ? issueNotes : undefined,
      consent,
      website,
    };

    const parsed = quoteRequestSchema.safeParse(payload);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.errors) {
        const path = issue.path.join(".");
        if (!errs[path]) errs[path] = friendlyError(path, issue.message);
      }
      setFieldErrors(errs);
      if (DEVICE_FIELD_KEYS.some((k) => errs[k])) {
        setSubmitError("Please go back and re-check your device selection.");
      }
      setShakeCount((c) => c + 1);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      const res = await fetch("/api/public/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = (await res.json()) as ApiEnvelope<{ received: boolean }>;

      if (res.ok && json.ok) {
        setDirection(1);
        setStep(3);
        return;
      }

      if (res.status === 422 && json.error) {
        // Server formats zod issues as "path: message; path: message".
        const errs: Record<string, string> = {};
        let general = "";
        for (const chunk of json.error.split("; ")) {
          const idx = chunk.indexOf(": ");
          if (idx > 0) {
            const path = chunk.slice(0, idx);
            if (!errs[path]) {
              errs[path] = friendlyError(path, chunk.slice(idx + 2));
            }
          } else if (!general) {
            general = chunk;
          }
        }
        setFieldErrors(errs);
        setSubmitError(
          general || "Please check the highlighted fields and try again."
        );
        setShakeCount((c) => c + 1);
        return;
      }

      // 429 and 500 both carry a user-facing error message.
      setSubmitError(
        json.error ?? `Something went wrong. Please call us on ${BUSINESS.phone}.`
      );
    } catch {
      setSubmitError(
        `Something went wrong. Please call us on ${BUSINESS.phone}.`
      );
    } finally {
      setSubmitting(false);
    }
  }

  // --- Render ------------------------------------------------------------------
  return (
    <div className="card-dark relative overflow-hidden p-6 sm:p-8">
      <StepRail current={step} />

      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {step === 3 ? (
            <SuccessPanel email={email} />
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              {step === 1 && (
                <fieldset className="space-y-5">
                  <legend className="sr-only">Your device</legend>

                  {catalogError && (
                    <p
                      role="alert"
                      className="rounded-lg border border-status-red/40 bg-status-red/10 px-4 py-3 text-[13px] text-status-red"
                    >
                      {catalogError}{" "}
                      <button
                        type="button"
                        onClick={() => setReloadKey((k) => k + 1)}
                        className="font-medium underline underline-offset-2"
                      >
                        Try again
                      </button>
                    </p>
                  )}

                  <SelectField
                    id="deviceType"
                    label="Device type"
                    value={deviceType}
                    options={deviceTypes}
                    placeholder="Select device type"
                    loading={loadingDeviceTypes}
                    onChange={onDeviceTypeChange}
                  />
                  <SelectField
                    id="brand"
                    label="Brand"
                    value={brand}
                    options={brands}
                    placeholder={deviceType ? "Select brand" : "Choose a device type first"}
                    disabled={!deviceType}
                    loading={loadingBrands}
                    onChange={onBrandChange}
                  />
                  <SelectField
                    id="model"
                    label="Model"
                    value={model}
                    options={models}
                    placeholder={brand ? "Select model" : "Choose a brand first"}
                    disabled={!brand}
                    loading={loadingModels}
                    onChange={onModelChange}
                  />
                  <SelectField
                    id="repairType"
                    label="What needs fixing?"
                    value={repairType}
                    options={repairTypes}
                    placeholder={model ? "Select repair" : "Choose a model first"}
                    disabled={!model}
                    loading={loadingRepairTypes}
                    onChange={setRepairType}
                  />

                  <div>
                    <label htmlFor="issueNotes" className="label-dark">
                      Anything else we should know?{" "}
                      <span className="font-normal text-ink-500">(optional)</span>
                    </label>
                    <textarea
                      id="issueNotes"
                      rows={3}
                      maxLength={1000}
                      className="input-dark resize-y"
                      placeholder="e.g. screen flickers, dropped in water last week…"
                      value={issueNotes}
                      onChange={(e) => setIssueNotes(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-gold w-full"
                    disabled={!deviceComplete}
                  >
                    Continue
                  </button>
                </fieldset>
              )}

              {step === 2 && (
                <motion.div
                  animate={shakeCount > 0 ? "shake" : "still"}
                  variants={{
                    shake: {
                      x: [0, -6, 6, -3, 0],
                      transition: { duration: 0.15 },
                    },
                    still: { x: 0 },
                  }}
                  onAnimationComplete={(definition) => {
                    if (definition === "shake") setShakeCount(0);
                  }}
                >
                  <fieldset className="space-y-5" disabled={submitting}>
                    <legend className="sr-only">Your details</legend>

                    {/* Docket-style intake summary */}
                    <div className="rounded-lg border border-ink-700 bg-ink-800 p-4">
                      <p className="mono-label text-ink-500">Intake summary</p>
                      <dl className="tnum mt-3 space-y-2 font-mono text-xs text-ink-300">
                        <div className="leader-row">
                          <dt className="mono-label text-ink-400">Device</dt>
                          <dd className="text-ink-100">{deviceType}</dd>
                        </div>
                        <div className="leader-row">
                          <dt className="mono-label text-ink-400">Model</dt>
                          <dd className="text-ink-100">
                            {brand} {model}
                          </dd>
                        </div>
                        <div className="border-t border-dashed border-ink-700 pt-2">
                          <div className="leader-row">
                            <dt className="mono-label text-ink-400">Repair</dt>
                            <dd className="text-ink-100">{repairType}</dd>
                          </div>
                        </div>
                      </dl>
                    </div>

                    {submitError && (
                      <p
                        role="alert"
                        className="rounded-lg border border-status-red/40 bg-status-red/10 px-4 py-3 text-[13px] text-status-red"
                      >
                        {submitError}
                      </p>
                    )}

                    <div className="grid gap-5 sm:grid-cols-2">
                      <TextField
                        id="name"
                        label="Your name"
                        value={name}
                        onChange={setName}
                        error={fieldErrors.name}
                        autoComplete="name"
                        placeholder="Jane Citizen"
                      />
                      <TextField
                        id="email"
                        label="Email"
                        type="email"
                        value={email}
                        onChange={setEmail}
                        error={fieldErrors.email}
                        autoComplete="email"
                        placeholder="you@example.com"
                      />
                      <TextField
                        id="phone"
                        label="Phone"
                        type="tel"
                        value={phone}
                        onChange={setPhone}
                        error={fieldErrors.phone}
                        autoComplete="tel"
                        placeholder="04xx xxx xxx"
                      />
                      <TextField
                        id="suburb"
                        label="Suburb"
                        value={suburb}
                        onChange={setSuburb}
                        error={fieldErrors.suburb}
                        autoComplete="address-level2"
                        placeholder={BUSINESS.address.suburb}
                      />
                    </div>

                    <div>
                      <label htmlFor="referralSource" className="label-dark">
                        How did you hear about us?
                      </label>
                      <select
                        id="referralSource"
                        className={cn(
                          "input-dark",
                          fieldErrors.referralSource && "border-status-red"
                        )}
                        value={referralSource}
                        aria-invalid={fieldErrors.referralSource ? true : undefined}
                        aria-describedby={
                          fieldErrors.referralSource ? "referralSource-error" : undefined
                        }
                        onChange={(e) => setReferralSource(e.target.value)}
                      >
                        <option value="" disabled>
                          Select an option
                        </option>
                        {REFERRAL_SOURCES.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.referralSource && (
                        <p
                          id="referralSource-error"
                          className="mt-1 text-[13px] text-status-red"
                        >
                          {fieldErrors.referralSource}
                        </p>
                      )}
                    </div>

                    {referralSource === "OTHER" && (
                      <TextField
                        id="referralOther"
                        label="Tell us where"
                        value={referralOther}
                        onChange={setReferralOther}
                        error={fieldErrors.referralOther}
                        placeholder="e.g. local newsletter"
                      />
                    )}

                    <div>
                      <label className="flex items-start gap-3 text-[15px] text-ink-300">
                        <input
                          type="checkbox"
                          checked={consent}
                          onChange={(e) => setConsent(e.target.checked)}
                          aria-invalid={fieldErrors.consent ? true : undefined}
                          aria-describedby={
                            fieldErrors.consent ? "consent-error" : undefined
                          }
                          className={cn(
                            "mt-1 h-4 w-4 rounded border-ink-600 bg-ink-800 accent-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30",
                            fieldErrors.consent && "border-status-red"
                          )}
                        />
                        <span>
                          I agree to be contacted about my quote and accept the{" "}
                          <Link href="/privacy" className="link-gold">
                            privacy policy
                          </Link>
                          .
                        </span>
                      </label>
                      {fieldErrors.consent && (
                        <p id="consent-error" className="mt-1 text-[13px] text-status-red">
                          {fieldErrors.consent}
                        </p>
                      )}
                    </div>

                    {/* Honeypot — invisible to humans and screen readers; bots fill it. */}
                    <div aria-hidden="true" className="sr-only">
                      <label htmlFor="website">Website</label>
                      <input
                        id="website"
                        name="website"
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
                      <button
                        type="button"
                        className="btn-ghost-dark"
                        onClick={() => {
                          setSubmitError(null);
                          setDirection(-1);
                          setStep(1);
                        }}
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="btn-gold sm:flex-1"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <Loader2
                              size={16}
                              className="animate-spin"
                              aria-hidden="true"
                            />
                            Sending…
                          </>
                        ) : (
                          "Request my free quote"
                        )}
                      </button>
                    </div>

                    <p className="text-center text-xs text-ink-400">
                      No obligation · Price Beat Guarantee
                    </p>
                  </fieldset>
                </motion.div>
              )}
            </form>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Escape hatch — every step, bottom of the panel */}
      <div className="mt-8 flex flex-wrap items-baseline justify-center gap-x-2 border-t border-ink-700 pt-5">
        <span className="mono-label text-ink-500">Rather talk?</span>
        <a
          href={BUSINESS.phoneHref}
          className="tnum font-mono text-sm text-gold-500 transition-colors duration-150 hover:text-gold-300"
        >
          {BUSINESS.phone}
        </a>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StepRail({ current }: { current: Step }) {
  const total = STEPS.length;
  const label = STEPS.find((s) => s.n === current)?.label ?? "";
  return (
    <div className="mb-8">
      {/* Accessible step list — visual rail below is decorative. */}
      <ol aria-label="Quote progress" className="sr-only">
        {STEPS.map((s) => (
          <li key={s.n} aria-current={current === s.n ? "step" : undefined}>
            {s.label}
          </li>
        ))}
      </ol>

      <div aria-hidden="true">
        <p className="mono-label tnum text-ink-400">
          Step 0{current} / 0{total} — {label}
        </p>
        <div className="mt-3 h-0.5 w-full rounded-full bg-ink-700">
          <motion.div
            className="h-full rounded-full bg-gold-500"
            initial={false}
            animate={{ width: `${(current / total) * 100}%` }}
            transition={{ duration: 0.4, ease: EASE_PRECISION }}
          />
        </div>
      </div>
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  options,
  placeholder,
  disabled,
  loading,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  disabled?: boolean;
  loading?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className={`transition-opacity ${disabled ? "opacity-40" : ""}`}>
      <label htmlFor={id} className="label-dark flex items-center gap-2">
        {label}
        {loading && (
          <Loader2
            size={14}
            className="animate-spin text-ink-500"
            aria-label="Loading options"
          />
        )}
      </label>
      <select
        id={id}
        className="input-dark"
        value={value}
        disabled={disabled || loading}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="" disabled>
          {loading ? "Loading…" : placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  autoComplete,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="label-dark">
        {label}
      </label>
      <input
        id={id}
        type={type}
        className={cn("input-dark", error && "border-status-red")}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-[13px] text-status-red">
          {error}
        </p>
      )}
    </div>
  );
}

function SuccessPanel({ email }: { email: string }) {
  return (
    <div className="relative text-center">
      {/* One diagnostic sweep over the confirmation on entry. */}
      <Scanline play />

      <CheckCircle2
        size={56}
        strokeWidth={1.5}
        className="mx-auto text-gold-500"
        aria-hidden="true"
      />

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-3">
        <h2 className="site-heading text-ink-50">Check your inbox.</h2>
        <Reveal as="span" delay={0.9} y={0} margin="0px">
          <span className="mono-label rounded border border-status-green/40 px-2.5 py-1 text-status-green">
            Request logged
          </span>
        </Reveal>
      </div>

      <p className="site-subheading mt-4 text-ink-300">
        Your estimate is on its way to{" "}
        <span className="text-ink-50">{email}</span>.
      </p>
      <p className="mt-2 text-[13px] text-ink-400">
        Not there in a few minutes? Check your spam or junk folder.
      </p>

      <div className="mt-10 grid gap-4 text-left sm:grid-cols-2">
        <div className="rounded-lg border border-ink-700 bg-ink-800 p-6">
          <MapPin
            size={20}
            strokeWidth={1.5}
            className="text-gold-500"
            aria-hidden="true"
          />
          <h3 className="mt-3 font-display text-[15px] font-bold text-ink-100">
            Visit us
          </h3>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-400">
            Free inspection and an exact price on the spot.
          </p>
          <a
            href={BUSINESS.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="link-gold mt-3 inline-flex items-center gap-1 text-[13px]"
          >
            Get directions
            <ChevronRight size={16} aria-hidden="true" />
          </a>
        </div>

        <div className="rounded-lg border border-ink-700 bg-ink-800 p-6">
          <Phone
            size={20}
            strokeWidth={1.5}
            className="text-gold-500"
            aria-hidden="true"
          />
          <h3 className="mt-3 font-display text-[15px] font-bold text-ink-100">
            Call or text
          </h3>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-400">
            Prefer to talk it through? We&apos;re here.
          </p>
          <a
            href={BUSINESS.phoneHref}
            className="link-gold mt-3 inline-flex items-center gap-1 text-[13px]"
          >
            {BUSINESS.phone}
            <ChevronRight size={16} aria-hidden="true" />
          </a>
        </div>
      </div>

      <Link
        href="/"
        className="link-gold mt-10 inline-flex items-center gap-1 text-sm"
      >
        Back to home
        <ChevronRight size={16} aria-hidden="true" />
      </Link>
    </div>
  );
}
