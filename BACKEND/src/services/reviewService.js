import { analyzeWithESLint } from "./eslintService.js";
import { generateReviewWithLLM } from "./llmService.js";
import { buildReviewPrompt } from "./promptBuilderService.js";

import { enrichAlertsWithContext } from "./contextEnrichmentService.js";

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
    evidence: {
      environment: evidence.environment,

      filename: evidence.filename,

      alertCount: evidence.retrieval.alertCount,

      alertsWithContext: evidence.retrieval.alertsWithContext,

      totalContexts: evidence.retrieval.totalContexts,
    },

    prompt,
  };
}

export async function buildGenerationPreview({
  code,
  filename,
  environment,
  maxContexts = 3,
}) {
  const preview = await buildPromptPreview({
    code,
    filename,
    environment,
    maxContexts,
  });

  if (preview.evidence.alertCount === 0) {
    return {
      evidence: preview.evidence,

      prompt: {
        version: preview.prompt.version,

        metadata: preview.prompt.metadata,
      },

      generation: {
        skipped: true,
        reason: "no_static_alerts",
      },
    };
  }

  const generation = await generateReviewWithLLM({
    systemPrompt: preview.prompt.systemPrompt,

    userPrompt: preview.prompt.userPrompt,
  });

  return {
    evidence: preview.evidence,

    prompt: {
      version: preview.prompt.version,

      metadata: preview.prompt.metadata,
    },

    generation,
  };
}

function resolveFilename(filename, environment) {
  if (filename) {
    return filename;
  }

  return environment === "react" ? "snippet.jsx" : "snippet.js";
}
