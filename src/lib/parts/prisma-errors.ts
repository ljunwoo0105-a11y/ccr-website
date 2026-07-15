import { Prisma } from "@prisma/client";

function knownPrismaError(error: unknown, code: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

export function isMissingPartRecord(error: unknown): boolean {
  return knownPrismaError(error, "P2025");
}

export function isReferencedPartRecord(error: unknown): boolean {
  return knownPrismaError(error, "P2003");
}
