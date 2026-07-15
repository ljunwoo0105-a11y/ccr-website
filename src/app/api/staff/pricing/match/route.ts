import { NextResponse } from "next/server";
import { guard, privateFail } from "@/lib/api";
import { clientIp, hashIp, rateLimit } from "@/lib/rate-limit";
import { pricingRepository } from "@/lib/pricing/prisma-repository";
import { resolvePricingMatch } from "@/lib/pricing/service";

export const dynamic = "force-dynamic";

const MATCH_LIMIT = 30;
const MATCH_WINDOW_MS = 60_000;

function jsonResponse(
  body: Awaited<ReturnType<typeof resolvePricingMatch>>["body"],
  status: number
) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
  });
}

export async function POST(req: Request) {
  const { user, error } = await guard();
  if (error) return error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return privateFail("Invalid JSON body", 400);
  }

  const ipHash = hashIp(clientIp(req));
  const response = await resolvePricingMatch({
    repository: pricingRepository,
    rateLimit: (key) => rateLimit(key, MATCH_LIMIT, MATCH_WINDOW_MS),
    userId: user.id,
    ipHash,
    body,
  });
  return jsonResponse(response.body, response.status);
}
