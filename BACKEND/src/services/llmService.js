import { getLLMConfig } from "../config/llmConfig.js";

import { generateWithOllama } from "./llmProviders/ollamaProvider.js";

export async function generateReviewWithLLM({
  systemPrompt,
  userPrompt,
  outputFormat,
}) {
  const config = getLLMConfig();

  if (config.provider === "ollama") {
    return generateWithOllama({
      systemPrompt,
      userPrompt,
      outputFormat,
    });
  }

  throw new Error(`Provider '${config.provider}' não suportado.`);
}
