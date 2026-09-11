# Marco 3 — Diferenciação entre Node.js e React

## Objetivo

Adaptar o RuleChecker para analisar corretamente códigos pertencentes aos ambientes Node.js e React/browser.

## Alteração no contrato da API

Foi adicionado o campo:

```json
{
  "environment": "node"
}
```

ou:

```json
{
  "environment": "react"
}
```

## Dependências adicionadas

- `globals`
- `eslint-plugin-react-hooks`

## Configuração dinâmica

Para Node.js são utilizadas variáveis globais como:

- `process`;
- `Buffer`;
- `console`.

Para React/browser são consideradas:

- `window`;
- `document`;
- `navigator`;
- `console`.

Também foi habilitado suporte a JSX.

## Regras React

Foram adicionadas inicialmente:

```text
react-hooks/rules-of-hooks
react-hooks/exhaustive-deps
```

## Problema encontrado com JSX

Arquivos `.jsx` inicialmente retornaram:

```text
File ignored because no matching configuration was supplied.
```

A configuração foi corrigida para considerar explicitamente:

```text
*.js
*.jsx
*.mjs
*.cjs
```

Após o ajuste, arquivos JSX passaram a ser analisados normalmente.

## Teste Node.js

Código:

```javascript
console.log(process.env.NODE_ENV);
console.log(usuario);
```

Resultado:

```text
process  → válido
console  → válido
usuario  → no-undef
```

## Teste React

Código:

```javascript
if (ativo) {
  useEffect(() => {
    console.log("ativo");
  }, []);
}
```

Resultado:

```text
react-hooks/rules-of-hooks
```

com severidade `error`.

## Teste de isolamento

Código:

```javascript
document.title = "Teste";
```

executado com:

```json
{
  "environment": "node"
}
```

Resultado:

```text
'document' is not defined.
```

## Situação do marco

**Concluído.**

Foram validados:

- ambiente Node.js;
- ambiente React/browser;
- variáveis globais específicas;
- suporte a JSX;
- regras de Hooks;
- isolamento entre os ambientes.
