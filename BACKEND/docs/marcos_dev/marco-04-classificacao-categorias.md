# Marco 4 — Classificação dos Alertas nas Categorias do TCC

## Objetivo

Associar alertas determinísticos do ESLint às categorias metodológicas definidas no TCC.

## Categorias

- Legibilidade e clareza;
- Manutenibilidade e estrutura;
- Tratamento de erros e fluxos assíncronos;
- Boas práticas em React e Node.js.

## Estratégia

A classificação não é realizada pelo ESLint.

O fluxo é:

```text
Regra ESLint
     ↓
Catálogo interno
     ↓
Categoria do TCC
```

Regras que ainda não possuem associação segura recebem:

```json
{
  "category": null
}
```

## Arquivos criados

```text
src/config/reviewCategories.js
src/config/ruleCatalog.js
src/services/ruleClassificationService.js
```

## Estrutura dos alertas

Os alertas passaram a incluir:

- source;
- ruleId;
- category;
- environment;
- message;
- line;
- column;
- endLine;
- endColumn;
- severity.

## Testes

### Legibilidade

```text
no-unused-vars
→ Legibilidade e clareza
```

Resultado: aprovado.

### Manutenibilidade

```text
no-unreachable
→ Manutenibilidade e estrutura
```

Resultado: aprovado.

### Tratamento assíncrono

```text
no-async-promise-executor
→ Tratamento de erros e fluxos assíncronos
```

Resultado: aprovado.

### React

```text
react-hooks/rules-of-hooks
→ Boas práticas em React e Node.js
```

Resultado: aprovado.

### Regra não categorizada

```text
no-undef
→ null
```

Resultado: comportamento esperado.

## Múltiplas categorias

Foi validado que um mesmo trecho pode produzir alertas pertencentes a categorias diferentes.

Exemplo:

```javascript
function obterValor() {
  return 10;
  console.log("nunca executado");
}
```

produziu:

```text
no-unused-vars
→ Legibilidade e clareza
```

e:

```text
no-unreachable
→ Manutenibilidade e estrutura
```

## Situação do marco

**Concluído.**

O RuleChecker passou a fornecer uma camada semântica alinhada às categorias metodológicas do TCC.
