# Marco 10 — Validação Estrutural e Semântica da Resposta do LLM

## Objetivo

Implementar uma camada de validação para as respostas produzidas pelo modelo de linguagem, garantindo que o conteúdo retornado pelo Llama seja estruturalmente válido e semanticamente compatível com as evidências fornecidas ao modelo.

Até o Marco 9, o sistema recebia a resposta do modelo no campo:

```text
outputText
```

como uma string.

Mesmo quando essa string aparentava conter JSON válido, o backend ainda não verificava formalmente se:

- a estrutura estava correta;
- os campos obrigatórios estavam presentes;
- os identificadores dos alertas eram válidos;
- as regras correspondiam às evidências originais;
- as categorias haviam sido preservadas;
- as linhas estavam corretas;
- as referências realmente pertenciam aos documentos recuperados.

O Marco 10 foi criado para transformar uma resposta probabilística em uma saída controlada pelo backend.

---

## Fluxo implementado

O fluxo passou a ser:

```text
Llama
  ↓
outputText
  ↓
JSON.parse()
  ↓
Validação estrutural com Zod
  ↓
Validação semântica contra as evidências
  ↓
Resposta aceita ou rejeitada
```

Esse mecanismo adiciona uma camada determinística após a geração do LLM.

---

## Arquivos criados

Foram criados:

```text
src/validators/llmReviewValidator.js
src/services/llmResponseValidationService.js
tests/llmResponseValidationService.test.js
```

Também foram atualizados:

```text
src/services/reviewService.js
src/services/promptBuilderService.js
package.json
```

---

## Validação estrutural com Zod

O arquivo:

```text
src/validators/llmReviewValidator.js
```

define o schema esperado da resposta do modelo.

Cada item da revisão deve possuir:

```text
alertId
ruleId
category
description
justification
suggestion
criticality
line
references
```

### Regras estruturais

O schema valida:

- `alertId` no formato `alert-N`;
- `ruleId` como string não vazia;
- `category` como objeto válido ou `null`;
- `description` como string não vazia;
- `justification` como string não vazia;
- `suggestion` como string não vazia;
- `criticality` limitada a:
  - `low`;
  - `medium`;
  - `high`;
- `line` como número inteiro positivo ou `null`;
- `references` como array de strings;
- ausência de referências duplicadas;
- ausência de campos extras inesperados.

Essa etapa é responsável por responder à pergunta:

```text
"A resposta possui a estrutura esperada?"
```

---

## Validação semântica contra as evidências

O arquivo:

```text
src/services/llmResponseValidationService.js
```

é responsável por comparar a resposta estruturalmente válida com os alertas originais produzidos pelo RuleChecker.

Essa etapa verifica se o modelo preservou as evidências fornecidas.

---

## Validações semânticas implementadas

### Existência do `alertId`

O sistema verifica se o `alertId` retornado pelo LLM corresponde a um alerta que realmente foi fornecido no prompt.

Caso contrário, é gerado:

```text
unknown_alert_id
```

---

### Correspondência do `ruleId`

O `ruleId` retornado pelo modelo deve ser exatamente o mesmo associado ao alerta original.

Caso contrário:

```text
rule_id_mismatch
```

---

### Preservação da categoria

A categoria retornada deve ser idêntica à categoria original do alerta.

São comparados:

```text
category.id
category.label
```

Caso a categoria original seja:

```text
null
```

a resposta também deve permanecer:

```text
null
```

Caso contrário:

```text
category_mismatch
```

---

### Correspondência da linha

A linha retornada pelo modelo deve ser a mesma linha do alerta original.

Caso contrário:

```text
line_mismatch
```

---

### Validação das referências

Cada valor presente em:

```text
references
```

deve existir em:

```text
contextDocumentIds
```

do alerta correspondente.

Caso uma referência não tenha sido fornecida ao modelo como contexto, o backend retorna:

```text
invalid_reference
```

Essa validação impede que o LLM invente fontes ou documentos inexistentes.

---

### Detecção de comentários duplicados

