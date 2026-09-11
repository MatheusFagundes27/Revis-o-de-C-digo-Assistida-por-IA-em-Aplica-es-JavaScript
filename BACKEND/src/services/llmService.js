import { getLLMConfig } from "../config/llmConfig.js";

import { generateWithOllama } from "./llmProviders/ollamaProvider.js";

export async function generateReviewWithLLM({ systemPrompt, userPrompt }) {
  const config = getLLMConfig();

  if (config.provider === "ollama") {
    return generateWithOllama({
      systemPrompt,
      userPrompt,
    });
  }

  throw new Error(
    `Provider '${config.provider}' ainda não está habilitado nesta configuração.`
  );
}
