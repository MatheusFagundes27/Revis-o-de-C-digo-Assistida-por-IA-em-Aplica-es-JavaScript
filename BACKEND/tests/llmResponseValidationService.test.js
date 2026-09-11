import test from "node:test";
import assert from "node:assert/strict";

import { validateLLMResponse } from "../src/services/llmResponseValidationService.js";

const alerts = [
  {
    source: "eslint",

    ruleId: "no-async-promise-executor",

    category: {
      id: "error_handling",
      label: "Tratamento de erros e fluxos assíncronos",
    },

    environment: "node",

    message: "Promise executor functions should not be async.",

    line: 1,
    column: 36,

    endLine: 1,
    endColumn: 41,

    severity: "error",

    contexts: [
      {
        documentId: "eslint-no-async-promise-executor",
      },
      {
        documentId: "node-error-handling",
      },
      {
        documentId: "shared-promises-async-await",
      },
    ],
  },
];

function createValidResponse() {
  return {
    reviews: [
      {
        alertId: "alert-1",

        ruleId: "no-async-promise-executor",

        category: {
          id: "error_handling",
          label: "Tratamento de erros e fluxos assíncronos",
        },

        description: "O executor da Promise foi declarado como assíncrono.",

        justification:
          "Executores assíncronos podem tornar o tratamento de erros menos previsível.",

        suggestion:
          "Evite utilizar uma função async diretamente no construtor Promise.",

        criticality: "high",

        line: 1,

        references: [
          "eslint-no-async-promise-executor",
          "node-error-handling",
          "shared-promises-async-await",
        ],
      },
    ],
  };
}

test("aceita uma resposta válida", () => {
  const result = validateLLMResponse({
    outputText: JSON.stringify(createValidResponse()),

    alerts,
  });

  assert.equal(result.valid, true);

  assert.equal(result.stage, "validated");

  assert.deepEqual(result.errors, []);
});

test("rejeita JSON inválido", () => {
  const result = validateLLMResponse({
    outputText: "{ json quebrado",

    alerts,
  });

  assert.equal(result.valid, false);

  assert.equal(result.stage, "json_parse");

  assert.equal(result.errors[0].type, "invalid_json");
});

test("rejeita alertId inexistente", () => {
  const response = createValidResponse();

  response.reviews[0].alertId = "alert-99";

  const result = validateLLMResponse({
    outputText: JSON.stringify(response),

    alerts,
  });

  assert.equal(result.valid, false);

  assert.equal(result.stage, "semantic_validation");

  assert.ok(result.errors.some((error) => error.type === "unknown_alert_id"));
});

test("rejeita ruleId diferente do alerta original", () => {
  const response = createValidResponse();

  response.reviews[0].ruleId = "no-unused-vars";

  const result = validateLLMResponse({
    outputText: JSON.stringify(response),

    alerts,
  });

  assert.equal(result.valid, false);

  assert.ok(result.errors.some((error) => error.type === "rule_id_mismatch"));
});

test("rejeita categoria diferente da evidência", () => {
  const response = createValidResponse();

  response.reviews[0].category = {
    id: "readability",
    label: "Legibilidade e clareza",
  };

  const result = validateLLMResponse({
    outputText: JSON.stringify(response),

    alerts,
  });

  assert.equal(result.valid, false);

  assert.ok(result.errors.some((error) => error.type === "category_mismatch"));
});

test("rejeita linha diferente do alerta original", () => {
  const response = createValidResponse();

  response.reviews[0].line = 10;

  const result = validateLLMResponse({
    outputText: JSON.stringify(response),

    alerts,
  });

  assert.equal(result.valid, false);

  assert.ok(result.errors.some((error) => error.type === "line_mismatch"));
});

test("rejeita referência inexistente no contexto", () => {
  const response = createValidResponse();

  response.reviews[0].references.push("documento-inventado");

  const result = validateLLMResponse({
    outputText: JSON.stringify(response),

    alerts,
  });

  assert.equal(result.valid, false);

  assert.ok(result.errors.some((error) => error.type === "invalid_reference"));
});

test("rejeita mais de um comentário para o mesmo alerta", () => {
  const response = createValidResponse();

  response.reviews.push({
    ...response.reviews[0],
  });

  const result = validateLLMResponse({
    outputText: JSON.stringify(response),

    alerts,
  });

  assert.equal(result.valid, false);

  assert.ok(
    result.errors.some((error) => error.type === "duplicate_alert_review")
  );
});

test("rejeita resposta sem comentário para alerta esperado", () => {
  const response = {
    reviews: [],
  };

  const result = validateLLMResponse({
    outputText: JSON.stringify(response),

    alerts,
  });

  assert.equal(result.valid, false);

  assert.ok(result.errors.some((error) => error.type === "missing_review"));
});