O modelo não pode produzir mais de um comentário para o mesmo `alertId`.

Caso isso ocorra:

```text
duplicate_alert_review
```

---

### Detecção de comentários ausentes

Cada alerta esperado deve possuir exatamente um comentário correspondente.

Caso um alerta não receba comentário:

```text
missing_review
```

---

## Estrutura da validação

Quando a resposta é válida, o backend retorna:

```json
{
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

Quando a resposta é inválida, o campo:

```text
valid
```

recebe:

```text
false
```

e `errors` passa a conter os problemas encontrados.

---

## Estágios de falha

A validação diferencia três tipos principais de falha.

### JSON inválido

```text
stage = json_parse
```

Exemplo de erro:

```text
invalid_json
```

---

### Estrutura incompatível

```text
stage = schema_validation
```

Exemplo:

```text
criticality inválida
campo obrigatório ausente
tipo incorreto
```

---

### Inconsistência com as evidências

```text
stage = semantic_validation
```

Exemplo:

```text
unknown_alert_id
rule_id_mismatch
category_mismatch
line_mismatch
invalid_reference
duplicate_alert_review
missing_review
```

---

## Integração com `reviewService`

O `reviewService` passou a executar a validação automaticamente após a geração.

Fluxo:

```text
buildGenerationPreview()
        ↓
buildReviewEvidence()
        ↓
buildReviewPrompt()
        ↓
generateReviewWithLLM()
        ↓
validateLLMResponse()
```

A resposta técnica do endpoint passou a incluir:

```text
generation
validation
```

Isso permite preservar simultaneamente:

- a resposta bruta do modelo;
- a resposta validada pelo backend.

Essa separação será útil posteriormente nos experimentos.

---

## Comportamento quando não há alertas

Quando a análise estática não produz alertas:

```text
alertCount = 0
```

o LLM não é chamado.

Nesse caso, a validação retorna:

```json
{
  "valid": true,
  "stage": "generation_skipped",
  "data": {
    "reviews": []
  },
  "errors": []
}
```

Esse comportamento é específico do fluxo preparatório do cenário híbrido.

---

## Melhoria no idioma da resposta

Durante o primeiro teste positivo, foi observado que o modelo misturava inglês e português.

Por exemplo:

```text
description → inglês
justification → português
suggestion → português
```

Para melhorar a consistência da saída, o `systemPrompt` foi atualizado.

Foi adicionada a regra:

```text
Produza todos os campos textuais gerados, especialmente description,
justification e suggestion, em português do Brasil.
```

Também foi incluído no `userPrompt`:

```json
{
  "responseLanguage": "pt-BR"
}
```

Após essa alteração, a nova execução produziu os campos textuais em português, preservando apenas termos técnicos quando necessário.

---

## Teste real com Llama

Foi executado novamente:

```http
POST /api/reviews/generate-preview
```

com o código:

```javascript
const executar = () =>
  new Promise(async (resolve) => {
    resolve(true);
  });

