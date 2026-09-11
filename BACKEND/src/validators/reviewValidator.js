import { z } from "zod";

export const reviewRequestSchema = z.object({
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

  mode: z.enum(["static", "llm", "hybrid"]).default("static"),
});
