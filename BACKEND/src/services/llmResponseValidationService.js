import { llmReviewResponseSchema } from "../validators/llmReviewValidator.js";

export function validateLLMResponse({ outputText, alerts }) {
  const parsedResult = parseOutputText(outputText);

  if (!parsedResult.success) {
    return {
      valid: false,
      stage: "json_parse",
      data: null,
      errors: [parsedResult.error],
    };
  }

  const structuralValidation = llmReviewResponseSchema.safeParse(
    parsedResult.data
  );

  if (!structuralValidation.success) {
    return {
      valid: false,
      stage: "schema_validation",
      data: null,
      errors: structuralValidation.error.issues.map((issue) => ({
        type: "schema_error",
        path: issue.path.join("."),
        message: issue.message,
      })),
    };
  }

  const semanticErrors = validateAgainstEvidence({
    reviews: structuralValidation.data.reviews,

    alerts,
  });

  if (semanticErrors.length > 0) {
    return {
      valid: false,
      stage: "semantic_validation",
      data: structuralValidation.data,
      errors: semanticErrors,
    };
  }

  return {
    valid: true,
    stage: "validated",
    data: structuralValidation.data,
    errors: [],
  };
}

function parseOutputText(outputText) {
  try {
    return {
      success: true,
      data: JSON.parse(outputText),
    };
  } catch (error) {
    return {
      success: false,

      error: {
        type: "invalid_json",

        message:
          error instanceof Error
            ? error.message
            : "A resposta não contém JSON válido.",
      },
    };
  }
}

function validateAgainstEvidence({ reviews, alerts }) {
  const errors = [];

  const expectedAlerts = createExpectedAlertMap(alerts);

  const receivedAlertIds = new Set();

  for (const review of reviews) {
    const expectedAlert = expectedAlerts.get(review.alertId);

    if (!expectedAlert) {
      errors.push({
        type: "unknown_alert_id",
        alertId: review.alertId,
        message: `O alerta '${review.alertId}' não existe nas evidências fornecidas.`,
      });

      continue;
    }

    if (receivedAlertIds.has(review.alertId)) {
      errors.push({
        type: "duplicate_alert_review",
        alertId: review.alertId,
        message: `Mais de um comentário foi produzido para '${review.alertId}'.`,
      });

      continue;
    }

    receivedAlertIds.add(review.alertId);

    validateRuleId({
      review,
      expectedAlert,
      errors,
    });

    validateCategory({
      review,
      expectedAlert,
      errors,
    });

    validateLine({
      review,
      expectedAlert,
      errors,
    });

    validateReferences({
      review,
      expectedAlert,
      errors,
    });
  }

  for (const alertId of expectedAlerts.keys()) {
    if (!receivedAlertIds.has(alertId)) {
      errors.push({
        type: "missing_review",
        alertId,
        message: `Nenhum comentário foi produzido para '${alertId}'.`,
      });
    }
  }

  return errors;
}

function createExpectedAlertMap(alerts) {
  return new Map(alerts.map((alert, index) => [`alert-${index + 1}`, alert]));
}

function validateRuleId({ review, expectedAlert, errors }) {
  if (review.ruleId !== expectedAlert.ruleId) {
    errors.push({
      type: "rule_id_mismatch",

      alertId: review.alertId,

      expected: expectedAlert.ruleId,

      received: review.ruleId,

      message: `O ruleId retornado para '${review.alertId}' não corresponde ao alerta original.`,
    });
  }
}

function validateCategory({ review, expectedAlert, errors }) {
  if (!categoriesAreEqual(review.category, expectedAlert.category)) {
    errors.push({
      type: "category_mismatch",

      alertId: review.alertId,

      expected: expectedAlert.category,

      received: review.category,

      message: `A categoria retornada para '${review.alertId}' não corresponde à categoria original.`,
    });
  }
}

function validateLine({ review, expectedAlert, errors }) {
  const expectedLine = expectedAlert.line ?? null;

  if (review.line !== expectedLine) {
    errors.push({
      type: "line_mismatch",

      alertId: review.alertId,

      expected: expectedLine,

      received: review.line,

      message: `A linha retornada para '${review.alertId}' não corresponde à linha do alerta original.`,
    });
  }
}

function validateReferences({ review, expectedAlert, errors }) {
  const allowedReferences = new Set(
    expectedAlert.contexts.map((context) => context.documentId)
  );

  for (const reference of review.references) {
    if (!allowedReferences.has(reference)) {
      errors.push({
        type: "invalid_reference",

        alertId: review.alertId,

        reference,

        message: `A referência '${reference}' não foi fornecida como contexto para '${review.alertId}'.`,
      });
    }
  }
}

function categoriesAreEqual(received, expected) {
  if (received === null || expected === null) {
    return received === null && expected === null;
  }

  return received.id === expected.id && received.label === expected.label;
}
