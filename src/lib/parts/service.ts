import type { Role } from "@/lib/auth";
import type {
  PartMutationResult,
  PartPatch,
  PartRecord,
  PartRepository,
} from "./types";

type GuardResult = {
  readonly error: Response | null;
};

type Guard = (role: Role) => Promise<GuardResult>;

export async function runPartAdminMutation(input: {
  readonly guard: Guard;
  readonly work: () => Promise<Response>;
}): Promise<Response> {
  const { error } = await input.guard("ADMIN");
  if (error) return error;
  return input.work();
}

export async function updatePart(
  repo: PartRepository,
  id: string,
  patch: PartPatch
): Promise<PartMutationResult> {
  if (Object.keys(patch).length === 0) {
    return { kind: "invalid", message: "Update at least one part field" };
  }
  const current = await repo.findById(id);
  if (!current) return { kind: "not_found", message: "Part not found" };
  const record = await repo.update(id, patch);
  if (!record) return { kind: "not_found", message: "Part not found" };
  return { kind: "ok", record };
}

export async function deletePart(
  repo: PartRepository,
  id: string,
  hard: boolean
): Promise<PartMutationResult> {
  const current = await repo.findById(id);
  if (!current) return { kind: "not_found", message: "Part not found" };
  if (!hard) {
    const record = await repo.deactivate(id);
    if (!record) return { kind: "not_found", message: "Part not found" };
    return { kind: "deleted", mode: "soft" };
  }
  if (current.active) {
    return { kind: "conflict", message: "Deactivate the part before hard deleting it" };
  }
  if (current._count.repairFormItems + current._count.matchedIntakes > 0) {
    return { kind: "conflict", message: "Part is referenced by repair records" };
  }
  return (await repo.hardDeleteInactiveUnreferenced(id))
    ? { kind: "deleted", mode: "hard" }
    : { kind: "conflict", message: "Part is referenced by repair records" };
}

export type BulkPartAction = "deactivate" | "reactivate" | "hard-delete";

export type BulkPartOutcome = {
  readonly id: string;
  readonly ok: boolean;
  /** Why this id was skipped — surfaced per row, never swallowed. */
  readonly reason?: string;
};

export type BulkPartResult = {
  readonly succeeded: readonly string[];
  readonly failed: readonly BulkPartOutcome[];
};

/**
 * Apply one action across many parts, reusing the single-part rules so a bulk
 * hard delete cannot bypass the "must be inactive and unreferenced" guard.
 * Runs sequentially and reports per-id outcomes: a partial success is normal
 * (some parts are referenced by repair records) and must not read as total
 * success or total failure.
 */
export async function bulkMutateParts(
  repo: PartRepository,
  ids: readonly string[],
  action: BulkPartAction
): Promise<BulkPartResult> {
  const succeeded: string[] = [];
  const failed: BulkPartOutcome[] = [];

  for (const id of ids) {
    const result =
      action === "reactivate"
        ? await updatePart(repo, id, { active: true })
        : await deletePart(repo, id, action === "hard-delete");

    if (result.kind === "ok" || result.kind === "deleted") {
      succeeded.push(id);
    } else {
      failed.push({ id, ok: false, reason: result.message });
    }
  }

  return { succeeded, failed };
}

export function partMutationResponse(
  result: PartMutationResult,
  respond: {
    readonly ok: (data: PartRecord | { readonly deleted: "soft" | "hard" }) => Response;
    readonly fail: (message: string, status: number) => Response;
  }
): Response {
  switch (result.kind) {
    case "ok":
      return respond.ok(result.record);
    case "deleted":
      return respond.ok({ deleted: result.mode });
    case "not_found":
      return respond.fail(result.message, 404);
    case "invalid":
      return respond.fail(result.message, 422);
    case "conflict":
      return respond.fail(result.message, 409);
  }
}
