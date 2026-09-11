import {
  reviewRequestSchema,
  reviewEvidenceSchema,
} from "../validators/reviewValidator.js";

import {
  runStaticReview,
  runLLMOnlyReview,
  runHybridReview,
  buildReviewEvidence,
  buildPromptPreview,
  buildGenerationPreview,
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

  const { code, filename, environment, mode, maxContexts } = validation.data;

  try {
    if (mode === "static") {
      const result = await runStaticReview({
        code,
        filename,
        environment,
      });

      return res.status(200).json({
        scenario: "C1",
        mode: "static",
        ...result,
      });
    }

    if (mode === "llm") {
      const result = await runLLMOnlyReview({
        code,
        filename,
        environment,
      });

      return res.status(200).json({
        scenario: "C2",
        mode: "llm",
        ...result,
      });
    }

    const result = await runHybridReview({
      code,
      filename,
      environment,
      maxContexts,
    });

    return res.status(200).json({
      scenario: "C3",
      mode: "hybrid",
      ...result,
    });
  } catch (error) {
    console.error("Erro durante execução da revisão:", {
      mode,
      message: error.message,
      cause: error.cause?.message ?? null,
    });

    return res.status(500).json({
      error: "review_execution_failed",

      message: "Não foi possível executar a revisão.",
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

export async function createGenerationPreview(req, res) {
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
    const result = await buildGenerationPreview({
      code,
      filename,
      environment,
      maxContexts,
    });

    return res.status(200).json({
      stage: "llm_generation_preview",

      scenario: null,

      note: "Endpoint técnico para validar a primeira integração com o modelo de linguagem. Ainda não representa o cenário híbrido C3 definitivo.",

      ...result,
    });
  } catch (error) {
    console.error("Erro durante geração com LLM:", {
      message: error.message,
      status: error.status ?? null,
      code: error.code ?? null,
      requestId: error.request_id ?? null,
    });

    return res.status(500).json({
      error: "llm_generation_failed",

      message: "Não foi possível gerar a revisão com o modelo de linguagem.",
    });
  }
}
