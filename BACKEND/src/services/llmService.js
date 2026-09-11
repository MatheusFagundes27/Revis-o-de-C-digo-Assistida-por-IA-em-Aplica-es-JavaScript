import OpenAI from "openai";

import { getLLMConfig } from "../config/llmConfig.js";

let openAIClient = null;

export async function generateReviewWithLLM({ systemPrompt, userPrompt }) {
  const { apiKey, model, maxOutputTokens } = getLLMConfig();

  const client = getOpenAIClient(apiKey);

  const startedAt = Date.now();

  const response = await client.responses.create({
    model,

    instructions: systemPrompt,

    input: userPrompt,

    max_output_tokens: maxOutputTokens,

    store: false,
  });

  const finishedAt = Date.now();

  return {
    provider: "openai",

    model: response.model,

    responseId: response.id,

    requestId: response._request_id ?? null,

    status: response.status,

    outputText: response.output_text ?? "",

    usage: {
      inputTokens: response.usage?.input_tokens ?? null,

      outputTokens: response.usage?.output_tokens ?? null,

      totalTokens: response.usage?.total_tokens ?? null,
    },

    durationMs: finishedAt - startedAt,

    generatedAt: new Date().toISOString(),
  };
}

function getOpenAIClient(apiKey) {
  if (!openAIClient) {
    openAIClient = new OpenAI({
      apiKey,
    });
  }

  return openAIClient;
}
