import "server-only";
import { z } from "zod";
import { getSetting, setSetting } from "@/lib/db";

/**
 * Admin sidebar layout — which categories exist, what they're called, and
 * which section links sit in each. Persisted as one JSON Setting row so the
 * owner can arrange the console without a schema migration.
 *
 * The set of SECTIONS is fixed by the routes that exist in code; the layout
 * only arranges them. Normalisation guarantees every known section is always
 * reachable no matter what the stored value says: unknown hrefs are dropped,
 * missing ones are appended, and a broken/empty layout falls back to the
 * default. Icons and labels stay in the client nav component (icons are
 * components and cannot cross the RSC boundary).
 */

export const NAV_LAYOUT_SETTING_KEY = "admin.navLayout";

/** Every admin section that can appear in the menu. Order = default order. */
export const NAV_SECTION_HREFS = [
  "/admin",
  "/admin/intake",
  "/admin/leads",
  "/admin/inventory",
  "/admin/catalog",
  "/admin/diagnoses",
  "/admin/policies",
  "/admin/records",
  "/admin/price-access",
  "/admin/ai",
  "/admin/reviews",
  "/admin/users",
] as const;

export type NavSectionHref = (typeof NAV_SECTION_HREFS)[number];

export interface NavGroup {
  readonly id: string;
  readonly title: string;
  readonly items: readonly NavSectionHref[];
}

export interface NavLayout {
  readonly groups: readonly NavGroup[];
}

export const DEFAULT_NAV_LAYOUT: NavLayout = {
  groups: [
    {
      id: "operations",
      title: "Operations",
      items: [
        "/admin",
        "/admin/intake",
        "/admin/leads",
        "/admin/inventory",
      ],
    },
    {
      id: "manage",
      title: "Manage",
      items: [
        "/admin/catalog",
        "/admin/diagnoses",
        "/admin/policies",
        "/admin/records",
        "/admin/price-access",
        "/admin/ai",
        "/admin/reviews",
        "/admin/users",
      ],
    },
  ],
};

const KNOWN_HREFS: ReadonlySet<string> = new Set(NAV_SECTION_HREFS);

/**
 * Request schema for saving a layout. Every known section must appear exactly
 * once — the editor is generated from the live registry, so a mismatch means
 * a stale or hand-rolled client, and rejecting beats silently hiding a page.
 * Lives here rather than lib/validation.ts to follow the admin-data precedent
 * of feature-scoped schemas.
 */
export const navLayoutSchema = z
  .object({
    groups: z
      .array(
        z.object({
          id: z.string().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/),
          title: z.string().trim().min(1).max(40),
          items: z.array(
            z.string().refine((href) => KNOWN_HREFS.has(href), {
              message: "Unknown section href",
            })
          ),
        })
      )
      .min(1)
      .max(12),
  })
  .superRefine((layout, ctx) => {
    const groupIds = new Set<string>();
    const seen = new Set<string>();
    for (const group of layout.groups) {
      if (groupIds.has(group.id)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Duplicate category id: ${group.id}` });
      }
      groupIds.add(group.id);
      for (const href of group.items) {
        if (seen.has(href)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Section listed twice: ${href}` });
        }
        seen.add(href);
      }
    }
    for (const href of NAV_SECTION_HREFS) {
      if (!seen.has(href)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Section missing from layout: ${href}` });
      }
    }
  });

export type NavLayoutInput = z.infer<typeof navLayoutSchema>;

/** Coerce whatever is stored into a complete, valid layout. */
function normalizeNavLayout(raw: unknown): NavLayout {
  const candidate = raw as { groups?: unknown } | null;
  const rawGroups = Array.isArray(candidate?.groups) ? candidate.groups : [];

  const seen = new Set<string>();
  const groups: { id: string; title: string; items: NavSectionHref[] }[] = [];

  for (const entry of rawGroups) {
    const group = entry as { id?: unknown; title?: unknown; items?: unknown };
    if (typeof group?.id !== "string" || typeof group?.title !== "string") continue;
    const title = group.title.trim().slice(0, 40);
    if (!title) continue;
    const items: NavSectionHref[] = [];
    for (const href of Array.isArray(group.items) ? group.items : []) {
      if (typeof href !== "string" || !KNOWN_HREFS.has(href) || seen.has(href)) continue;
      seen.add(href);
      items.push(href as NavSectionHref);
    }
    groups.push({ id: group.id.slice(0, 64), title, items });
  }

  if (groups.length === 0) return DEFAULT_NAV_LAYOUT;

  // Sections the stored layout doesn't mention (e.g. routes added after the
  // layout was saved) surface at the end of the last category rather than
  // vanishing.
  const missing = NAV_SECTION_HREFS.filter((href) => !seen.has(href));
  if (missing.length > 0) {
    groups[groups.length - 1].items.push(...missing);
  }

  return { groups };
}

export async function getNavLayout(): Promise<NavLayout> {
  const stored = await getSetting<unknown>(NAV_LAYOUT_SETTING_KEY, null);
  if (stored === null) return DEFAULT_NAV_LAYOUT;
  return normalizeNavLayout(stored);
}

export async function saveNavLayout(layout: NavLayoutInput): Promise<NavLayout> {
  const normalized = normalizeNavLayout(layout);
  await setSetting(NAV_LAYOUT_SETTING_KEY, normalized);
  return normalized;
}
