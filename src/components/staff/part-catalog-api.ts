import {
  type ApiEnvelope,
  CatalogResponseParseError,
  parseApiEnvelope,
} from "@/components/staff/part-catalog-schema";

export async function responseErrorMessage(
  response: Response,
  fallback: string
): Promise<string | null> {
  let envelope: ApiEnvelope | null = null;
  let body: unknown;
  try {
    body = await response.json();
  } catch (error) {
    if (error instanceof Error) {
      if (!response.ok) return fallback;
      return null;
    }
    throw error;
  }
  try {
    envelope = parseApiEnvelope(body);
  } catch (error) {
    if (error instanceof CatalogResponseParseError) return fallback;
    throw error;
  }
  if (response.ok && envelope.ok) return null;
  if (!envelope.ok) return envelope.error ?? fallback;
  return fallback;
}
