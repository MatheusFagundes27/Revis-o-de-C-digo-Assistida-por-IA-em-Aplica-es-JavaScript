# Marco 11 — Formalização dos Cenários Experimentais C1, C2 e C3

## Objetivo

Formalizar os três cenários experimentais definidos no TCC dentro do endpoint principal da aplicação:

```http
POST /api/reviews
```

A partir deste marco, o campo:

```text
mode
```

passa a determinar diretamente qual estratégia de revisão será executada.

Os cenários foram implementados da seguinte forma:

```text
mode: static  → C1
mode: llm     → C2
mode: hybrid  → C3
```

Essa separação é central para o desenho experimental do trabalho, pois permite comparar três abordagens distintas sob uma mesma interface de entrada.

---

## Motivação metodológica

Até os marcos anteriores, diferentes partes da arquitetura eram validadas por endpoints técnicos separados, como:

```text
/api/reviews/evidence
/api/reviews/prompt-preview
/api/reviews/generate-preview
```

Esses endpoints foram importantes para desenvolvimento e depuração, mas não representavam formalmente os cenários experimentais.

O Marco 11 consolidou os fluxos em um único endpoint:

```http
POST /api/reviews
```

comportando-se de maneira diferente conforme o valor de `mode`.

---

## Arquitetura consolidada

A arquitetura passou a seguir:

```text
                  POST /api/reviews
                         ↓
                       mode
            ┌────────────┼────────────┐
            ↓            ↓            ↓
         static          llm        hybrid
           C1             C2            C3
            │              │             │
            ↓              ↓             ↓
         ESLint        Prompt C2       ESLint
                           ↓             ↓
                         Llama       Classificação
                           ↓             ↓
                      Validação       Retrieval
                                         ↓
                                   Prompt Builder
                                         ↓
                                       Llama
                                         ↓
                                     Validação
```

---

# Cenário C1 — Análise Estática Isolada

## Objetivo

Representar a análise de código realizada exclusivamente por uma ferramenta determinística de análise estática.

O cenário C1 utiliza:

```text
ESLint
```

e não utiliza:

```text
LLM
RAG
Base de conhecimento
Prompt Builder
```

---

## Fluxo do C1

```text
Código-fonte
     ↓
ESLint
     ↓
Normalização dos alertas
     ↓
Classificação
     ↓
Resposta
```

---

## Serviço responsável

O cenário C1 é executado por:

```text
runStaticReview()
```

no arquivo:

```text
src/services/reviewService.js
```

---

## Requisição de teste

Foi utilizada:

```json
{
  "code": "const nome = 'Matheus'; console.log('teste');",
  "filename": "teste.js",
  "environment": "node",
  "mode": "static"
}
```

---

## Resultado obtido

A resposta apresentou:

```text
scenario = C1
mode = static
```

O ESLint identificou:

```text
no-unused-vars
```

Categoria:

```text
Legibilidade e clareza
```

Severidade:

```text
warning
```

---

## Validação do isolamento do C1

No resultado do C1 não foram encontrados:

```text
generation
prompt
retrieval
knowledgeDocuments
```

Isso confirma que o cenário permanece isolado e utiliza apenas análise estática.

### Resultado

**Aprovado.**

---

# Cenário C2 — LLM Isolado

## Objetivo

Representar uma revisão realizada exclusivamente pelo modelo de linguagem.

O C2 deve analisar diretamente o código-fonte sem receber qualquer evidência proveniente do ESLint ou da base de conhecimento.

O cenário utiliza:

```text
Código
  ↓
Prompt exclusivo do C2
  ↓
Llama
  ↓
Validação
```

---

## Regra de isolamento

O C2 não pode utilizar:

```text
ESLint
resultados de análise estática
ruleId do ESLint
RAG
base de conhecimento
documentos recuperados
```

Essa decisão é necessária para preservar a validade da comparação experimental com o C3.

---

## Contrato exclusivo do C2

Foi criado:

```text
src/config/llmOnlyOutputContract.js
```

Esse contrato define uma estrutura própria para o cenário LLM isolado.

Cada comentário possui:

```text
reviewId
category
description
justification
suggestion
criticality
line
references
```

Diferentemente do cenário híbrido, o C2 não utiliza:

```text
alertId
ruleId
```

porque esses campos dependem da análise estática.

---

## Referências no C2

Como não existe base de conhecimento nesse cenário:

```text
references = []
```

sempre.

O contrato impede que referências sejam inseridas pelo modelo.

---

## Prompt exclusivo do C2

Foi criado:

```text
src/services/llmOnlyPromptBuilderService.js
```

O prompt informa explicitamente ao modelo que:

- nenhuma ferramenta de análise estática foi executada;
- nenhum resultado de ESLint deve ser assumido;
- nenhuma documentação externa deve ser utilizada;
- nenhuma referência deve ser inventada;
- apenas o código-fonte pode ser utilizado como base da revisão.

