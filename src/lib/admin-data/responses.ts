import { fail, ok } from "@/lib/api";
import type { ServiceResult } from "./types";

const ADMIN_HEADERS = {
  "Cache-Control": "private, no-store",
  Vary: "Cookie",
} as const;

export function adminOk<T>(data: T, status = 200) {
  return ok(data, { status, headers: ADMIN_HEADERS });
}

export function adminFail(message: string, status = 400) {
  return fail(message, status, { headers: ADMIN_HEADERS });
}

export function adminResult<T>(result: ServiceResult<T>) {
  switch (result.kind) {
    case "ok":
      return adminOk(result.record);
    case "created":
      return adminOk(result.record, 201);
    case "deleted":
      return adminOk({ deleted: true });
    case "not_found":
      return adminFail(result.message, 404);
    case "invalid":
      return adminFail(result.message, 422);
    case "conflict":
      return adminFail(result.message, 409);
    default: {
      const exhaustive: never = result;
      return exhaustive;
    }
  }
}
