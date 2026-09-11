import { classifyRule } from "../services/ruleClassificationService.js";

import {
  getKnowledgeBaseStats,
  retrieveContextForAlert,
} from "../services/knowledgeBaseService.js";

import { knowledgeRetrievalSchema } from "../validators/knowledgeRetrievalValidator.js";

export async function getKnowledgeStatus(req, res) {
  try {
    const stats = await getKnowledgeBaseStats();

    return res.status(200).json({
      status: "ok",
      knowledgeBase: stats,
    });
  } catch (error) {
    console.error("Erro ao consultar base de conhecimento:", error);

    return res.status(500).json({
      error: "knowledge_base_error",
      message: "Não foi possível consultar a base de conhecimento.",
    });
  }
}

export async function retrieveKnowledge(req, res) {
  const validation = knowledgeRetrievalSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      error: "invalid_request",
      message: "Os dados enviados são inválidos.",
      details: validation.error.flatten(),
    });
  }

  const { ruleId, environment, maxContexts } = validation.data;

  try {
    const category = classifyRule(ruleId);

    const contexts = await retrieveContextForAlert(
      {
        ruleId,
        environment,
        category,
      },
      maxContexts
    );

    return res.status(200).json({
      query: {
        ruleId,
        environment,
        category,
      },

      retrieval: {
        count: contexts.length,
        contexts,
      },
    });
  } catch (error) {
    console.error("Erro ao recuperar contexto:", error);

    return res.status(500).json({
      error: "knowledge_retrieval_failed",
      message: "Não foi possível recuperar o contexto.",
    });
  }
}
