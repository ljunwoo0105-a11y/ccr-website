export const DEFAULT_JSON_BODY_BYTES = 1024 * 1024;

export type BodyReadError = {
  readonly ok: false;
  readonly status: 400 | 413;
  readonly message: string;
};

export type BodyReadResult<T> =
  | { readonly ok: true; readonly data: T }
  | BodyReadError;

function declaredLength(req: Request): number | null {
  const value = req.headers.get("content-length");
  if (!value) return null;
  const length = Number(value);
  return Number.isSafeInteger(length) && length >= 0 ? length : null;
}

/** Read a request stream without ever retaining more than `maxBytes`. */
export async function readRequestBytes(
  req: Request,
  maxBytes: number
): Promise<BodyReadResult<Uint8Array>> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
    throw new Error("maxBytes must be a positive safe integer");
  }

  const length = declaredLength(req);
  if (length !== null && length > maxBytes) {
    return { ok: false, status: 413, message: "Request body is too large" };
  }

  if (!req.body) {
    return { ok: true, data: new Uint8Array() };
  }

  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel("request body limit exceeded").catch(() => undefined);
        return { ok: false, status: 413, message: "Request body is too large" };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, status: 400, message: "Could not read request body" };
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, data: body };
}

export async function readRequestText(
  req: Request,
  maxBytes: number
): Promise<BodyReadResult<string>> {
  const body = await readRequestBytes(req, maxBytes);
  if (!body.ok) return body;
  try {
    return {
      ok: true,
      data: new TextDecoder("utf-8", { fatal: true }).decode(body.data),
    };
  } catch {
    return { ok: false, status: 400, message: "Request body is not valid UTF-8" };
  }
}

export async function readJsonBody(
  req: Request,
  maxBytes = DEFAULT_JSON_BODY_BYTES
): Promise<BodyReadResult<unknown>> {
  const text = await readRequestText(req, maxBytes);
  if (!text.ok) return text;
  try {
    return { ok: true, data: JSON.parse(text.data) as unknown };
  } catch {
    return { ok: false, status: 400, message: "Invalid JSON body" };
  }
}
