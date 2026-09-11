import { z } from "zod";

export const knowledgeRetrievalSchema = z.object({
  ruleId: z.string().min(1, "O identificador da regra é obrigatório."),

  environment: z.enum(["node", "react"], {
    message: "O ambiente deve ser 'node' ou 'react'.",
  }),

  maxContexts: z.number().int().min(1).max(5).default(3),
});
