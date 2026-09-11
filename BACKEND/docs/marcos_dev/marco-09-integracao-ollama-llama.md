# Marco 9 — Integração Local com LLM usando Ollama e Llama

## Objetivo

Integrar o backend do CodeReview AI a um modelo de linguagem executado localmente, utilizando Ollama como runtime e Llama 3.2 3B como modelo inicial.

O objetivo desta etapa foi implementar a fase de **Generation** do fluxo RAG, conectando o Prompt Builder desenvolvido no Marco 8 a um LLM local, sem dependência de créditos de API externa.

---

## Motivação da mudança de provedor

Inicialmente foi considerada a integração com uma API externa de modelo de linguagem.

Durante os testes, verificou-se que o uso da API exigia créditos específicos da plataforma de API, independentes da assinatura do ChatGPT.

Para evitar custos adicionais durante o desenvolvimento e aumentar o controle experimental, optou-se por utilizar um modelo local.

A solução adotada foi:

```text
Ollama
+
Llama 3.2 3B
```

Essa decisão permitiu:

- execução local;
- ausência de custo por chamada;
- maior controle sobre o ambiente experimental;
- possibilidade de fixar modelo e parâmetros;
- independência de disponibilidade de créditos externos;
- maior privacidade sobre os trechos de código analisados.

---

## Branch de desenvolvimento

A implementação foi realizada em uma branch separada:

```text
feat/llama-local
```

---

## Instalação do Ollama

O Ollama foi instalado localmente no Windows.

Após a instalação, foi validada a disponibilidade do comando:

```bash
ollama --version
```

Em seguida, o modelo foi baixado:

```bash
ollama pull llama3.2:3b
```

A instalação foi confirmada por:

```bash
ollama list
```

O modelo `llama3.2:3b`, com aproximadamente 2 GB, passou a ficar disponível localmente.

---

## Dependência adicionada ao backend

Foi instalada a biblioteca JavaScript do Ollama:

```bash
npm install ollama
```

---

## Configuração de ambiente

O `.env` passou a utilizar:

```env
PORT=3000

LLM_PROVIDER=ollama

OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2:3b

OLLAMA_MAX_OUTPUT_TOKENS=2500
OLLAMA_TEMPERATURE=0
OLLAMA_SEED=42
```

O `.env.example` recebeu a mesma estrutura, sem informações sensíveis.

A temperatura `0` e a seed fixa `42` foram adotadas para reduzir variabilidade entre execuções e aumentar a reprodutibilidade dos testes.

---

## Estrutura criada

Foram criados:

```text
src/config/llmConfig.js
src/services/llmService.js
src/services/llmProviders/ollamaProvider.js
```

A estrutura passou a seguir:

```text
reviewService
     ↓
llmService
     ↓
ollamaProvider
     ↓
Ollama
     ↓
Llama 3.2 3B
```

---

## `llmConfig.js`

O arquivo `src/config/llmConfig.js` é responsável por validar e disponibilizar as configurações relacionadas ao LLM.

A validação utiliza Zod e contempla:

- provedor;
- URL do Ollama;
- nome do modelo;
- limite de saída;
- temperatura;
- seed.

---

## `llmService.js`

O arquivo `src/services/llmService.js` funciona como camada de abstração entre o restante da aplicação e o provedor do modelo.

O objetivo dessa separação é evitar que o restante da aplicação dependa diretamente da biblioteca Ollama e permitir a inclusão de outros provedores futuramente.

---

## `ollamaProvider.js`

Foi criado:

```text
src/services/llmProviders/ollamaProvider.js
```

Esse módulo é responsável por:

- inicializar o cliente Ollama;
- enviar `systemPrompt`;
- enviar `userPrompt`;
- configurar o modelo;
- definir parâmetros de geração;
- receber a resposta;
- extrair métricas de tokens;
- extrair métricas de desempenho.

---

## Uso do contrato estruturado

O contrato definido no Marco 8:

```text
REVIEW_OUTPUT_CONTRACT
```

passou a ser enviado diretamente ao Ollama por meio do parâmetro `format`.

A geração é, portanto, orientada para produzir uma resposta compatível com o JSON Schema definido pelo sistema.

O contrato inclui:

- `alertId`;
- `ruleId`;
- `category`;
- `description`;
- `justification`;
- `suggestion`;
- `criticality`;
- `line`;
- `references`.

Apesar dessa orientação estrutural, nesta etapa a resposta ainda é tratada como texto bruto.

---

## Integração com `reviewService`

Foi adicionada ao `reviewService` a função responsável por executar o fluxo de geração.

Fluxo:

```text
buildGenerationPreview()
        ↓
buildPromptPreview()
        ↓
buildReviewEvidence()
        ↓
ESLint
        ↓
Classificação
        ↓
Retrieval
        ↓
Prompt Builder
        ↓
LLM
```

---

## Tratamento para ausência de alertas

Quando:

```text
alertCount = 0
```

o modelo não é chamado.

A geração é marcada como:

```json
{
  "skipped": true,
  "reason": "no_static_alerts"
}
```

Esse comportamento é válido para o fluxo preparatório do futuro cenário híbrido C3.

