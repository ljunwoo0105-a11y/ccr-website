import { cookies } from "next/headers";
import { ok } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/auth";

/** Clear the session cookie. Safe to call whether or not a session exists. */
export async function POST() {
  cookies().delete(SESSION_COOKIE);
  return ok({});
}
