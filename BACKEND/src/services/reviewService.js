import { REVIEW_OUTPUT_CONTRACT } from "../config/reviewOutputContract.js";

import { LLM_ONLY_OUTPUT_CONTRACT } from "../config/llmOnlyOutputContract.js";

import { analyzeWithESLint } from "./eslintService.js";

import { generateReviewWithLLM } from "./llmService.js";

import { buildReviewPrompt } from "./promptBuilderService.js";

import { buildLLMOnlyPrompt } from "./llmOnlyPromptBuilderService.js";

import { validateLLMResponse } from "./llmResponseValidationService.js";

import { validateLLMOnlyResponse } from "./llmOnlyResponseValidationService.js";

import { enrichAlertsWithContext } from "./contextEnrichmentService.js";

/**
 * C1 — Análise estática isolada.
 *
 * Executa somente o ESLint.
 * Não utiliza RAG, base de conhecimento ou LLM.
 */
export async function runStaticReview({ code, filename, environment }) {
  const effectiveFilename = resolveFilename(filename, environment);

  const analysis = await analyzeWithESLint({
    code,
    filename: effectiveFilename,
    environment,
  });

  return {
    environment,
    filename: effectiveFilename,
    analysis,
  };
}

/**
 * Constrói as evidências utilizadas pelo fluxo híbrido.
 *
 * Executa:
 *
 * ESLint
 * → classificação
 * → recuperação de contexto
 */
export async function buildReviewEvidence({
  code,
  filename,
  environment,
  maxContexts = 3,
}) {
  const staticReview = await runStaticReview({
    code,
    filename,
    environment,
  });

  const enrichedAlerts = await enrichAlertsWithContext({
    alerts: staticReview.analysis.alerts,

    maxContexts,
  });

  const totalContexts = enrichedAlerts.reduce(
    (total, alert) => total + alert.contexts.length,
    0
  );

  const alertsWithContext = enrichedAlerts.filter(
    (alert) => alert.contexts.length > 0
  ).length;

  return {
    environment: staticReview.environment,

    filename: staticReview.filename,

    analysis: {
      errorCount: staticReview.analysis.errorCount,

      warningCount: staticReview.analysis.warningCount,

      alerts: enrichedAlerts,
    },

    retrieval: {
      maxContextsPerAlert: maxContexts,

      alertCount: enrichedAlerts.length,

      alertsWithContext,

      totalContexts,
    },
  };
}

/**
 * Endpoint técnico do Marco 8.
 *
 * Constrói o prompt híbrido sem chamar o LLM.
 */
export async function buildPromptPreview({
  code,
  filename,
  environment,
  maxContexts = 3,
}) {
  const evidence = await buildReviewEvidence({
    code,
    filename,
    environment,
    maxContexts,
  });

  const prompt = buildReviewPrompt({
    code,
    evidence,
  });

  return {
    evidence: buildEvidenceSummary(evidence),

    prompt,
  };
}

/**
 * Endpoint técnico dos Marcos 9 e 10.
 *
 * Executa o fluxo híbrido completo,
 * mas ainda com finalidade de preview técnico.
 */
export async function buildGenerationPreview({
  code,
  filename,
  environment,
  maxContexts = 3,
}) {
  const evidence = await buildReviewEvidence({
    code,
    filename,
    environment,
    maxContexts,
  });

  const evidenceSummary = buildEvidenceSummary(evidence);

  const prompt = buildReviewPrompt({
    code,
    evidence,
  });

  if (evidence.analysis.alerts.length === 0) {
    return {
      evidence: evidenceSummary,

      prompt: {
        version: prompt.version,

        metadata: prompt.metadata,
      },

      generation: {
        skipped: true,
        reason: "no_static_alerts",
      },

      validation: {
        valid: true,
        stage: "generation_skipped",

        data: {
          reviews: [],
        },

        errors: [],
      },
    };
  }

  const generation = await generateReviewWithLLM({
    systemPrompt: prompt.systemPrompt,

    userPrompt: prompt.userPrompt,

    outputFormat: REVIEW_OUTPUT_CONTRACT,
  });

  const validation = validateLLMResponse({
    outputText: generation.outputText,

    alerts: evidence.analysis.alerts,
  });

  return {
    evidence: evidenceSummary,

    prompt: {
      version: prompt.version,

      metadata: prompt.metadata,
    },

    generation,

    validation,
  };
}

