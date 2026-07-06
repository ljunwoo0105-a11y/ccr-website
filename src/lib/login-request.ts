import { ZodError, z } from "zod";
import { loginSchema } from "@/lib/validation";

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

function safeNext(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.startsWith("/staff") || value.startsWith("/admin") ? value : null;
}

export function redirectUrlForRequest(req: Request, path: string): URL {
  const origin = req.headers.get("origin");
  if (origin) return new URL(path, origin);

  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = forwardedHost ?? req.headers.get("host");
  if (!host) return new URL(path, req.url);

  const forwardedProto = req.headers.get("x-forwarded-proto");
  const protocol = forwardedProto ?? new URL(req.url).protocol.replace(":", "");
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
      ? safeNext(String(raw.next ?? ""))
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
      next: safeNext(parsed.data.next),
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
      const form = await req.formData();
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

  try {
    return parsedResult(await req.json(), false);
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    return {
      ok: false,
      message: "Invalid JSON body",
      status: 400,
      next: null,
      wantsHtmlRedirect: false,
    };
  }
}
