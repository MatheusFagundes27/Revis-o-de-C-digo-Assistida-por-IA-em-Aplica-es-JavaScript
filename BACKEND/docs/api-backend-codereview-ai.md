# API Backend — CodeReview AI

> Documento de referência das rotas HTTP atualmente disponíveis no backend do projeto CodeReview AI.
>
> Base local utilizada no desenvolvimento:
>
> ```text
> http://localhost:3000
> ```
>
> Este documento descreve o estado atual da API após a implementação dos cenários experimentais C1, C2 e C3. Os endpoints de `evidence`, `prompt-preview` e `generate-preview` são endpoints técnicos de desenvolvimento e depuração.

---

# Visão geral

| Método | Rota | Finalidade |
|---|---|---|
| `GET` | `/api/health` | Verificar se o backend está disponível |
| `POST` | `/api/reviews` | Executar C1, C2 ou C3 conforme o campo `mode` |
| `POST` | `/api/reviews/evidence` | Inspecionar análise estática + recuperação de contexto |
| `POST` | `/api/reviews/prompt-preview` | Inspecionar o prompt antes da chamada ao LLM |
| `POST` | `/api/reviews/generate-preview` | Executar o fluxo híbrido técnico com LLM e validação |
| `GET` | `/api/knowledge/status` | Consultar o estado da base de conhecimento |
| `POST` | `/api/knowledge/retrieve` | Recuperar documentos da base por regra e ambiente |

---

# Convenções gerais

## Content-Type

Para requisições `POST`, utilizar:

```http
Content-Type: application/json
```

## Ambientes aceitos

```text
node
react
```

## Modos de revisão

```text
static  → C1 — análise estática isolada
llm     → C2 — LLM isolado
hybrid  → C3 — abordagem híbrida
```

## Limite de contextos

Quando aplicável, `maxContexts` aceita valores inteiros entre `1` e `5`.

Valor padrão:

```text
3
```

---

# 1. Health Check

## `GET /api/health`

Verifica se o backend está em execução.

### Request

Não possui body.

### Exemplo

```http
GET http://localhost:3000/api/health
```

### Response — `200 OK`

```json
{
  "status": "ok",
  "service": "codereview-ai-backend"
}
```

---

# 2. Executar Revisão

## `POST /api/reviews`

Endpoint principal da aplicação.

Executa um dos três cenários experimentais conforme o campo `mode`.

## Body da requisição

```json
{
  "code": "string",
  "filename": "string opcional",
  "environment": "node | react",
  "mode": "static | llm | hybrid",
  "maxContexts": 3
}
```

### Campos

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---:|---|
| `code` | `string` | Sim | Código-fonte a ser analisado |
| `filename` | `string` | Não | Nome do arquivo |
| `environment` | `string` | Sim | `node` ou `react` |
| `mode` | `string` | Não | `static`, `llm` ou `hybrid`. Padrão: `static` |
| `maxContexts` | `number` | Não | Máximo de contextos por alerta no C3. Padrão: `3` |

Se `filename` não for informado:

```text
node  → snippet.js
react → snippet.jsx
```

---

# 2.1. Cenário C1 — Static

## Request

```json
{
  "code": "const nome = 'Matheus'; console.log('teste');",
  "filename": "teste.js",
  "environment": "node",
  "mode": "static"
}
```

## Fluxo

```text
Código
  ↓
ESLint
  ↓
Classificação
  ↓
Resposta
```

O C1 não utiliza LLM, RAG ou base de conhecimento.

## Response — `200 OK`

```json
{
  "scenario": "C1",
  "mode": "static",
  "environment": "node",
  "filename": "teste.js",
  "analysis": {
    "errorCount": 0,
    "warningCount": 1,
    "alerts": [
      {
        "source": "eslint",
        "ruleId": "no-unused-vars",
        "category": {
          "id": "readability",
          "label": "Legibilidade e clareza"
        },
        "environment": "node",
        "message": "'nome' is assigned a value but never used.",
        "line": 1,
        "column": 7,
        "endLine": 1,
        "endColumn": 11,
        "severity": "warning"
      }
    ]
  }
}
```

