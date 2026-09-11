# Marco 1 — Backend Inicial Operacional

## Objetivo

Estruturar a base inicial do backend da aplicação CodeReview AI e disponibilizar um servidor HTTP capaz de receber requisições da futura interface web.

## Ambiente de desenvolvimento

- Sistema operacional: Windows
- Node.js: v24.16.0
- Gerenciador de pacotes: npm
- Shell: Git Bash
- Editor: Visual Studio Code
- Testes da API: Postman

## Tecnologias utilizadas

- Node.js
- Express
- CORS
- dotenv
- Zod
- Nodemon

## Decisões técnicas

O backend foi desenvolvido em Node.js para manter aderência ao ecossistema JavaScript definido no escopo do TCC.

O Express foi utilizado para construção da API HTTP/REST.

O projeto foi configurado com ES Modules:

```json
{
  "type": "module"
}
```

A configuração da aplicação foi separada entre:

- `src/app.js`: configuração do Express, middlewares e rotas;
- `src/server.js`: inicialização do servidor HTTP.

Essa separação reduz o acoplamento e facilita testes futuros.

## Estrutura inicial

```text
BACKEND/
│
├── src/
│   ├── config/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── validators/
│   ├── utils/
│   ├── app.js
│   └── server.js
│
├── docs/
├── .env
├── .env.example
├── .gitignore
├── package.json
└── package-lock.json
```

## Endpoint implementado

```http
GET /api/health
```

Resposta esperada:

```json
{
  "status": "ok",
  "service": "codereview-ai-backend"
}
```

## Resultado

O endpoint foi executado com sucesso e retornou HTTP `200 OK`.

## Situação do marco

**Concluído.**

Foram validados:

- inicialização do projeto Node.js;
- execução do servidor Express;
- configuração de variáveis de ambiente;
- uso de ES Modules;
- estrutura modular do backend;
- endpoint de health check.
