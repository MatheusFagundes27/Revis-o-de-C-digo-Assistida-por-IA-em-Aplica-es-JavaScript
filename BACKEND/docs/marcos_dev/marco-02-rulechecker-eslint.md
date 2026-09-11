# Marco 2 — RuleChecker com ESLint

## Objetivo

Implementar o componente determinístico responsável pela análise estática do código JavaScript submetido pelo usuário.

Esse componente corresponde ao RuleChecker definido na arquitetura do TCC.

## Implementação

A integração com o ESLint foi realizada por meio de sua API para Node.js.

Foi utilizado:

```javascript
lintText()
```

Esse método permite analisar diretamente código-fonte recebido como string pela API HTTP.

O serviço foi implementado em:

```text
src/services/eslintService.js
```

## Endpoint

```http
POST /api/reviews
```

Exemplo de requisição:

```json
{
  "code": "const nome = \"Matheus\"; console.log(usuario);",
  "filename": "teste.js",
  "mode": "static"
}
```

## Modos planejados

```text
static  → análise estática isolada
llm     → modelo de linguagem isolado
hybrid  → abordagem híbrida
```

Na etapa atual somente `static` está implementado.

## Estrutura dos alertas

Para cada alerta são normalizados:

- ruleId;
- message;
- line;
- column;
- endLine;
- endColumn;
- severity.

Exemplo:

```json
{
  "ruleId": "no-unused-vars",
  "message": "'nome' is assigned a value but never used.",
  "line": 1,
  "column": 7,
  "endLine": 1,
  "endColumn": 11,
  "severity": "warning"
}
```

## Problema identificado

Nos primeiros testes, o ESLint retornou:

```text
'console' is not defined.
```

por meio da regra:

```text
no-undef
```

O problema estava relacionado à ausência de configuração das variáveis globais do ambiente.

Inicialmente `console` foi configurado como global somente para leitura.

Essa solução foi posteriormente substituída por uma configuração baseada na biblioteca `globals`.

## Testes

Código:

```javascript
const nome = "Matheus";
console.log(usuario);
```

Resultado esperado e obtido:

```text
no-unused-vars
no-undef
```

## Fluxo implementado

```text
Código JavaScript
        ↓
POST /api/reviews
        ↓
Validação
        ↓
Controller
        ↓
RuleChecker
        ↓
ESLint
        ↓
Normalização
        ↓
JSON
```

## Situação do marco

**Concluído.**

Foram implementados e validados:

- integração programática com ESLint;
- endpoint de revisão;
- validação de entrada com Zod;
- normalização dos alertas;
- classificação de severidade;
- testes com Postman.