`category` pode ser `null` quando não houver associação segura no catálogo.

---

# 2.2. Cenário C2 — LLM isolado

## Request

```json
{
  "code": "const executar = () => new Promise(async (resolve) => { resolve(true); }); executar();",
  "filename": "promiseService.js",
  "environment": "node",
  "mode": "llm"
}
```

## Fluxo

```text
Código
  ↓
Prompt exclusivo C2
  ↓
Ollama / Llama
  ↓
Validação
```

O C2 não recebe ESLint, RAG ou base de conhecimento.

## Response — `200 OK`

```json
{
  "scenario": "C2",
  "mode": "llm",
  "environment": "node",
  "filename": "promiseService.js",
  "prompt": {
    "version": "llm-only-1.0",
    "metadata": {
      "filename": "promiseService.js",
      "environment": "node",
      "promptVersion": "llm-only-1.0",
      "knowledgeDocumentCount": 0,
      "staticAlertCount": 0
    }
  },
  "generation": {
    "provider": "ollama",
    "model": "llama3.2:3b",
    "status": "completed",
    "stopReason": "stop",
    "outputText": "{\"reviews\":[...]}",
    "usage": {
      "inputTokens": 0,
      "outputTokens": 0,
      "totalTokens": 0
    },
    "performance": {
      "totalDurationNs": 0,
      "loadDurationNs": 0,
      "promptEvalDurationNs": 0,
      "evalDurationNs": 0
    },
    "durationMs": 0,
    "generatedAt": "2026-09-11T00:00:00.000Z"
  },
  "validation": {
    "valid": true,
    "stage": "validated",
    "data": {
      "reviews": [
        {
          "reviewId": "review-1",
          "category": {
            "id": "error_handling",
            "label": "Tratamento de erros e fluxos assíncronos"
          },
          "description": "string",
          "justification": "string",
          "suggestion": "string",
          "criticality": "high",
          "line": 1,
          "references": []
        }
      ]
    },
    "errors": []
  }
}
```

### Observações

No C2:

```text
references = []
```

sempre.

O campo `line` pode ser `null`.

---

# 2.3. Cenário C3 — Hybrid

## Request

```json
{
  "code": "const executar = () => new Promise(async (resolve) => { resolve(true); }); executar();",
  "filename": "promiseService.js",
  "environment": "node",
  "mode": "hybrid",
  "maxContexts": 3
}
```

## Fluxo

```text
Código
  ↓
ESLint
  ↓
Classificação
  ↓
Retrieval
  ↓
Prompt Builder
  ↓
Ollama / Llama
  ↓
Validação
```

## Response — `200 OK`

```json
{
  "scenario": "C3",
  "mode": "hybrid",
  "environment": "node",
  "filename": "promiseService.js",
  "analysis": {
    "errorCount": 1,
    "warningCount": 0,
    "alerts": [
      {
        "source": "eslint",
        "ruleId": "no-async-promise-executor",
        "category": {
          "id": "error_handling",
          "label": "Tratamento de erros e fluxos assíncronos"
        },
        "environment": "node",
        "message": "Promise executor functions should not be async.",
        "line": 1,
        "column": 36,
        "endLine": 1,
        "endColumn": 41,
        "severity": "error",
        "contexts": [
          {
            "documentId": "eslint-no-async-promise-executor",
            "technology": "eslint",
            "ruleId": "no-async-promise-executor",
            "title": "Executor assíncrono em Promise",
            "score": 100,
            "retrievalReason": "exact_rule_match"
          }
        ]
      }
    ]
  },
  "retrieval": {
    "maxContextsPerAlert": 3,
    "alertCount": 1,
    "alertsWithContext": 1,
    "totalContexts": 3
  },
  "prompt": {
    "version": "1.0",
    "metadata": {
      "filename": "promiseService.js",
      "environment": "node",
      "alertCount": 1,
      "knowledgeDocumentCount": 3,
      "promptVersion": "1.0"
    }
  },
  "generation": {
    "provider": "ollama",
    "model": "llama3.2:3b",
    "status": "completed",
    "stopReason": "stop",
    "outputText": "{\"reviews\":[...]}",
    "usage": {
      "inputTokens": 1719,
      "outputTokens": 216,
      "totalTokens": 1935
    },
    "durationMs": 57668,
    "generatedAt": "2026-09-11T00:00:00.000Z"
  },
  "validation": {
    "valid": true,
    "stage": "validated",
    "data": {
      "reviews": [
        {
          "alertId": "alert-1",
          "ruleId": "no-async-promise-executor",
          "category": {
            "id": "error_handling",
            "label": "Tratamento de erros e fluxos assíncronos"
          },
          "description": "string",
          "justification": "string",
          "suggestion": "string",
          "criticality": "high",
          "line": 1,
          "references": [
            "eslint-no-async-promise-executor",
            "node-error-handling",
            "shared-promises-async-await"
          ]
        }
      ]
    },
    "errors": []
  }
}
```

