import { db } from "@/lib/db";
import { isMissingPartRecord, isReferencedPartRecord } from "./prisma-errors";
import type { PartPatch, PartRepository } from "./types";

export const prismaPartRepository: PartRepository = {
  async findById(id) {
    return db.part.findUnique({
      where: { id },
      include: {
        _count: { select: { repairFormItems: true, matchedIntakes: true } },
      },
    });
  },
  async update(id, patch: PartPatch) {
    try {
      return await db.part.update({ where: { id }, data: patch });
    } catch (error) {
      if (isMissingPartRecord(error)) return null;
      throw error;
    }
  },
  async deactivate(id) {
    try {
      return await db.part.update({ where: { id }, data: { active: false } });
    } catch (error) {
      if (isMissingPartRecord(error)) return null;
      throw error;
    }
  },
  async hardDeleteInactiveUnreferenced(id) {
    try {
      const deleted = await db.part.deleteMany({
        where: {
          id,
          active: false,
          repairFormItems: { none: {} },
          matchedIntakes: { none: {} },
        },
      });
      return deleted.count > 0;
    } catch (error) {
      if (isMissingPartRecord(error) || isReferencedPartRecord(error)) return false;
      throw error;
    }
  },
};