executar();
```

O ESLint identificou:

```text
no-async-promise-executor
```

A resposta do Llama foi gerada normalmente e passou pela validação.

Resultado:

```text
validation.valid = true
validation.stage = validated
validation.errors = []
```

---

## Dados validados no teste real

A resposta preservou corretamente:

```text
alertId      = alert-1
ruleId       = no-async-promise-executor
category.id  = error_handling
line         = 1
criticality  = high
```

As referências retornadas foram:

```text
eslint-no-async-promise-executor
node-error-handling
shared-promises-async-await
```

Todas correspondiam a documentos realmente associados ao alerta.

---

## Testes automatizados

Foi criado:

```text
tests/llmResponseValidationService.test.js
```

utilizando o módulo nativo:

```text
node:test
```

Foi adicionado ao `package.json`:

```json
{
  "scripts": {
    "test": "node --test"
  }
}
```

---

## Casos automatizados

Foram implementados nove testes.

### 1. Resposta válida

Verifica que uma resposta correta é aceita.

Resultado esperado:

```text
valid = true
stage = validated
```

---

### 2. JSON inválido

Verifica que texto que não pode ser convertido com `JSON.parse()` é rejeitado.

Erro esperado:

```text
invalid_json
```

---

### 3. `alertId` inexistente

Verifica que o modelo não pode criar um alerta inexistente.

Erro esperado:

```text
unknown_alert_id
```

---

### 4. `ruleId` incorreto

Verifica alteração indevida da regra.

Erro esperado:

```text
rule_id_mismatch
```

---

### 5. Categoria incorreta

Verifica alteração indevida da categoria metodológica.

Erro esperado:

```text
category_mismatch
```

---

### 6. Linha incorreta

Verifica alteração indevida da localização do alerta.

Erro esperado:

```text
line_mismatch
```

---

### 7. Referência inexistente

Verifica se o modelo tentou citar um documento não fornecido.

Erro esperado:

```text
invalid_reference
```

---

### 8. Comentário duplicado

Verifica se o modelo produziu mais de um comentário para o mesmo alerta.

Erro esperado:

```text
duplicate_alert_review
```

---

### 9. Comentário ausente

Verifica se algum alerta esperado ficou sem comentário.

Erro esperado:

```text
missing_review
```

---

## Resultado dos testes automatizados

Foi executado:

```bash
npm test
```

Resultado obtido:

```text
✔ aceita uma resposta válida
✔ rejeita JSON inválido
✔ rejeita alertId inexistente
✔ rejeita ruleId diferente do alerta original
✔ rejeita categoria diferente da evidência
✔ rejeita linha diferente do alerta original
✔ rejeita referência inexistente no contexto
✔ rejeita mais de um comentário para o mesmo alerta
✔ rejeita resposta sem comentário para alerta esperado

tests 9
pass 9
fail 0
```

Tempo total aproximado:

```text
285 ms
```

Todos os testes foram aprovados.

---

## Limites da validação automática

A validação implementada verifica propriedades estruturais e rastreáveis.

Ela consegue verificar:

```text
estrutura correta
identidade dos alertas
regra preservada
categoria preservada
linha preservada
referências válidas
ausência de duplicidade
ausência de comentários extras ou ausentes
```

Entretanto, ela não consegue determinar automaticamente se:

```text
description
justification
suggestion
```

são tecnicamente excelentes, claros ou úteis.

Essas propriedades continuam pertencendo à avaliação qualitativa e experimental planejada no TCC.

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
JSON bruto
  ↓
JSON.parse()
  ↓
Zod
  ↓
Validação contra evidências
  ↓
Resposta validada
```

Situação atual:

```text
Retrieval              → implementado
Augmentation           → implementado
Generation             → implementado
Validação estrutural   → implementada
Validação semântica    → implementada
```

---

## Situação do marco

**Concluído.**

Foram validados:

- parsing do JSON retornado pelo LLM;
- validação estrutural com Zod;
- validação de `alertId`;
- validação de `ruleId`;
- validação de categoria;
- suporte a categoria `null`;
- validação de linha;
- validação de referências;
- bloqueio de referências inventadas;
- detecção de comentários duplicados;
- detecção de comentários ausentes;
- manutenção da resposta bruta e da resposta validada;
- melhoria da saída para português do Brasil;
- teste positivo real com Llama;
- criação de testes automatizados;
- execução de nove testes com zero falhas.

A camada de validação da resposta do modelo encontra-se operacional.

---

## Próximo marco

O próximo passo será:

```text
Marco 11 — Formalização dos Cenários C1, C2 e C3
```

O endpoint principal:

```http
POST /api/reviews
```

passará a selecionar o fluxo conforme:

```text
mode
```

### C1 — `static`

```text
Código
  ↓
ESLint
  ↓
Resultado estático
```

### C2 — `llm`

```text
Código
  ↓
Prompt exclusivo para LLM
  ↓
Llama
  ↓
Validação
```

Nesse cenário não será permitido utilizar:

```text
ESLint
RAG
Base de conhecimento
```

### C3 — `hybrid`

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

Essa separação será fundamental para garantir a validade da comparação experimental planejada no TCC.
