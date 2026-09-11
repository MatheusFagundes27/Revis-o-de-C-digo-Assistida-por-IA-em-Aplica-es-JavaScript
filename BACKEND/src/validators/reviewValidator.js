import { z } from "zod";

export const reviewRequestSchema = z.object({
  code: z
    .string()
    .min(1, "O código não pode estar vazio.")
    .max(100000, "O código excede o tamanho máximo permitido."),

  filename: z.string().min(1).default("snippet.js"),

  mode: z.enum(["static", "llm", "hybrid"]).default("static"),
});
