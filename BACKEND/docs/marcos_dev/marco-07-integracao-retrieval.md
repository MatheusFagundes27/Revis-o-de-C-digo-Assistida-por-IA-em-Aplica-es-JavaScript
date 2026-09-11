# Marco 7 — Integração entre RuleChecker e Recuperação de Contexto

## Objetivo

Integrar o módulo de análise estática baseado em ESLint com o mecanismo de recuperação de contexto da base de conhecimento.

O objetivo desta etapa foi permitir que os alertas produzidos pelo RuleChecker fossem automaticamente enriquecidos com documentos relevantes da base de conhecimento, preparando o fluxo que futuramente alimentará o Prompt Builder e o cenário híbrido da pesquisa.

Nesta etapa ainda não há integração com modelo de linguagem.

---

## Motivação arquitetural

Até o Marco 6, os dois fluxos funcionavam de forma separada:

```text
POST /api/reviews
→ ESLint / RuleChecker
```

e:

```text
POST /api/knowledge/retrieve
→ Base de conhecimento
```

O Marco 7 passou a integrar esses componentes internamente:

```text
Código-fonte
     ↓
RuleChecker / ESLint
     ↓
Alertas normalizados
     ↓
Classificação
     ↓
KnowledgeBaseService
     ↓
Contextos recuperados
```

Essa integração prepara o conjunto de evidências que será utilizado nas etapas posteriores do RAG.

---

## Preservação do cenário C1

Uma decisão importante desta etapa foi manter o modo `static` isolado da recuperação de contexto.

O cenário C1 deve continuar representando exclusivamente a análise estática:

```text
Código
  ↓
ESLint
  ↓
Resultado
```

Por esse motivo, a chamada:

```http
POST /api/reviews
```

com:

```json
{
  "mode": "static"
}
```

continua retornando somente os resultados do ESLint, sem o campo `contexts`.

A recuperação de contexto foi adicionada em um endpoint técnico separado, utilizado apenas para validar a integração antes da implementação completa do cenário híbrido.

---

## Novos serviços

Foram criados os arquivos:

```text
src/services/contextEnrichmentService.js
src/services/reviewService.js
```

### `contextEnrichmentService.js`

Responsável por receber os alertas produzidos pelo RuleChecker e recuperar contextos individualmente para cada um deles.

Fluxo:

```text
Alertas
   ↓
Para cada alerta
   ↓
retrieveContextForAlert()
   ↓
Alerta + contexts
```

O serviço não executa análise estática, não monta prompts e não chama modelos de linguagem.

### `reviewService.js`

Passou a funcionar como serviço de orquestração da revisão.

Ele coordena:

- execução do ESLint;
- definição do nome de arquivo efetivo;
- enriquecimento dos alertas;
- cálculo de informações resumidas da recuperação.

A estrutura arquitetural passou a ser:

```text
reviewController
      ↓
reviewService
      ├── eslintService
      └── contextEnrichmentService
                    ↓
             knowledgeBaseService
```

Essa organização reduz o acoplamento do controller com detalhes de implementação.

---

## Alterações no controller

O `reviewController.js` deixou de chamar diretamente o `eslintService`.

Antes:

```text
Controller
   ↓
ESLint
```

Após a refatoração:

```text
Controller
   ↓
reviewService
   ↓
Serviços especializados
```

O controller passou a ser responsável principalmente por:

- receber a requisição;
- validar os dados;
- selecionar o fluxo apropriado;
- retornar a resposta HTTP.

---

## Validação das requisições

O arquivo:

```text
src/validators/reviewValidator.js
```

passou a disponibilizar dois schemas:

```text
reviewRequestSchema
reviewEvidenceSchema
```

### `reviewRequestSchema`

Utilizado pelo endpoint principal de revisão.

Mantém suporte aos modos:

```text
static
llm
hybrid
```

Embora, nesta etapa, apenas `static` esteja implementado.

### `reviewEvidenceSchema`

Utilizado pelo endpoint técnico de evidências.

Além de código, arquivo e ambiente, permite informar:

```text
maxContexts
```

com limite entre 1 e 5 documentos por alerta.

---

## Endpoint técnico de evidências

Foi adicionado:

```http
POST /api/reviews/evidence
```

Esse endpoint executa:

```text
Código
  ↓
ESLint
  ↓
Alertas
  ↓
Classificação
  ↓
Recuperação de contexto
  ↓
Evidências estruturadas
```

A resposta utiliza:

```json
{
  "stage": "pre_generation_evidence",
  "scenario": null
}
```

O valor `scenario: null` é intencional.

O endpoint ainda não representa o cenário híbrido C3, pois o Prompt Builder e o modelo de linguagem ainda não foram integrados.

---

## Estrutura da resposta

Cada alerta produzido pelo RuleChecker pode receber:

```json
{
  "contexts": []
}
```

Quando documentos relevantes forem encontrados, o campo contém os contextos recuperados.

Cada contexto inclui informações como:

- identificador do documento;
- caminho do documento;
- tecnologia;
- regra relacionada;
- categoria;
- título;
- resumo;
- justificativa técnica;
- recomendação;
- criticidade sugerida;
- conteúdo;
- fonte;
- score;
- motivo da recuperação.

