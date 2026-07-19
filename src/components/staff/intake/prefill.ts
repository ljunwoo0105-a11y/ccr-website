export type IntakePrefill = {
  readonly partId?: string;
  readonly diagnosisRuleId?: string;
  readonly diagnosis?: string;
  readonly display?: string;
  // Device seed values, deliberately NOT named deviceType/brand/model: the
  // form spreads this prefill over its own state when building the payload,
  // so a matching name would silently overwrite whatever staff typed. These
  // only seed the opening state and never reach the submission schema.
  readonly seedDeviceType?: string;
  readonly seedBrand?: string;
  readonly seedModel?: string;
  readonly seedRepairType?: string;
};

type QueryValue = string | readonly string[] | undefined;
type QuerySource = URLSearchParams | Readonly<Record<string, QueryValue>>;

function firstQueryValue(source: QuerySource, key: string): string | undefined {
  if (source instanceof URLSearchParams) return source.get(key) ?? undefined;
  const value = source[key];
  if (typeof value === "string") return value;
  return value?.[0];
}

function boundedQueryText(
  source: QuerySource,
  key: string,
  maxLength: number
): string | undefined {
  const value = firstQueryValue(source, key)?.trim();
  if (!value || value.length > maxLength) return undefined;
  if (/[\u0000-\u001f\u007f]/.test(value)) return undefined;
  return value;
}

export function parseIntakePrefill(source: QuerySource): IntakePrefill {
  const partId = boundedQueryText(source, "partId", 80);
  const diagnosisRuleId = boundedQueryText(source, "diagnosisRuleId", 80);
  const diagnosis = boundedQueryText(source, "diagnosis", 120);
  const display = boundedQueryText(source, "display", 120);

  return {
    ...(partId ? { partId } : {}),
    ...(diagnosisRuleId ? { diagnosisRuleId } : {}),
    ...(diagnosis ? { diagnosis } : {}),
    ...(display ? { display } : {}),
  };
}

export function prefillSummaryRows(
  prefill: IntakePrefill
): readonly [string, string][] {
  const rows: [string, string][] = [];
  if (prefill.partId) rows.push(["Matched part", prefill.partId]);
  if (prefill.diagnosisRuleId) {
    rows.push(["Diagnosis rule", prefill.diagnosisRuleId]);
  }
  if (prefill.diagnosis) rows.push(["Diagnosis", prefill.diagnosis]);
  if (prefill.display) rows.push(["Display", prefill.display]);
  return rows;
}