---

# 3. Evidências da Revisão

## `POST /api/reviews/evidence`

Endpoint técnico.

Executa ESLint, classificação e recuperação de contexto, mas não chama o LLM.

## Request

```json
{
  "code": "const executar = () => new Promise(async (resolve) => { resolve(true); }); executar();",
  "filename": "promiseService.js",
  "environment": "node",
  "maxContexts": 3
}
```

## Response — `200 OK`

```json
{
  "stage": "pre_generation_evidence",
  "scenario": null,
  "note": "Endpoint técnico para validação da integração entre análise estática e recuperação de contexto. Não representa o cenário híbrido C3.",
  "environment": "node",
  "filename": "promiseService.js",
  "analysis": {
    "errorCount": 1,
    "warningCount": 0,
    "alerts": []
  },
  "retrieval": {
    "maxContextsPerAlert": 3,
    "alertCount": 1,
    "alertsWithContext": 1,
    "totalContexts": 3
  }
}
```

---

# 4. Preview do Prompt

## `POST /api/reviews/prompt-preview`

Endpoint técnico para inspecionar o prompt antes da geração.

## Request

```json
{
  "code": "const executar = () => new Promise(async (resolve) => { resolve(true); }); executar();",
  "filename": "promiseService.js",
  "environment": "node",
  "maxContexts": 3
}
```

## Response — `200 OK`

```json
{
  "stage": "prompt_preview",
  "scenario": null,
  "evidence": {
    "environment": "node",
    "filename": "promiseService.js",
    "alertCount": 1,
    "alertsWithContext": 1,
    "totalContexts": 3
  },
  "prompt": {
    "version": "1.0",
    "systemPrompt": "string",
    "userPrompt": "string JSON serializada",
    "metadata": {
      "filename": "promiseService.js",
      "environment": "node",
      "alertCount": 1,
      "knowledgeDocumentCount": 3,
      "promptVersion": "1.0"
    }
  }
}
```

---

# 5. Preview de Geração

## `POST /api/reviews/generate-preview`

Endpoint técnico para executar geração híbrida e validação sem utilizar o endpoint experimental principal.

## Request

```json
{
  "code": "const executar = () => new Promise(async (resolve) => { resolve(true); }); executar();",
  "filename": "promiseService.js",
  "environment": "node",
  "maxContexts": 3
}
```

## Response — `200 OK`

```json
{
  "stage": "llm_generation_preview",
  "scenario": null,
  "evidence": {
    "environment": "node",
    "filename": "promiseService.js",
    "alertCount": 1,
    "alertsWithContext": 1,
    "totalContexts": 3
  },
  "prompt": {
    "version": "1.0",
    "metadata": {}
  },
  "generation": {
    "provider": "ollama",
    "model": "llama3.2:3b",
    "status": "completed",
    "outputText": "string",
    "usage": {
      "inputTokens": 0,
      "outputTokens": 0,
      "totalTokens": 0
    },
    "durationMs": 0
  },
  "validation": {
    "valid": true,
    "stage": "validated",
    "data": {
      "reviews": []
    },
    "errors": []
  }
}
```

