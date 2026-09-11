import { analyzeWithESLint } from "./eslintService.js";

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

function resolveFilename(filename, environment) {
  if (filename) {
    return filename;
  }

  return environment === "react" ? "snippet.jsx" : "snippet.js";
}