---

## Endpoint técnico de geração

Foi criado:

```http
POST /api/reviews/generate-preview
```

Esse endpoint executa:

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
Ollama
  ↓
Llama
  ↓
Resposta bruta
```

A resposta utiliza:

```json
{
  "stage": "llm_generation_preview",
  "scenario": null
}
```

O endpoint ainda é técnico e não representa formalmente o cenário experimental C3.

---

## Teste realizado

Foi utilizado:

```javascript
const executar = () =>
  new Promise(async (resolve) => {
    resolve(true);
  });

executar();
```

Requisição:

```json
{
  "filename": "promiseService.js",
  "environment": "node",
  "maxContexts": 3
}
```

---

## Evidências recuperadas

O ESLint identificou:

```text
no-async-promise-executor
```

Categoria:

```text
Tratamento de erros e fluxos assíncronos
```

Foram recuperados:

```text
eslint-no-async-promise-executor
node-error-handling
shared-promises-async-await
```

Resumo:

```text
alertCount = 1
alertsWithContext = 1
totalContexts = 3
knowledgeDocumentCount = 3
```

---

## Resultado da geração

A geração foi concluída com sucesso.

```text
provider   = ollama
model      = llama3.2:3b
status     = completed
stopReason = stop
```

O motivo `stop` indica encerramento normal da geração.

---

## Uso de tokens

Foram registrados:

```text
inputTokens  = 1719
outputTokens = 216
totalTokens  = 1935
```

Esses dados poderão ser utilizados posteriormente na análise experimental.

---

## Tempo de execução

Foi registrado:

```text
durationMs = 57668
```

Valor aproximado:

```text
57,7 segundos
```

As métricas internas indicaram aproximadamente:

```text
carregamento do modelo   ≈ 3,1 s
avaliação do prompt      ≈ 34,1 s
geração da resposta      ≈ 20,4 s
```

Essas métricas poderão ser utilizadas posteriormente para distinguir carregamento, processamento da entrada e geração da saída.

---

## Estrutura produzida pelo modelo

O campo `outputText` retornou um JSON com estrutura equivalente a:

```json
{
  "reviews": [
    {
      "alertId": "alert-1",
      "ruleId": "no-async-promise-executor",
      "category": {
        "id": "error_handling",
        "label": "Tratamento de erros e fluxos assíncronos"
      },
      "description": "...",
      "justification": "...",
      "suggestion": "...",
      "criticality": "high",
      "line": 1,
      "references": [
        "eslint-no-async-promise-executor",
        "node-error-handling",
        "shared-promises-async-await"
      ]
    }
  ]
}
```

Visualmente, o modelo:

- preservou `alertId`;
- preservou `ruleId`;
- manteve a categoria;
- utilizou criticidade compatível;
- produziu descrição;
- produziu justificativa;
- produziu sugestão;
- utilizou referências existentes no contexto;
- retornou conteúdo em formato JSON.

Esses comportamentos ainda não são considerados formalmente validados nesta etapa.

---

## Limitação atual

O campo:

```text
outputText
```

continua sendo uma string.

Mesmo quando o conteúdo aparenta ser JSON válido, a aplicação ainda não executa validação estrutural e semântica.

Portanto, nesta etapa o sistema apenas registra a resposta bruta produzida pelo modelo.

---

## Estado atual da arquitetura

Após este marco:

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
Ollama
  ↓
Llama
  ↓
Resposta bruta
```

Situação do RAG:

```text
Retrieval    → implementado
Augmentation → implementado
Generation   → implementado
Validação    → ainda não implementada
```

---

## Preservação dos cenários experimentais

O endpoint principal com `mode: "static"` continua representando o cenário C1.

O endpoint:

```http
POST /api/reviews/generate-preview
```

permanece sendo um endpoint técnico.

O cenário C3 somente será considerado formalmente implementado após a inclusão da validação da saída do LLM.

---

## Situação do marco

**Concluído.**

Foram validados:

- instalação local do Ollama;
- disponibilidade do Llama 3.2 3B;
- configuração por variáveis de ambiente;
- abstração por `llmService`;
- provider específico para Ollama;
- integração do Prompt Builder com o modelo;
- geração local sem API externa;
- conclusão normal da geração;
- obtenção da resposta textual;
- orientação por JSON Schema;
- coleta de tokens;
- coleta de métricas de desempenho;
- execução completa da fase de Generation.

A fase de **Generation** da arquitetura RAG encontra-se operacional.

---

## Próximo marco

O próximo passo será:

```text
Marco 10 — Validação da Resposta do LLM
```

Fluxo planejado:

```text
outputText
   ↓
JSON.parse()
   ↓
Zod
   ↓
Validação estrutural
   ↓
Validação contra as evidências
   ↓
Resposta aceita ou rejeitada
```

Serão verificadas regras como:

- o `alertId` existe;
- o `ruleId` corresponde ao alerta original;
- a categoria é a mesma do alerta;
- as referências pertencem aos documentos associados;
- a criticidade pertence ao conjunto permitido;
- não existem comentários para alertas inexistentes;
- a resposta segue o contrato esperado.
