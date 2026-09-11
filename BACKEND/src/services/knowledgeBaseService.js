import { readdir, readFile } from "node:fs/promises";
import { dirname, extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { knowledgeDocumentSchema } from "../validators/knowledgeDocumentValidator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const KNOWLEDGE_BASE_PATH = resolve(__dirname, "../../base-conhecimento");

let knowledgeBaseCache = null;

export async function initializeKnowledgeBase() {
  const documents = await loadDirectory(KNOWLEDGE_BASE_PATH);

  knowledgeBaseCache = documents;

  return documents;
}

export async function getKnowledgeBase() {
  if (!knowledgeBaseCache) {
    await initializeKnowledgeBase();
  }

  return knowledgeBaseCache;
}

export async function getKnowledgeBaseStats() {
  const documents = await getKnowledgeBase();

  const byTechnology = {};

  for (const document of documents) {
    const technology = document.technology;

    byTechnology[technology] = (byTechnology[technology] ?? 0) + 1;
  }

  return {
    documentCount: documents.length,
    byTechnology,
  };
}

export async function retrieveContextForAlert(alert, maxContexts = 3) {
  const documents = await getKnowledgeBase();

  const candidates = [];

  for (const document of documents) {
    const score = calculateRetrievalScore(document, alert);

    if (!score) {
      continue;
    }

    candidates.push({
      document,
      score: score.value,
      retrievalReason: score.reason,
    });
  }

  candidates.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    return a.document.id.localeCompare(b.document.id);
  });

  return candidates
    .slice(0, maxContexts)
    .map(({ document, score, retrievalReason }) => ({
      documentId: document.id,
      documentPath: document.documentPath,

      technology: document.technology,

      ruleId: document.ruleId,

      category: document.category,

      title: document.title,

      summary: document.summary,

      technicalReason: document.technicalReason,

      recommendation: document.recommendation,

      severitySuggestion: document.severitySuggestion,

      content: document.content,

      source: document.source,

      score,

      retrievalReason,
    }));
}

function calculateRetrievalScore(document, alert) {
  const environmentMatches = document.environment.includes(alert.environment);

  if (!environmentMatches) {
    return null;
  }

  // Documento específico da regra
  if (document.ruleId && document.ruleId === alert.ruleId) {
    return {
      value: 100,
      reason: "exact_rule_match",
    };
  }

  // Documento complementar por categoria + ambiente
  if (
    document.ruleId === null &&
    alert.category &&
    document.category.id === alert.category.id
  ) {
    return {
      value: 70,
      reason: "category_environment_match",
    };
  }

  return null;
}

async function loadDirectory(directory) {
  const entries = await readdir(directory, {
    withFileTypes: true,
  });

  entries.sort((a, b) => a.name.localeCompare(b.name));

  const documents = [];

  for (const entry of entries) {
    const fullPath = resolve(directory, entry.name);

    if (entry.isDirectory()) {
      const nestedDocuments = await loadDirectory(fullPath);

      documents.push(...nestedDocuments);

      continue;
    }

    if (!entry.isFile() || extname(entry.name).toLowerCase() !== ".json") {
      continue;
    }

    const document = await loadJsonDocument(fullPath);

    documents.push(document);
  }

  return documents;
}

async function loadJsonDocument(filePath) {
  const rawContent = await readFile(filePath, "utf-8");

  let parsedContent;

  try {
    parsedContent = JSON.parse(rawContent);
  } catch (error) {
    throw new Error(`JSON inválido em ${filePath}: ${error.message}`);
  }

  const validation = knowledgeDocumentSchema.safeParse(parsedContent);

  if (!validation.success) {
    const issues = validation.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    throw new Error(`Documento inválido em ${filePath}: ${issues}`);
  }

  return {
    ...validation.data,

    documentPath: relative(KNOWLEDGE_BASE_PATH, filePath).replaceAll("\\", "/"),
  };
}
