import { ZodError, z } from "zod";
import { safeLoginDestination } from "@/lib/login-destination";
import { loginSchema } from "@/lib/validation";
import {
  readJsonBody,
  readRequestBytes,
  readRequestText,
} from "@/lib/request-body";

const MAX_LOGIN_BODY_BYTES = 16 * 1024;

const loginRequestSchema = loginSchema.extend({
  next: z.string().trim().max(500).optional().or(z.literal("")),
});

export interface LoginRequestInput {
  readonly email: string;
  readonly password: string;
  readonly next: string | null;
  readonly wantsHtmlRedirect: boolean;
}

export type LoginRequestResult =
  | { readonly ok: true; readonly data: LoginRequestInput }
  | {
      readonly ok: false;
      readonly message: string;
      readonly status: number;
      readonly next: string | null;
      readonly wantsHtmlRedirect: boolean;
    };

function validationMessage(error: ZodError): string {
  return error.errors
    .map((item) => `${item.path.join(".")}: ${item.message}`)
    .join("; ");
}

export function redirectUrlForRequest(req: Request, path: string): URL {
  const configuredSite = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configuredSite) {
    try {
      const configuredUrl = new URL(configuredSite);
      if (configuredUrl.protocol === "https:" || configuredUrl.protocol === "http:") {
        return new URL(path, configuredUrl.origin);
      }
    } catch {
      // Fall through to trusted proxy/request metadata.
    }
  }

  const forwardedHost = req.headers.get("x-forwarded-host")?.split(",", 1)[0]?.trim();
  const host = forwardedHost ?? req.headers.get("host");
  if (!host || !/^[a-z0-9.:[\]-]+$/i.test(host)) return new URL(path, req.url);

  const forwardedProto = req.headers
    .get("x-forwarded-proto")
    ?.split(",", 1)[0]
    ?.trim()
    .toLowerCase();
  const protocol = forwardedProto ?? new URL(req.url).protocol.replace(":", "");
  if (protocol !== "http" && protocol !== "https") return new URL(path, req.url);
  return new URL(path, `${protocol}://${host}`);
}

function formValue(form: FormData, key: string): string | undefined {
  const value = form.get(key);
  return typeof value === "string" ? value : undefined;
}

function parsedResult(
  raw: unknown,
  wantsHtmlRedirect: boolean
): LoginRequestResult {
  const parsed = loginRequestSchema.safeParse(raw);
  const next =
    typeof raw === "object" && raw !== null && "next" in raw
      ? safeLoginDestination(String(raw.next ?? ""))
      : null;

  if (!parsed.success) {
    return {
      ok: false,
      message: validationMessage(parsed.error),
      status: 422,
      next,
      wantsHtmlRedirect,
    };
  }

  return {
    ok: true,
    data: {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      next: safeLoginDestination(parsed.data.next),
      wantsHtmlRedirect,
    },
  };
}

export async function parseLoginRequest(
  req: Request
): Promise<LoginRequestResult> {
  const contentType = req.headers.get("content-type") ?? "";
  const wantsHtmlRedirect =
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data");

  if (wantsHtmlRedirect) {
    try {
      let form: FormData;
      if (contentType.includes("application/x-www-form-urlencoded")) {
        const body = await readRequestText(req, MAX_LOGIN_BODY_BYTES);
        if (!body.ok) {
          return {
            ok: false,
            message: body.message,
            status: body.status,
            next: null,
            wantsHtmlRedirect: true,
          };
        }
        form = new FormData();
        for (const [key, value] of new URLSearchParams(body.data)) {
          form.append(key, value);
        }
      } else {
        const body = await readRequestBytes(req, MAX_LOGIN_BODY_BYTES);
        if (!body.ok) {
          return {
            ok: false,
            message: body.message,
            status: body.status,
            next: null,
            wantsHtmlRedirect: true,
          };
        }
        const boundedRequest = new Request(req.url, {
          method: "POST",
          headers: { "content-type": contentType },
          body: body.data.buffer.slice(
            body.data.byteOffset,
            body.data.byteOffset + body.data.byteLength
          ) as ArrayBuffer,
        });
        form = await boundedRequest.formData();
      }
      return parsedResult(
        {
          email: formValue(form, "email") ?? "",
          password: formValue(form, "password") ?? "",
          next: formValue(form, "next") ?? "",
        },
        true
      );
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      return {
        ok: false,
        message: "Invalid form body",
        status: 400,
        next: null,
        wantsHtmlRedirect: true,
      };
    }
  }

  const body = await readJsonBody(req, MAX_LOGIN_BODY_BYTES);
  if (!body.ok) {
    return {
      ok: false,
      message: body.message,
      status: body.status,
      next: null,
      wantsHtmlRedirect: false,
    };
  }
  return parsedResult(body.data, false);
}
