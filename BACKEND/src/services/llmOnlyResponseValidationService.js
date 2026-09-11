import { REVIEW_CATEGORIES } from "../config/reviewCategories.js";

import { llmOnlyResponseSchema } from "../validators/llmOnlyReviewValidator.js";

export function validateLLMOnlyResponse({ outputText, code }) {
  const parsed = parseResponse(outputText);

  if (!parsed.success) {
    return {
      valid: false,
      stage: "json_parse",
      data: null,
      errors: [parsed.error],
    };
  }

  const structuralValidation = llmOnlyResponseSchema.safeParse(parsed.data);

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

  const errors = validateSemantics({
    reviews: structuralValidation.data.reviews,

    code,
  });

  if (errors.length > 0) {
    return {
      valid: false,
      stage: "semantic_validation",

      data: structuralValidation.data,

      errors,
    };
  }

  return {
    valid: true,
    stage: "validated",

    data: structuralValidation.data,

    errors: [],
  };
}

function parseResponse(outputText) {
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

        message: error instanceof Error ? error.message : "JSON inválido.",
      },
    };
  }
}

function validateSemantics({ reviews, code }) {
  const errors = [];

  const reviewIds = new Set();

  const lineCount = code.split(/\r?\n/).length;

  const categories = new Map(
    Object.values(REVIEW_CATEGORIES).map((category) => [category.id, category])
  );

  for (const review of reviews) {
    if (reviewIds.has(review.reviewId)) {
      errors.push({
        type: "duplicate_review_id",

        reviewId: review.reviewId,

        message: `O reviewId '${review.reviewId}' está duplicado.`,
      });
    }

    reviewIds.add(review.reviewId);

    const expectedCategory = categories.get(review.category.id);

    if (!expectedCategory || expectedCategory.label !== review.category.label) {
      errors.push({
        type: "invalid_category",

        reviewId: review.reviewId,

        category: review.category,

        message:
          "A categoria retornada não corresponde às categorias oficiais do experimento.",
      });
    }

    if (review.line !== null && review.line > lineCount) {
      errors.push({
        type: "invalid_line",

        reviewId: review.reviewId,

        line: review.line,

        maxLine: lineCount,

        message: `A linha ${review.line} não existe no código fornecido.`,
      });
    }
  }

  return errors;
}
