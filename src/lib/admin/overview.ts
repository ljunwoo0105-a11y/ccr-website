import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

export const ADMIN_OVERVIEW_REVALIDATE_SECONDS = 15;

export interface OverviewLead {
  readonly id: string;
  readonly name: string;
  readonly brand: string;
  readonly model: string;
  readonly repairType: string;
  readonly status: string;
  readonly createdAt: string;
}

export interface OverviewIntake {
  readonly id: string;
  readonly customerName: string;
  readonly brand: string;
  readonly model: string;
  readonly repairTypes: string;
  readonly quotedPrice: number | null;
  readonly status: string;
  readonly createdAt: string;
}

export interface AdminOverviewData {
  readonly newLeads: number;
  readonly activeRepairs: number;
  readonly lowStock: number;
  readonly reviewCount: number;
  readonly recentLeads: readonly OverviewLead[];
  readonly recentIntakes: readonly OverviewIntake[];
}

async function loadAdminOverviewData(): Promise<AdminOverviewData> {
  const [newLeads, activeRepairs, lowStock, reviewCount, leads, intakes] =
    await Promise.all([
      db.quoteRequest.count({ where: { status: "NEW" } }),
      db.repairIntake.count({
        where: { status: { in: ["CHECKED_IN", "IN_REPAIR"] } },
      }),
      db.part.count({ where: { active: true, stockQty: { lte: 1 } } }),
      db.review.count({ where: { visible: true, rating: 5 } }),
      db.quoteRequest.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          brand: true,
          model: true,
          repairType: true,
          status: true,
          createdAt: true,
        },
      }),
      db.repairIntake.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          brand: true,
          model: true,
          repairTypes: true,
          quotedPrice: true,
          status: true,
          createdAt: true,
          customer: { select: { name: true } },
        },
      }),
    ]);

  return {
    newLeads,
    activeRepairs,
    lowStock,
    reviewCount,
    recentLeads: leads.map((lead) => ({
      ...lead,
      createdAt: lead.createdAt.toISOString(),
    })),
    recentIntakes: intakes.map(({ customer, createdAt, ...intake }) => ({
      ...intake,
      customerName: customer.name,
      createdAt: createdAt.toISOString(),
    })),
  };
}

export const getAdminOverviewData = unstable_cache(
  loadAdminOverviewData,
  ["admin-overview"],
  { revalidate: ADMIN_OVERVIEW_REVALIDATE_SECONDS }
);
