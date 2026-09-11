import { Ollama } from "ollama";

import { getLLMConfig } from "../../config/llmConfig.js";

let ollamaClient = null;
let currentHost = null;

export async function generateWithOllama({ systemPrompt, userPrompt }) {
  const config = getLLMConfig().ollama;

  const client = getOllamaClient(config.baseUrl);

  const startedAt = Date.now();

  const response = await client.chat({
    model: config.model,

    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],

    stream: false,

    format: "json",

    options: {
      temperature: config.temperature,

      seed: config.seed,

      num_predict: config.maxOutputTokens,
    },
  });

  const finishedAt = Date.now();

  const inputTokens = response.prompt_eval_count ?? null;

  const outputTokens = response.eval_count ?? null;

  const totalTokens =
    inputTokens !== null && outputTokens !== null
      ? inputTokens + outputTokens
      : null;

  return {
    provider: "ollama",

    model: response.model,

    status: response.done ? "completed" : "incomplete",

    stopReason: response.done_reason ?? null,

    outputText: response.message?.content ?? "",

    usage: {
      inputTokens,
      outputTokens,
      totalTokens,
    },

    performance: {
      totalDurationNs: response.total_duration ?? null,

      loadDurationNs: response.load_duration ?? null,

      promptEvalDurationNs: response.prompt_eval_duration ?? null,

      evalDurationNs: response.eval_duration ?? null,
    },

    durationMs: finishedAt - startedAt,

    generatedAt: response.created_at ?? new Date().toISOString(),
  };
}

function getOllamaClient(host) {
  if (!ollamaClient || currentHost !== host) {
    ollamaClient = new Ollama({
      host,
    });

    currentHost = host;
  }

  return ollamaClient;
}