/**
 * C2 — LLM isolado.
 *
 * IMPORTANTE:
 *
 * Este fluxo NÃO pode executar:
 *
 * - ESLint;
 * - classificação baseada em ESLint;
 * - recuperação RAG;
 * - base de conhecimento.
 *
 * A única evidência fornecida ao modelo
 * é o próprio código-fonte.
 */
export async function runLLMOnlyReview({ code, filename, environment }) {
  const effectiveFilename = resolveFilename(filename, environment);

  const prompt = buildLLMOnlyPrompt({
    code,

    filename: effectiveFilename,

    environment,
  });

  const generation = await generateReviewWithLLM({
    systemPrompt: prompt.systemPrompt,

    userPrompt: prompt.userPrompt,

    outputFormat: LLM_ONLY_OUTPUT_CONTRACT,
  });

  const validation = validateLLMOnlyResponse({
    outputText: generation.outputText,

    code,
  });

  return {
    environment,

    filename: effectiveFilename,

    prompt: {
      version: prompt.version,

      metadata: prompt.metadata,
    },

    generation,

    validation,
  };
}

/**
 * C3 — Abordagem híbrida.
 *
 * Fluxo:
 *
 * código
 * → ESLint
 * → classificação
 * → recuperação de contexto
 * → Prompt Builder
 * → LLM
 * → validação
 */
export async function runHybridReview({
  code,
  filename,
  environment,
  maxContexts = 3,
}) {
  const evidence = await buildReviewEvidence({
    code,
    filename,
    environment,
    maxContexts,
  });

  /**
   * Neste fluxo, o LLM só é chamado
   * quando existem evidências produzidas
   * pelo analisador estático.
   */
  if (evidence.analysis.alerts.length === 0) {
    return {
      environment: evidence.environment,

      filename: evidence.filename,

      analysis: evidence.analysis,

      retrieval: evidence.retrieval,

      generation: {
        skipped: true,

        reason: "no_static_alerts",
      },

      validation: {
        valid: true,

        stage: "generation_skipped",

        data: {
          reviews: [],
        },

        errors: [],
      },
    };
  }

  const prompt = buildReviewPrompt({
    code,
    evidence,
  });

  const generation = await generateReviewWithLLM({
    systemPrompt: prompt.systemPrompt,

    userPrompt: prompt.userPrompt,

    outputFormat: REVIEW_OUTPUT_CONTRACT,
  });

  const validation = validateLLMResponse({
    outputText: generation.outputText,

    alerts: evidence.analysis.alerts,
  });

  return {
    environment: evidence.environment,

    filename: evidence.filename,

    analysis: evidence.analysis,

    retrieval: evidence.retrieval,

    prompt: {
      version: prompt.version,

      metadata: prompt.metadata,
    },

    generation,

    validation,
  };
}

/**
 * Resolve um nome de arquivo padrão
 * quando o cliente não fornece filename.
 */
function resolveFilename(filename, environment) {
  if (filename) {
    return filename;
  }

  return environment === "react" ? "snippet.jsx" : "snippet.js";
}

/**
 * Cria uma representação resumida
 * das evidências para endpoints técnicos.
 */
function buildEvidenceSummary(evidence) {
  return {
    environment: evidence.environment,

    filename: evidence.filename,

    alertCount: evidence.retrieval.alertCount,

    alertsWithContext: evidence.retrieval.alertsWithContext,

    totalContexts: evidence.retrieval.totalContexts,
  };
}
