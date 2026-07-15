import type { ZodSchema } from "zod";
import { guard, parseBody } from "@/lib/api";
import {
  runAdminGuarded,
  runAdminGuardedBody,
  type GuardFirstBodyOptions,
} from "./guard-first";
import { adminFail } from "./responses";
import { deleteQuerySchema } from "./validation";

type GuardResult = { readonly error: Response | null };
type AdminGuard = () => Promise<GuardResult>;
type AdminParser<T> = GuardFirstBodyOptions<T, ZodSchema<T>>["parse"];

type AdminOptions = {
  readonly guard?: AdminGuard;
  readonly work: () => Promise<Response>;
};

type AdminBodyOptions<T> = {
  readonly req: Request;
  readonly schema: ZodSchema<T>;
  readonly invalidMessage: string;
  readonly guard?: AdminGuard;
  readonly parse?: AdminParser<T>;
  readonly work: (body: T) => Promise<Response>;
};

async function adminGuard(): Promise<GuardResult> {
  return guard("ADMIN");
}

export async function withAdmin(options: AdminOptions): Promise<Response> {
  return runAdminGuarded({
    guard: options.guard ?? adminGuard,
    forbidden: () => adminFail("Forbidden", 403),
    work: options.work,
  });
}

export async function withAdminBody<T>(options: AdminBodyOptions<T>): Promise<Response> {
  return runAdminGuardedBody({
    req: options.req,
    schema: options.schema,
    guard: options.guard ?? adminGuard,
    forbidden: () => adminFail("Forbidden", 403),
    parse: options.parse ?? parseBody,
    invalid: () => adminFail(options.invalidMessage, 422),
    work: options.work,
  });
}

export function parseHardDelete(req: Request): boolean | null {
  const parsed = deleteQuerySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  return parsed.success ? parsed.data.hard === "true" : null;
}
