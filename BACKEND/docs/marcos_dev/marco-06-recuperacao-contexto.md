# Marco 6 — Carregamento e Recuperação de Contexto

## Objetivo

Implementar o componente responsável por carregar, validar e recuperar documentos relevantes da base de conhecimento.

Essa etapa corresponde à camada inicial de Retrieval da arquitetura RAG.

## Arquivos criados

```text
src/services/knowledgeBaseService.js
src/controllers/knowledgeController.js
src/routes/knowledgeRoutes.js
src/validators/knowledgeDocumentValidator.js
src/validators/knowledgeRetrievalValidator.js
```

## Validação da base

Todos os documentos JSON são validados utilizando Zod.

Caso um documento apresente:

- JSON inválido;
- campo obrigatório ausente;
- tipo incorreto;

a inicialização da aplicação é interrompida.

## Carregamento

A aplicação percorre recursivamente:

```text
base-conhecimento/
```

e carrega os documentos em memória.

Resultado validado:

```text
Base de conhecimento carregada: 8 documentos
```

## Endpoint de status

```http
GET /api/knowledge/status
```

Resultado:

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

## Endpoint de recuperação

```http
POST /api/knowledge/retrieve
```

Exemplo:

```json
{
  "ruleId": "no-async-promise-executor",
  "environment": "node",
  "maxContexts": 3
}
```

## Estratégia de recuperação

A recuperação atual é determinística e baseada em metadados.

Ainda não são utilizados embeddings ou similaridade vetorial.

### Match exato

Quando:

```text
document.ruleId == alert.ruleId
```

o documento recebe:

```text
score = 100
retrievalReason = exact_rule_match
```

### Match complementar

Documentos com:

```json
{
  "ruleId": null
}
```

podem ser recuperados quando categoria e ambiente correspondem.

Recebem:

```text
score = 70
retrievalReason = category_environment_match
```

## Teste com Promise

Consulta:

```json
{
  "ruleId": "no-async-promise-executor",
  "environment": "node",
  "maxContexts": 3
}
```

Foram recuperados:

```text
eslint-no-async-promise-executor
score 100
exact_rule_match
```

```text
node-error-handling
score 70
category_environment_match
```

```text
shared-promises-async-await
score 70
category_environment_match
```

## Teste React

Consulta:

```json
{
  "ruleId": "react-hooks/rules-of-hooks",
  "environment": "react",
  "maxContexts": 3
}
```

Resultado:

```text
react-rules-of-hooks
score 100
exact_rule_match
```

O documento `react-exhaustive-deps` não foi recuperado apenas por pertencer à mesma categoria.

Esse comportamento confirma a proteção contra ruído.

## Significado do score

Os valores utilizados não representam similaridade semântica.

Atualmente:

```text
100 → correspondência exata de regra
70  → correspondência por categoria + ambiente
```

Portanto, o mecanismo atual deve ser descrito como:

**recuperação determinística baseada em metadados.**

## Relação com RAG

Fluxo completo esperado:

```text
Retrieval
    ↓
Augmentation
    ↓
Generation
```

Situação atual:

```text
Retrieval    → implementado
Augmentation → ainda não implementado
Generation   → ainda não implementado
```

## Testes ainda pendentes

Ainda serão executados:

```text
no-unused-vars
→ regra conhecida com apenas um documento
```

e:

```text
no-undef
→ regra sem categoria e sem contexto disponível
```

## Situação do marco

**Em validação final.**

A implementação principal está operacional, restando os testes finais de comportamento para regra conhecida e regra não documentada.