---

# 6. Status da Base de Conhecimento

## `GET /api/knowledge/status`

Consulta o estado atual da base carregada em memória.

### Response — `200 OK`

```json
{
  "status": "ok",
  "knowledgeBase": {
    "documentCount": 8,
    "byTechnology": {
      "eslint": 4,
      "node": 1,
      "react": 2,
      "javascript": 1
    }
  }
}
```

---

# 7. Recuperação Manual da Base

## `POST /api/knowledge/retrieve`

Endpoint técnico para consultar diretamente o Retrieval.

## Request

```json
{
  "ruleId": "no-async-promise-executor",
  "environment": "node",
  "maxContexts": 3
}
```

## Response — `200 OK`

```json
{
  "query": {
    "ruleId": "no-async-promise-executor",
    "environment": "node",
    "category": {
      "id": "error_handling",
      "label": "Tratamento de erros e fluxos assíncronos"
    }
  },
  "retrieval": {
    "count": 3,
    "contexts": [
      {
        "documentId": "eslint-no-async-promise-executor",
        "documentPath": "eslint/no-async-promise-executor.json",
        "technology": "eslint",
        "ruleId": "no-async-promise-executor",
        "title": "Executor assíncrono em Promise",
        "severitySuggestion": "high",
        "score": 100,
        "retrievalReason": "exact_rule_match"
      }
    ]
  }
}
```

## Regra sem contexto

### Request

```json
{
  "ruleId": "no-undef",
  "environment": "node",
  "maxContexts": 3
}
```

### Response

```json
{
  "query": {
    "ruleId": "no-undef",
    "environment": "node",
    "category": null
  },
  "retrieval": {
    "count": 0,
    "contexts": []
  }
}
```

---

# Códigos de erro

## `400 Bad Request`

```json
{
  "error": "invalid_request",
  "message": "Os dados enviados são inválidos.",
  "details": {}
}
```

## `500 Internal Server Error`

Códigos atualmente utilizados podem incluir:

```text
review_execution_failed
review_evidence_failed
prompt_preview_failed
llm_generation_failed
knowledge_base_error
knowledge_retrieval_failed
```

Exemplo:

```json
{
  "error": "review_execution_failed",
  "message": "Não foi possível executar a revisão."
}
```

---

# Categorias metodológicas

## Legibilidade e clareza

```json
{
  "id": "readability",
  "label": "Legibilidade e clareza"
}
```

## Manutenibilidade e estrutura

```json
{
  "id": "maintainability",
  "label": "Manutenibilidade e estrutura"
}
```

## Tratamento de erros e fluxos assíncronos

```json
{
  "id": "error_handling",
  "label": "Tratamento de erros e fluxos assíncronos"
}
```

## Boas práticas em React e Node.js

```json
{
  "id": "best_practices",
  "label": "Boas práticas em React e Node.js"
}
```

---

# Severidades

Alertas do ESLint:

```text
info
warning
error
```

Criticidade das revisões do LLM:

```text
low
medium
high
```

---

# Integração com o frontend

Para o frontend, a principal rota é:

```http
POST /api/reviews
```

O frontend deverá enviar:

```text
code
filename
environment
mode
```

e opcionalmente, no C3:

```text
maxContexts
```

Os endpoints:

```text
/api/reviews/evidence
/api/reviews/prompt-preview
/api/reviews/generate-preview
/api/knowledge/retrieve
```

devem ser tratados principalmente como endpoints técnicos.

---

# Resumo das rotas

```text
GET  /api/health
     → saúde do backend

POST /api/reviews
     → C1 / C2 / C3

POST /api/reviews/evidence
     → ESLint + Retrieval

POST /api/reviews/prompt-preview
     → preview do Prompt Builder

POST /api/reviews/generate-preview
     → geração híbrida técnica

GET  /api/knowledge/status
     → estado da base de conhecimento

POST /api/knowledge/retrieve
     → recuperação manual de contexto
```
