import {
  reviewRequestSchema,
  reviewEvidenceSchema,
} from "../validators/reviewValidator.js";

import {
  runStaticReview,
  buildReviewEvidence,
  buildPromptPreview,
} from "../services/reviewService.js";

export async function createReview(req, res) {
  const validation = reviewRequestSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      error: "invalid_request",
      message: "Os dados enviados são inválidos.",
      details: validation.error.flatten(),
    });
  }

  const { code, filename, environment, mode } = validation.data;

  if (mode !== "static") {
    return res.status(501).json({
      error: "mode_not_implemented",
      message: `O modo '${mode}' ainda não foi implementado.`,
    });
  }

  try {
    const review = await runStaticReview({
      code,
      filename,
      environment,
    });

    return res.status(200).json({
      scenario: "static",
      ...review,
    });
  } catch (error) {
    console.error("Erro ao executar análise estática:", error);

    return res.status(500).json({
      error: "static_analysis_failed",
      message: "Não foi possível executar a análise estática.",
    });
  }
}

export async function createEvidencePreview(req, res) {
  const validation = reviewEvidenceSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      error: "invalid_request",
      message: "Os dados enviados são inválidos.",
      details: validation.error.flatten(),
    });
  }

  const { code, filename, environment, maxContexts } = validation.data;

  try {
    const evidence = await buildReviewEvidence({
      code,
      filename,
      environment,
      maxContexts,
    });

    return res.status(200).json({
      stage: "pre_generation_evidence",

      scenario: null,

      note: "Endpoint técnico para validação da integração entre análise estática e recuperação de contexto. Não representa o cenário híbrido C3.",

      ...evidence,
    });
  } catch (error) {
    console.error("Erro ao construir evidências da revisão:", error);

    return res.status(500).json({
      error: "review_evidence_failed",
      message: "Não foi possível construir as evidências da revisão.",
    });
  }
}

export async function createPromptPreview(req, res) {
  const validation = reviewEvidenceSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      error: "invalid_request",
      message: "Os dados enviados são inválidos.",
      details: validation.error.flatten(),
    });
  }

  const { code, filename, environment, maxContexts } = validation.data;

  try {
    const preview = await buildPromptPreview({
      code,
      filename,
      environment,
      maxContexts,
    });

    return res.status(200).json({
      stage: "prompt_preview",

      scenario: null,

      note: "Endpoint técnico para inspeção do prompt antes da integração com o modelo de linguagem. Não representa o cenário híbrido C3.",

      ...preview,
    });
  } catch (error) {
    console.error("Erro ao construir preview do prompt:", error);

    return res.status(500).json({
      error: "prompt_preview_failed",

      message: "Não foi possível construir o preview do prompt.",
    });
  }
}