Também são fornecidas apenas as quatro categorias metodológicas permitidas:

```text
readability
maintainability
error_handling
best_practices
```

---

## Validação do C2

Foram criados:

```text
src/validators/llmOnlyReviewValidator.js
src/services/llmOnlyResponseValidationService.js
```

A validação verifica:

- formato de `reviewId`;
- categoria permitida;
- criticidade válida;
- referências vazias;
- ausência de IDs duplicados;
- linhas compatíveis com o tamanho do código.

A validação do C2 não tenta provar automaticamente que o problema identificado realmente existe.

Essa avaliação continuará sendo realizada no experimento final por meio das rubricas definidas no TCC.

---

## Serviço responsável

O C2 é executado por:

```text
runLLMOnlyReview()
```

---

## Requisição de teste

Foi utilizado:

```json
{
  "code": "const executar = () => new Promise(async (resolve) => { resolve(true); }); executar();",
  "filename": "promiseService.js",
  "environment": "node",
  "mode": "llm"
}
```

---

## Resultado obtido

A resposta apresentou:

```text
scenario = C2
mode = llm
```

Metadados do prompt:

```text
knowledgeDocumentCount = 0
staticAlertCount = 0
```

A geração utilizou:

```text
provider = ollama
model = llama3.2:3b
status = completed
```

A resposta validada apresentou um comentário classificado como:

```text
error_handling
```

e:

```text
references = []
```

A validação retornou:

```text
valid = true
stage = validated
errors = []
```

---

## Validação do isolamento do C2

O resultado não apresentou:

```text
analysis
retrieval
knowledgeDocuments
alertas ESLint
```

Isso confirma que o Llama analisou o código de forma independente.

### Resultado

**Aprovado.**

---

# Cenário C3 — Abordagem Híbrida

## Objetivo

Representar a abordagem híbrida proposta pelo TCC.

O cenário combina:

```text
análise estática
+
classificação
+
recuperação de contexto
+
Prompt Builder
+
LLM
+
validação
```

---

## Fluxo do C3

```text
Código-fonte
     ↓
ESLint
     ↓
Alertas normalizados
     ↓
Classificação
     ↓
Retrieval
     ↓
Base de conhecimento
     ↓
Prompt Builder
     ↓
Ollama / Llama
     ↓
Validação estrutural
     ↓
Validação semântica
     ↓
Resposta
```

---

## Serviço responsável

O cenário C3 é executado por:

```text
runHybridReview()
```

---

## Requisição de teste

Foi utilizado o mesmo código do C2:

```json
{
  "code": "const executar = () => new Promise(async (resolve) => { resolve(true); }); executar();",
  "filename": "promiseService.js",
  "environment": "node",
  "mode": "hybrid",
  "maxContexts": 3
}
```

A utilização do mesmo código nos cenários C2 e C3 facilita a comparação entre as abordagens.

---

## Resultado da análise estática

O ESLint identificou:

```text
no-async-promise-executor
```

Categoria:

```text
Tratamento de erros e fluxos assíncronos
```

Severidade:

```text
error
```

---

## Contextos recuperados

Foram recuperados três documentos.

### Documento específico da regra

```text
eslint-no-async-promise-executor
```

Pontuação:

```text
100
```

Motivo:

```text
exact_rule_match
```

### Documento complementar de Node.js

```text
node-error-handling
```

Pontuação:

```text
70
```

Motivo:

```text
category_environment_match
```

### Documento complementar de JavaScript

```text
shared-promises-async-await
```

Pontuação:

```text
70
```

Motivo:

```text
category_environment_match
```

---

## Geração no C3

A geração foi realizada por:

```text
provider = ollama
model = llama3.2:3b
status = completed
stopReason = stop
```

Isso confirmou que o fluxo híbrido chegou corretamente até a fase de geração.

---

## Validação do C3

A resposta retornou:

```text
valid = true
stage = validated
errors = []
```

O comentário validado preservou:

```text
alertId = alert-1
ruleId = no-async-promise-executor
category.id = error_handling
line = 1
criticality = high
```

As referências retornadas foram:

```text
eslint-no-async-promise-executor
node-error-handling
shared-promises-async-await
```

Todas pertenciam aos documentos efetivamente recuperados para o alerta.

### Resultado

**Aprovado.**

---

# Comparação estrutural dos cenários

Os três cenários passaram a apresentar diferenças explícitas.

## C1

```text
Código
  ↓
ESLint
  ↓
Resultado
```

Características:

```text
análise estática = sim
LLM = não
RAG = não
```

---

## C2

```text
Código
  ↓
Llama
  ↓
Validação
```

Características:

