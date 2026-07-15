import { z } from "zod";

export const diagnosisOutcomeValues = [
  "PART",
  "MAINBOARD",
  "DATA_RECOVERY",
  "INSPECTION",
] as const;

export const diagnosisRuleSchema = z.object({
  id: z.string(),
  deviceType: z.string(),
  brand: z.string().nullable(),
  model: z.string().nullable(),
  symptomCode: z.string(),
  symptomLabel: z.string(),
  repairType: z.string(),
  outcome: z.enum(diagnosisOutcomeValues),
  priority: z.number(),
  active: z.boolean(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const diagnosisRulesSchema = z.array(diagnosisRuleSchema);

export type DiagnosisOutcome = (typeof diagnosisOutcomeValues)[number];
export type DiagnosisRule = z.infer<typeof diagnosisRuleSchema>;

export type DiagnosisForm = {
  readonly id: string | null;
  readonly deviceType: string;
  readonly brand: string;
  readonly model: string;
  readonly symptomCode: string;
  readonly symptomLabel: string;
  readonly repairType: string;
  readonly outcome: DiagnosisOutcome;
  readonly priority: string;
  readonly active: boolean;
  readonly notes: string;
};

export type DiagnosisPayload = {
  readonly deviceType: string;
  readonly brand: string | null;
  readonly model: string | null;
  readonly symptomCode: string;
  readonly symptomLabel: string;
  readonly repairType: string;
  readonly outcome: DiagnosisOutcome;
  readonly priority: number;
  readonly active: boolean;
  readonly notes: string | null;
};

export const emptyDiagnosisForm: DiagnosisForm = {
  id: null,
  deviceType: "",
  brand: "",
  model: "",
  symptomCode: "",
  symptomLabel: "",
  repairType: "",
  outcome: "PART",
  priority: "0",
  active: true,
  notes: "",
};
