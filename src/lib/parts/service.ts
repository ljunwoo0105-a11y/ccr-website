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
