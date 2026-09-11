# Diário de Desenvolvimento — CodeReview AI

## Etapa 1 — Inicialização do Backend

### Objetivo

Estruturar o backend inicial da aplicação CodeReview AI e disponibilizar
um servidor HTTP capaz de receber futuras requisições do frontend.

### Tecnologias utilizadas

- Node.js
- Express
- CORS
- dotenv
- Zod
- Nodemon

### Decisões técnicas

O backend foi desenvolvido em Node.js para manter aderência ao
ecossistema JavaScript definido no escopo do trabalho.

O framework Express foi escolhido para construção da API HTTP/REST
devido à sua simplicidade e facilidade de integração com os módulos
previstos na arquitetura.

A aplicação foi separada entre `app.js` e `server.js` para facilitar
testes e reduzir o acoplamento entre configuração da aplicação e
inicialização do servidor.

### Estrutura inicial

O backend foi organizado em módulos separados para:

- rotas;
- controladores;
- serviços;
- validação;
- configuração;
- funções auxiliares.

Essa organização prepara a aplicação para a implementação dos módulos
de análise estática, recuperação de contexto e integração com LLM.

### Endpoint implementado

GET /api/health

Objetivo: verificar se o backend está disponível.

Resposta esperada:



### Ambiente de desenvolvimento

- Node.js: v24.16.0
- Gerenciador de pacotes: npm
- Sistema operacional: Windows
- Shell utilizado: Git Bash



## Etapa 2 — Integração programática com ESLint

### Objetivo

Implementar o módulo determinístico da arquitetura responsável
pela análise estática do código JavaScript submetido pelo usuário.

### Implementação

A integração com o ESLint foi realizada através de sua API para
Node.js utilizando o método `lintText()`, permitindo analisar
diretamente código-fonte recebido através da API HTTP.

O módulo foi implementado como serviço independente denominado
`eslintService`, correspondendo ao componente RuleChecker definido
na arquitetura do TCC.

### Dados extraídos

Para cada alerta foram normalizados:

- identificador da regra;
- mensagem;
- linha;
- coluna;
- linha final;
- coluna final;
- severidade.

### Endpoint

POST /api/reviews

### Modos planejados

- static — análise estática isolada;
- llm — modelo de linguagem isolado;
- hybrid — abordagem híbrida.

Na etapa atual apenas o modo `static` encontra-se implementado.

### Justificativa arquitetural

A normalização dos alertas desacopla a aplicação do formato interno
do ESLint e fornece uma representação própria para as etapas
posteriores de recuperação de contexto e construção de prompts.

### Ajuste na configuração de variáveis globais

Durante os primeiros testes da integração programática com o ESLint,
a ferramenta classificou o identificador `console` como variável não
definida por meio da regra `no-undef`.

Esse comportamento ocorria porque a configuração inicial do analisador
não declarava explicitamente as variáveis globais disponíveis nos
ambientes considerados pela aplicação.

Como ajuste inicial, `console` foi registrado como variável global
somente para leitura. Essa configuração eliminou o falso alerta sem
desabilitar a regra `no-undef`, permitindo que referências realmente
não declaradas, como variáveis inexistentes, continuem sendo
identificadas.

