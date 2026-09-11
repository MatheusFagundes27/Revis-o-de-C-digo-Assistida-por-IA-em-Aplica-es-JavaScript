import { z } from "zod";

const llmConfigSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY não foi configurada."),

  OPENAI_MODEL: z.string().min(1, "OPENAI_MODEL não foi configurado."),

  OPENAI_MAX_OUTPUT_TOKENS: z.coerce
    .number()
    .int()
    .min(100)
    .max(20000)
    .default(2500),
});

export function getLLMConfig() {
  const validation = llmConfigSchema.safeParse({
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,

    OPENAI_MODEL: process.env.OPENAI_MODEL,

    OPENAI_MAX_OUTPUT_TOKENS: process.env.OPENAI_MAX_OUTPUT_TOKENS,
  });

  if (!validation.success) {
    const issues = validation.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    throw new Error(`Configuração do LLM inválida: ${issues}`);
  }

  return {
    apiKey: validation.data.OPENAI_API_KEY,

    model: validation.data.OPENAI_MODEL,

    maxOutputTokens: validation.data.OPENAI_MAX_OUTPUT_TOKENS,
  };
}
