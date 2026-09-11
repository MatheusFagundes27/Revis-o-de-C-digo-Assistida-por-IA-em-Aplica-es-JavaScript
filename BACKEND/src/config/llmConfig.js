import { z } from "zod";

const llmConfigSchema = z.object({
  LLM_PROVIDER: z.enum(["ollama", "openai"]).default("ollama"),

  OLLAMA_BASE_URL: z.string().url().default("http://127.0.0.1:11434"),

  OLLAMA_MODEL: z.string().min(1).default("llama3.2:3b"),

  OLLAMA_MAX_OUTPUT_TOKENS: z.coerce
    .number()
    .int()
    .min(100)
    .max(20000)
    .default(2500),

  OLLAMA_TEMPERATURE: z.coerce.number().min(0).max(2).default(0),

  OLLAMA_SEED: z.coerce.number().int().default(42),
});

export function getLLMConfig() {
  const validation = llmConfigSchema.safeParse({
    LLM_PROVIDER: process.env.LLM_PROVIDER,

    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL,

    OLLAMA_MODEL: process.env.OLLAMA_MODEL,

    OLLAMA_MAX_OUTPUT_TOKENS: process.env.OLLAMA_MAX_OUTPUT_TOKENS,

    OLLAMA_TEMPERATURE: process.env.OLLAMA_TEMPERATURE,

    OLLAMA_SEED: process.env.OLLAMA_SEED,
  });

  if (!validation.success) {
    const issues = validation.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    throw new Error(`Configuração do LLM inválida: ${issues}`);
  }

  return {
    provider: validation.data.LLM_PROVIDER,

    ollama: {
      baseUrl: validation.data.OLLAMA_BASE_URL,

      model: validation.data.OLLAMA_MODEL,

      maxOutputTokens: validation.data.OLLAMA_MAX_OUTPUT_TOKENS,

      temperature: validation.data.OLLAMA_TEMPERATURE,

      seed: validation.data.OLLAMA_SEED,
    },
  };
}
