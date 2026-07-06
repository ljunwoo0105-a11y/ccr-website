import type { PreCondition } from "@/lib/validation";

/**
 * Pre-repair condition checklist definition, shared by the intake form
 * (client) and the printable condition report (server page).
 *
 * Defaults assume a typical walk-in: functions work, no damage flags set —
 * staff toggle whatever differs while inspecting the device with the
 * customer present.
 */

export type PreConditionBooleanKey = Exclude<
  keyof PreCondition,
  "cosmeticGrade" | "batteryHealthPct"
>;

export interface ConditionField {
  key: PreConditionBooleanKey;
  label: string;
  /** true = "works"-style field (default on); false = damage/admin flag. */
  defaultValue: boolean;
}

export interface ConditionGroup {
  title: string;
  fields: ConditionField[];
}

export const PRE_CONDITION_GROUPS: ConditionGroup[] = [
  {
    title: "Power & Display",
    fields: [
      { key: "powersOn", label: "Device powers on", defaultValue: true },
      { key: "screenCracked", label: "Screen cracked / smashed", defaultValue: false },
      { key: "touchWorks", label: "Touch input works", defaultValue: true },
    ],
  },
  {
    title: "Cameras & Audio",
    fields: [
      { key: "frontCameraWorks", label: "Front camera works", defaultValue: true },
      { key: "rearCameraWorks", label: "Rear camera works", defaultValue: true },
      { key: "speakerWorks", label: "Speaker works", defaultValue: true },
      { key: "microphoneWorks", label: "Microphone works", defaultValue: true },
    ],
  },
  {
    title: "Ports & Buttons",
    fields: [
      { key: "chargingPortWorks", label: "Charging port works", defaultValue: true },
      { key: "buttonsWork", label: "All buttons work", defaultValue: true },
    ],
  },
  {
    title: "Security & Data",
    fields: [
      { key: "faceOrTouchIdWorks", label: "Face ID / fingerprint works", defaultValue: true },
      { key: "waterDamageSuspected", label: "Water damage suspected", defaultValue: false },
      { key: "previousRepairs", label: "Signs of previous repairs", defaultValue: false },
      { key: "findMyDisabled", label: "Find My / activation lock disabled", defaultValue: false },
      { key: "dataBackedUp", label: "Customer has backed up their data", defaultValue: false },
      { key: "simRemoved", label: "SIM card removed", defaultValue: false },
    ],
  },
];

export const COSMETIC_GRADES = [
  { value: "LIKE_NEW", label: "Like new" },
  { value: "GOOD", label: "Good" },
  { value: "WORN", label: "Worn" },
  { value: "DAMAGED", label: "Damaged" },
] as const;

export function cosmeticGradeLabel(value: string): string {
  return COSMETIC_GRADES.find((g) => g.value === value)?.label ?? value;
}

export function defaultPreCondition(): PreCondition {
  const base = {} as Record<PreConditionBooleanKey, boolean>;
  for (const group of PRE_CONDITION_GROUPS) {
    for (const field of group.fields) {
      base[field.key] = field.defaultValue;
    }
  }
  return { ...base, cosmeticGrade: "GOOD", batteryHealthPct: null };
}

/** Tolerant parse of the stored JSON pre-condition (for the report view). */
export function parsePreCondition(raw: string): PreCondition | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (value && typeof value === "object") return value as PreCondition;
    return null;
  } catch {
    return null;
  }
}
