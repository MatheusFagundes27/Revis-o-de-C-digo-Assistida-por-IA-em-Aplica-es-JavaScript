import { z } from "zod";

const categorySchema = z
  .object({
    id: z.enum([
      "readability",
      "maintainability",
      "error_handling",
      "best_practices",
    ]),

    label: z.string().min(1),
  })
  .strict();

const reviewSchema = z
  .object({
    reviewId: z
      .string()
      .regex(/^review-\d+$/, "O reviewId deve seguir o formato review-N."),

    category: categorySchema,

    description: z.string().trim().min(1),

    justification: z.string().trim().min(1),

    suggestion: z.string().trim().min(1),

    criticality: z.enum(["low", "medium", "high"]),

    line: z.number().int().positive().nullable(),

    references: z
      .array(z.string())
      .length(0, "O cenário LLM isolado não pode possuir referências."),
  })
  .strict();

export const llmOnlyResponseSchema = z
  .object({
    reviews: z.array(reviewSchema),
  })
  .strict();
