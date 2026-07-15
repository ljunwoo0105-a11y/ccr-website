import { z } from "zod";

export const policyCategoryValues = ["TERMS", "WARRANTY", "DATA"] as const;

export const policySchema = z.object({
  id: z.string(),
  category: z.enum(policyCategoryValues),
  version: z.string(),
  title: z.string(),
  body: z.string(),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const policiesSchema = z.array(policySchema);

export type PolicyCategory = (typeof policyCategoryValues)[number];
export type Policy = z.infer<typeof policySchema>;

export type PolicyForm = {
  readonly id: string | null;
  readonly category: PolicyCategory;
  readonly version: string;
  readonly title: string;
  readonly body: string;
  readonly active: boolean;
};

export type PolicyPayload = {
  readonly category: PolicyCategory;
  readonly version: string;
  readonly title: string;
  readonly body: string;
  readonly active: boolean;
};

export const emptyPolicyForm: PolicyForm = {
  id: null,
  category: "TERMS",
  version: "",
  title: "",
  body: "",
  active: false,
};
