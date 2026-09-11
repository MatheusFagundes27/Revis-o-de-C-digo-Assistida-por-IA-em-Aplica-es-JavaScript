import { z } from "zod";

const reviewBaseSchema = z.object({
  code: z
    .string()
    .min(1, "O código não pode estar vazio.")
    .max(100000, "O código excede o tamanho máximo permitido."),

  filename: z
    .string()
    .trim()
    .min(1, "O nome do arquivo não pode estar vazio.")
    .max(255, "O nome do arquivo é muito longo.")
    .optional(),

  environment: z.enum(["node", "react"], {
    message: "O ambiente deve ser 'node' ou 'react'.",
  }),
});

export const reviewRequestSchema = reviewBaseSchema.extend({
  mode: z.enum(["static", "llm", "hybrid"]).default("static"),
});

export const reviewEvidenceSchema = reviewBaseSchema.extend({
  maxContexts: z.number().int().min(1).max(5).default(3),
});
