import { z } from "zod";

const categorySchema = z
  .object({
    id: z.string().min(1),

    label: z.string().min(1),
  })
  .strict()
  .nullable();

const referencesSchema = z
  .array(z.string().min(1))
  .refine((references) => new Set(references).size === references.length, {
    message: "As referências não podem conter valores duplicados.",
  });

export const llmReviewItemSchema = z
  .object({
    alertId: z
      .string()
      .regex(/^alert-\d+$/, "O alertId deve seguir o formato alert-N."),

    ruleId: z.string().min(1),

    category: categorySchema,

    description: z.string().trim().min(1),

    justification: z.string().trim().min(1),

    suggestion: z.string().trim().min(1),

    criticality: z.enum(["low", "medium", "high"]),

    line: z.number().int().positive().nullable(),

    references: referencesSchema,
  })
  .strict();

export const llmReviewResponseSchema = z
  .object({
    reviews: z.array(llmReviewItemSchema),
  })
  .strict();
