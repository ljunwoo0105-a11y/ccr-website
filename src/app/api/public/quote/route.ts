import { db } from "@/lib/db";
import { ok, fail, parseBody } from "@/lib/api";
import { rateLimit, clientIp, hashIp } from "@/lib/rate-limit";
import { quoteRequestSchema } from "@/lib/validation";
import { renderQuoteEmail, sendEmail } from "@/lib/email";
import { findCheapestPart } from "@/lib/quotes";
import { BUSINESS } from "@/lib/config";

export const dynamic = "force-dynamic";

/**
 * Public quote request (lead capture). The estimate is EMAILED only —
 * the JSON response never contains price, part or quality data.
 */
export async function POST(req: Request) {
  try {
    const ip = clientIp(req);

    const ipLimit = rateLimit("quote:ip:" + ip, 5, 10 * 60_000);
    if (!ipLimit.ok) {
      return fail("Too many quote requests. Please call us instead.", 429);
    }

    // Honeypot defence-in-depth: bots that fill the hidden "website" field
    // get a silent success — nothing is stored, no email is sent. (The zod
    // schema also rejects it, but a silent drop gives bots no signal.)
    let rawWebsite: unknown;
    try {
      const raw = (await req.clone().json()) as unknown;
      if (raw && typeof raw === "object") {
        rawWebsite = (raw as Record<string, unknown>).website;
      }
    } catch {
      // Unparsable body — parseBody below returns the proper 400.
    }
    if (rawWebsite) {
      return ok({ received: true });
    }

    const { data, error } = await parseBody(req, quoteRequestSchema);
    if (error) return error;

    const emailLimit = rateLimit(
      "quote:email:" + data.email.toLowerCase(),
      3,
      60 * 60_000
    );
    if (!emailLimit.ok) {
      return fail("Too many quote requests. Please call us instead.", 429);
    }

    // Cheapest matching active part → "from" price for the email only.
    const part = await findCheapestPart({
      deviceType: data.deviceType,
      brand: data.brand,
      model: data.model,
      repairType: data.repairType,
    });
    const fromPriceAud = part?.sellPrice ?? null;
    const partQuality = part?.quality ?? null;

    const lead = await db.quoteRequest.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        suburb: data.suburb,
        referralSource: data.referralSource,
        referralOther: data.referralOther ?? null,
        deviceType: data.deviceType,
        brand: data.brand,
        model: data.model,
        repairType: data.repairType,
        issueNotes: data.issueNotes ?? null,
        fromPriceAud,
        partQuality,
        status: "NEW",
        ipHash: hashIp(ip),
        userAgent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
      },
    });

    try {
      const { subject, html } = renderQuoteEmail({
        name: data.name,
        brand: data.brand,
        model: data.model,
        repairType: data.repairType,
        fromPrice: fromPriceAud,
      });
      await sendEmail({ to: data.email, subject, html });
      await db.quoteRequest.update({
        where: { id: lead.id },
        data: { status: "EMAILED", emailedAt: new Date() },
      });
    } catch (e) {
      // Email failure must not break the lead — record it and move on.
      const message = e instanceof Error ? e.message : "Unknown email error";
      try {
        await db.quoteRequest.update({
          where: { id: lead.id },
          data: { emailError: message.slice(0, 300) },
        });
      } catch {
        // Lead is already saved; never fail the user over bookkeeping.
      }
    }

    // ABSOLUTELY no price / part / quality data in the public response.
    return ok({ received: true });
  } catch {
    return fail("Something went wrong. Please call us on " + BUSINESS.phone, 500);
  }
}
