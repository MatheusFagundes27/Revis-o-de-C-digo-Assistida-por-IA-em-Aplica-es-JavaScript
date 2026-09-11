# Marco 5 — Construção Inicial da Base de Conhecimento

## Objetivo

Construir uma base de conhecimento curada para fornecer contexto técnico confiável às futuras etapas de recuperação e geração textual.

## Estratégia de fontes

Foram priorizadas documentações oficiais de:

- ESLint;
- React;
- Node.js;
- MDN Web Docs.

A decisão busca aumentar:

- confiabilidade;
- rastreabilidade;
- auditabilidade;
- reprodutibilidade.

## Estrutura

```text
base-conhecimento/
├── eslint/
│   ├── no-unused-vars.json
│   ├── no-unreachable.json
│   ├── no-async-promise-executor.json
│   └── no-promise-executor-return.json
│
├── react/
│   ├── rules-of-hooks.json
│   └── exhaustive-deps.json
│
├── node/
│   └── error-handling.json
│
└── shared/
    └── promises-async-await.json
```

## Quantidade inicial

A base contém inicialmente:

```text
8 documentos
```

Distribuição:

```text
ESLint     → 4
React      → 2
Node.js    → 1
JavaScript → 1
```

## Tipos de documentos

### `rule_documentation`

Documentos diretamente associados a regras.

### `best_practice`

Conhecimento complementar sobre boas práticas.

### `language_concept`

Conteúdo conceitual relacionado à linguagem JavaScript.

## Estrutura dos documentos

Os documentos possuem campos como:

- id;
- documentType;
- technology;
- ruleId;
- environment;
- category;
- title;
- summary;
- technicalReason;
- recommendation;
- severitySuggestion;
- source;
- tags;
- content.

## Proveniência

Cada documento registra:

- fornecedor;
- documento consultado;
- indicação de fonte oficial;
- data de consulta;
- idioma.

## Campo `content`

O campo:

```text
content
```

contém uma síntese textual preparada para utilização pelo mecanismo de recuperação.

Esse conteúdo poderá ser utilizado posteriormente:

- diretamente no prompt;
- em busca textual;
- na geração de embeddings.

## Situação do marco

**Concluído.**

Foram criados e preenchidos oito documentos estruturados com proveniência registrada.