```text
análise estática = não
LLM = sim
RAG = não
```

---

## C3

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
Llama
  ↓
Validação
```

Características:

```text
análise estática = sim
LLM = sim
RAG = sim
```

---

# Controle das variáveis experimentais

Uma decisão importante foi utilizar o mesmo modelo e os mesmos parâmetros de geração nos cenários C2 e C3.

Configuração atual:

```text
modelo      = llama3.2:3b
temperature = 0
seed        = 42
```

Dessa forma, a diferença principal entre C2 e C3 está na abordagem utilizada.

## C2

```text
LLM isolado
```

## C3

```text
LLM apoiado por análise estática e recuperação de contexto
```

Essa decisão reduz a influência de variáveis externas na comparação experimental.

---

# Endpoint principal consolidado

O endpoint:

```http
POST /api/reviews
```

passou a selecionar o cenário de acordo com:

```text
mode
```

### C1

```json
{
  "mode": "static"
}
```

### C2

```json
{
  "mode": "llm"
}
```

### C3

```json
{
  "mode": "hybrid"
}
```

---

# Serviços consolidados

O `reviewService` passou a disponibilizar explicitamente:

```text
runStaticReview()
runLLMOnlyReview()
runHybridReview()
```

Essa organização representa diretamente a metodologia experimental.

---

# Endpoints técnicos anteriores

Os endpoints criados durante os marcos anteriores podem continuar disponíveis para desenvolvimento:

```text
/api/reviews/evidence
/api/reviews/prompt-preview
/api/reviews/generate-preview
```

Entretanto, eles devem ser considerados endpoints técnicos.

O endpoint utilizado para representar os cenários experimentais passou a ser:

```text
/api/reviews
```

---

# Resultados dos testes manuais

Foram executados testes via Postman para os três cenários.

## C1

Resultado:

```text
scenario = C1
mode = static
```

Somente análise estática foi retornada.

**Aprovado.**

---

## C2

Resultado:

```text
scenario = C2
mode = llm
```

O Llama foi executado sem ESLint e sem RAG.

A resposta foi validada:

```text
valid = true
stage = validated
```

**Aprovado.**

---

## C3

Resultado:

```text
scenario = C3
mode = hybrid
```

Foram executados:

```text
ESLint
Retrieval
Prompt Builder
Llama
Validação
```

A resposta final apresentou:

```text
valid = true
stage = validated
errors = []
```

**Aprovado.**

---

# Situação atual do Marco 11

A implementação funcional dos três cenários foi validada manualmente.

Atualmente:

```text
C1 → operacional
C2 → operacional
C3 → operacional
```

Também foi confirmada a separação metodológica entre eles.

---

## Testes automatizados pendentes

Antes do encerramento metodológico definitivo da etapa experimental, recomenda-se adicionar testes automatizados específicos para garantir o isolamento dos cenários.

Os testes deverão verificar, entre outros pontos:

### C1

```text
possui analysis
não possui generation
não possui retrieval
```

### C2

```text
possui generation
possui validation
não possui analysis
não possui retrieval
knowledgeDocumentCount = 0
staticAlertCount = 0
references = []
```

### C3

```text
possui analysis
possui retrieval
possui generation
possui validation
```

Também deverá ser testado que um mesmo código analisado em C2 e C3 não provoca compartilhamento indevido de evidências entre os cenários.

---

# Situação do marco

**Funcionalmente concluído e validado manualmente.**

Foram implementados e validados:

- seleção de cenário por `mode`;
- C1 com análise estática isolada;
- C2 com LLM isolado;
- C3 com abordagem híbrida;
- prompt específico para C2;
- contrato específico para C2;
- validação específica para C2;
- ausência de RAG no C2;
- ausência de LLM no C1;
- uso de Retrieval no C3;
- geração com Ollama e Llama em C2 e C3;
- validação das respostas do C2;
- validação das respostas do C3;
- preservação do mesmo modelo e parâmetros nos cenários baseados em LLM;
- consolidação do endpoint principal `/api/reviews`.

Os testes automatizados de isolamento dos cenários permanecem como melhoria recomendada antes da execução final dos experimentos.

---

# Próximos passos

O próximo passo recomendado é criar testes automatizados para verificar programaticamente a separação entre C1, C2 e C3.

Após essa validação, o backend poderá avançar para uma etapa de consolidação antes da integração com o frontend.

A sequência planejada passa a ser:

```text
Marco 11
C1 / C2 / C3 formalizados
        ↓
Testes automatizados de isolamento
        ↓
Consolidação do backend
        ↓
Frontend React
        ↓
Dataset experimental
        ↓
Execução dos experimentos
        ↓
Comparação C1 × C2 × C3
```

A partir deste marco, a arquitetura implementada passa a representar diretamente o desenho experimental definido no TCC.