Também foi adicionado um resumo global da recuperação:

```json
{
  "retrieval": {
    "maxContextsPerAlert": 3,
    "alertCount": 1,
    "alertsWithContext": 1,
    "totalContexts": 3
  }
}
```

---

## Teste 1 — Preservação do modo `static`

Foi executada uma requisição para:

```http
POST /api/reviews
```

com:

```json
{
  "code": "const nome = 'Matheus'; console.log('teste');",
  "filename": "teste.js",
  "environment": "node",
  "mode": "static"
}
```

Resultado:

```text
no-unused-vars
```

com categoria:

```text
Legibilidade e clareza
```

O resultado não apresentou o campo `contexts`.

### Resultado do teste

Aprovado.

O cenário C1 permaneceu isolado da recuperação de contexto.

---

## Teste 2 — Recuperação automática para fluxo assíncrono

Foi executada uma requisição para:

```http
POST /api/reviews/evidence
```

com:

```json
{
  "code": "const executar = () => new Promise(async (resolve) => { resolve(true); }); executar();",
  "filename": "promiseService.js",
  "environment": "node",
  "maxContexts": 3
}
```

O ESLint identificou:

```text
no-async-promise-executor
```

Categoria:

```text
Tratamento de erros e fluxos assíncronos
```

Foram recuperados três contextos:

```text
eslint-no-async-promise-executor
score = 100
retrievalReason = exact_rule_match
```

```text
node-error-handling
score = 70
retrievalReason = category_environment_match
```

```text
shared-promises-async-await
score = 70
retrievalReason = category_environment_match
```

Resumo:

```json
{
  "maxContextsPerAlert": 3,
  "alertCount": 1,
  "alertsWithContext": 1,
  "totalContexts": 3
}
```

### Resultado do teste

Aprovado.

A recuperação de contexto foi executada automaticamente a partir do alerta produzido pelo RuleChecker.

---

## Teste 3 — Regra sem contexto disponível

Foi executada a análise de:

```javascript
console.log(usuario);
```

Resultado do ESLint:

```text
no-undef
```

Categoria:

```text
null
```

Contextos retornados:

```json
[]
```

Resumo:

```json
{
  "maxContextsPerAlert": 3,
  "alertCount": 1,
  "alertsWithContext": 0,
  "totalContexts": 0
}
```

### Resultado do teste

Aprovado.

O sistema não inventou classificação ou contexto para uma regra sem documentação disponível na base.

---

## Teste 4 — Múltiplos alertas

Foi analisado:

```javascript
function obterValor() {
  return 10;
  console.log("nunca executado");
}
```

Foram identificados dois alertas.

### Alerta 1

```text
no-unused-vars
```

Categoria:

```text
Legibilidade e clareza
```

Contexto recuperado:

```text
eslint-no-unused-vars
score = 100
retrievalReason = exact_rule_match
```

### Alerta 2

```text
no-unreachable
```

Categoria:

```text
Manutenibilidade e estrutura
```

Contexto recuperado:

```text
eslint-no-unreachable
score = 100
retrievalReason = exact_rule_match
```

Resumo:

```json
{
  "maxContextsPerAlert": 3,
  "alertCount": 2,
  "alertsWithContext": 2,
  "totalContexts": 2
}
```

### Resultado do teste

Aprovado.

O mecanismo de recuperação foi executado individualmente para cada alerta.

---

## Estado atual do fluxo

Após a conclusão deste marco, o backend possui o seguinte fluxo determinístico:

```text
Código-fonte
     ↓
ESLint
     ↓
Alertas normalizados
     ↓
Classificação metodológica
     ↓
Recuperação de contexto
     ↓
Evidências estruturadas
```

O cenário C1 continua funcionando separadamente:

```text
Código
  ↓
ESLint
  ↓
Resultado estático
```

---

## Relação com RAG

O sistema possui atualmente:

```text
Retrieval    → implementado
Augmentation → próximo marco
Generation   → ainda não implementado
```

O Marco 7 não implementa o cenário híbrido completo.

Ele prepara as evidências que futuramente serão utilizadas pelo Prompt Builder.

---

## Situação do marco

**Concluído.**

Foram validados:

- preservação do cenário estático sem recuperação de contexto;
- integração automática entre RuleChecker e KnowledgeBaseService;
- recuperação de múltiplos contextos para um único alerta;
- comportamento correto para regra sem contexto disponível;
- recuperação individual por alerta;
- suporte a múltiplos alertas na mesma análise;
- resumo da quantidade de alertas e contextos recuperados;
- separação entre fluxo técnico de evidências e cenário experimental C3.

A etapa determinística de geração de evidências encontra-se operacional.

---

## Próximo marco

O próximo passo será o:

```text
Marco 8 — Prompt Builder
```

Seu objetivo será transformar:

```text
Código-fonte
+
Alertas estáticos
+
Contextos recuperados
+
Instruções do sistema
+
Formato esperado da resposta
```

em um prompt estruturado para utilização pelo modelo de linguagem.

Esse marco corresponderá à etapa inicial de **Augmentation** da arquitetura RAG.
