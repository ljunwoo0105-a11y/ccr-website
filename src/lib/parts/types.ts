import type { Part } from "@prisma/client";
import type { z } from "zod";
import type { partUpdateSchema } from "@/lib/validation";

export type PartPatch = z.infer<typeof partUpdateSchema>;
export type PartRecord = Part;

export type PartReferenceCounts = {
  readonly repairFormItems: number;
  readonly matchedIntakes: number;
};

export type PartRecordWithReferences = PartRecord & {
  readonly _count: PartReferenceCounts;
};

export interface PartRepository {
  findById(id: string): Promise<PartRecordWithReferences | null>;
  update(id: string, patch: PartPatch): Promise<PartRecord | null>;
  deactivate(id: string): Promise<PartRecord | null>;
  hardDeleteInactiveUnreferenced(id: string): Promise<boolean>;
}

export type PartMutationResult =
  | { readonly kind: "ok"; readonly record: PartRecord }
  | { readonly kind: "deleted"; readonly mode: "soft" | "hard" }
  | { readonly kind: "not_found"; readonly message: string }
  | { readonly kind: "invalid"; readonly message: string }
  | { readonly kind: "conflict"; readonly message: string };
