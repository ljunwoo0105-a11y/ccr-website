import { z } from "zod";
import { guard, parseBody, privateOk, privateFail } from "@/lib/api";
import { importPriceList } from "@/lib/parts/import";
import {
  aiRescueText,
  extractAttachedFile,
  ExtractError,
} from "@/lib/parts/extract";
import { AiBudgetError, AiConfigError } from "@/lib/ai/client";

export const dynamic = "force-dynamic";
// No maxDuration export: it is Vercel-only and inert under output:"standalone";
// the self-hosted server applies no per-route timeout.

/**
 * Price-list import. ADMIN only — cost prices travel through here.
 *
 * Two request shapes:
 *  - { csv, mode }              — CSV text; "preview" never writes, "apply"
 *                                 writes valid rows in one transaction.
 *  - { file, mode: "preview" }  — an attached file (csv/xlsx/pdf/photo). The
 *                                 server extracts rows (AI transcription for
 *                                 pdf/photo/messy sheets), previews them, and
 *                                 returns the normalised `csv` so the later
 *                                 apply is a plain deterministic CSV call.
 */
const MAX_CSV_CHARS = 600_000;

const importRequestSchema = z.union([
  z.object({
    csv: z.string().min(1).max(MAX_CSV_CHARS),
    mode: z.enum(["preview", "apply"]),
  }),
  z.object({
    file: z.object({
      name: z.string().trim().min(1).max(200),
      mediaType: z.string().trim().max(120),
      // ~8 MB decoded, matching the client-side guard.
      dataBase64: z.string().min(1).max(11_200_000),
    }),
    // Files only preview; apply re-sends the previewed CSV deterministically.
    mode: z.literal("preview", {
      errorMap: () => ({
        message: "Attached files can only be previewed — apply the previewed CSV instead.",
      }),
    }),
  }),
]);

export async function POST(req: Request) {
  const { error } = await guard("ADMIN");
  if (error) return error;

  const parsed = await parseBody(req, importRequestSchema);
  if (parsed.error) return parsed.error;

  if ("csv" in parsed.data) {
    const result = await importPriceList(parsed.data.csv, parsed.data.mode);
    if (!result.ok) {
      return privateFail(result.fileError ?? "Could not read the file", 422);
    }
    return privateOk(result);
  }

  try {
    let extracted = await extractAttachedFile(parsed.data.file);
    let result = await importPriceList(extracted.csv, "preview");

    // Deterministic read produced something the importer can't MAP (supplier
    // layout, odd headers) — let the transcriber normalise the same text.
    // Row-limit and empty-file failures surface verbatim: they are already
    // exact, and an AI pass could only turn them into a lossy subset.
    if (!result.ok && result.fileErrorKind === "header" && extracted.via !== "ai") {
      extracted = await aiRescueText(extracted.csv, parsed.data.file.name);
      result = await importPriceList(extracted.csv, "preview");
    }

    if (!result.ok) {
      return privateFail(result.fileError ?? "Could not read the file", 422);
    }
    if (extracted.csv.length > MAX_CSV_CHARS) {
      // Never show a preview that the apply step would then reject.
      return privateFail(
        "The file converts to more data than one import allows — split it and try again.",
        422
      );
    }
    return privateOk({
      ...result,
      csv: extracted.csv,
      extraction: {
        via: extracted.via,
        note: extracted.note,
        truncated: extracted.truncated,
      },
    });
  } catch (e) {
    if (
      e instanceof ExtractError ||
      e instanceof AiConfigError ||
      e instanceof AiBudgetError
    ) {
      return privateFail(e.message, 422);
    }
    throw e;
  }
}
