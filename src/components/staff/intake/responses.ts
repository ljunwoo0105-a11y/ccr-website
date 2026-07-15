import type { CustomerMatch } from "../types";

type IntakeCreatedEnvelope = {
  readonly ok: boolean;
  readonly data?: {
    readonly id: string;
  };
  readonly error?: string;
};

type CustomerMatchesEnvelope = {
  readonly ok: boolean;
  readonly data?: readonly CustomerMatch[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isOptionalString(value: unknown): value is string | null | undefined {
  return value === null || value === undefined || typeof value === "string";
}

function isCustomerMatch(value: unknown): value is CustomerMatch {
  if (!isRecord(value)) return false;
  return (
    typeof value["id"] === "string" &&
    typeof value["name"] === "string" &&
    typeof value["phone"] === "string" &&
    isOptionalString(value["email"]) &&
    isOptionalString(value["suburb"])
  );
}

export function isCustomerMatchesEnvelope(
  value: unknown
): value is CustomerMatchesEnvelope {
  if (!isRecord(value) || typeof value["ok"] !== "boolean") return false;
  const data = value["data"];
  return data === undefined || (Array.isArray(data) && data.every(isCustomerMatch));
}

export function isIntakeCreatedEnvelope(
  value: unknown
): value is IntakeCreatedEnvelope {
  if (!isRecord(value) || typeof value["ok"] !== "boolean") return false;
  const data = value["data"];
  if (data !== undefined) {
    if (!isRecord(data) || typeof data["id"] !== "string") return false;
  }
  const error = value["error"];
  return error === undefined || typeof error === "string";
}

export function apiErrorMessage(value: unknown, fallback: string): string {
  if (!isRecord(value)) return fallback;
  return typeof value["error"] === "string" ? value["error"] : fallback;
}
