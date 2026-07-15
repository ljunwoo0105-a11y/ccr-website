import { Prisma } from "@prisma/client";
import { z } from "zod";
import type { DiagnosisRecord, PolicyRecord } from "./types";
import { diagnosisOutcomeSchema } from "./validation";

const referenceCountRowsSchema = z.array(
  z.object({ references: z.union([z.bigint(), z.number(), z.string()]) })
);
const policyCategorySchema = z.enum(["TERMS", "WARRANTY", "DATA"]);

type PrismaDiagnosisRecord = Omit<DiagnosisRecord, "outcome"> & { readonly outcome: string };
type PrismaPolicyRecord = Omit<PolicyRecord, "category"> & { readonly category: string };

function missingRecord(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}

export async function nullOnMissing<T>(work: () => Promise<T>): Promise<T | null> {
  try {
    return await work();
  } catch (error) {
    if (missingRecord(error)) return null;
    throw error;
  }
}

export async function falseOnMissing(work: () => Promise<unknown>): Promise<boolean> {
  try {
    await work();
    return true;
  } catch (error) {
    if (missingRecord(error)) return false;
    throw error;
  }
}

export function referenceCount(rows: unknown): number {
  const parsed = referenceCountRowsSchema.parse(rows);
  const value = parsed[0]?.references ?? 0;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") return Number(value);
  return value;
}

export function diagnosisRecord(record: PrismaDiagnosisRecord): DiagnosisRecord {
  return { ...record, outcome: diagnosisOutcomeSchema.parse(record.outcome) };
}

export function policyRecord(record: PrismaPolicyRecord): PolicyRecord {
  return { ...record, category: policyCategorySchema.parse(record.category) };
}

export function matchedPartCount(value: Prisma.JsonValue): number {
  return Array.isArray(value) ? value.length : 0;
}
