import { reviewRequestSchema } from "../validators/reviewValidator.js";
import { analyzeWithESLint } from "../services/eslintService.js";

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

  const effectiveFilename =
    filename ?? (environment === "react" ? "snippet.jsx" : "snippet.js");

  try {
    const analysis = await analyzeWithESLint({
      code,
      filename: effectiveFilename,
      environment,
    });

    return res.status(200).json({
      scenario: "static",
      environment,
      filename: effectiveFilename,
      analysis,
    });
  } catch (error) {
    console.error("Erro ao executar ESLint:", error);

    return res.status(500).json({
      error: "static_analysis_failed",
      message: "Não foi possível executar a análise estática.",
    });
  }
}
