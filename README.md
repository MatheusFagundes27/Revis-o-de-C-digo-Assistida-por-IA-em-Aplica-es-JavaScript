# Revisão de Código Assistida por IA em Aplicações JavaScript

Este repositório contém os artefatos técnicos desenvolvidos no contexto do Trabalho de Conclusão de Curso em Engenharia de Computação, cujo tema é **Revisão de Código Assistida por IA em Aplicações JavaScript**.

O projeto propõe uma aplicação web de apoio à revisão de código baseada em uma abordagem híbrida que combina **análise estática**, **recuperação de contexto** e **modelos de linguagem de grande porte**. A solução utiliza alertas gerados pelo ESLint como evidências técnicas para orientar a recuperação de informações relevantes e a geração de comentários de revisão mais claros, úteis e contextualizados.

## Sobre o Projeto

A revisão de código é uma prática importante para a qualidade de software, pois auxilia na identificação de problemas antes que eles cheguem ao ambiente de produção. Entretanto, ferramentas tradicionais de análise estática geralmente produzem alertas técnicos e objetivos, que nem sempre são suficientemente explicativos para o desenvolvedor.

Por outro lado, modelos de linguagem podem gerar explicações mais compreensíveis, mas também podem apresentar respostas incorretas ou não fundamentadas quando utilizados de forma isolada. Diante disso, este projeto propõe uma arquitetura híbrida, na qual os alertas do analisador estático são usados como sinais determinísticos para orientar a geração textual realizada pelo modelo de linguagem.

A proposta mantém o desenvolvedor como responsável pela decisão final, seguindo uma abordagem **Human-in-the-Loop**.

## Objetivo

Desenvolver um protótipo de aplicação web capaz de apoiar o processo de revisão de código em aplicações JavaScript, utilizando análise estática, recuperação de contexto e modelos de linguagem para gerar comentários estruturados sobre problemas de qualidade no código.

## Escopo Técnico

O escopo do projeto está concentrado em aplicações JavaScript, com foco em:

- React;
- Node.js;
- problemas de legibilidade;
- problemas de manutenibilidade;
- tratamento de erros;
- fluxos assíncronos;
- boas práticas em aplicações web.

## Categorias de Problemas Analisadas

O protótipo considera quatro grupos principais de problemas:

1. **Legibilidade e clareza**
   - nomes pouco descritivos;
   - funções extensas;
   - estruturas difíceis de compreender;
   - comentários redundantes;
   - valores mágicos.

2. **Manutenibilidade e estrutura**
   - duplicação de código;
   - acoplamento excessivo;
   - funções com múltiplas responsabilidades;
   - aninhamento profundo;
   - baixa modularização.

3. **Tratamento de erros e fluxos assíncronos**
   - ausência de tratamento de exceções;
   - uso inadequado de `async/await`;
   - blocos `catch` vazios;
   - fluxos assíncronos mal estruturados.

4. **Boas práticas em React e Node.js**
   - uso inadequado de hooks;
   - componentes excessivamente complexos;
   - mistura de lógica de negócio com interface;
   - controladores sobrecarregados;
   - violações de boas práticas do ecossistema.

## Arquitetura Proposta

A solução é composta pelos seguintes módulos principais:

- **Frontend**: interface web para submissão de código e visualização dos resultados.
- **Backend**: orquestrador responsável por receber o código, executar a análise estática, recuperar contexto e acionar o modelo de linguagem.
- **ESLint**: ferramenta de análise estática utilizada para identificar problemas no código JavaScript.
- **Base de conhecimento**: conjunto de informações sobre regras, boas práticas, categorias de problemas e exemplos de refatoração.
- **Módulo de RAG**: mecanismo responsável por recuperar contexto relevante para enriquecer a entrada enviada ao LLM.
- **LLM**: modelo de linguagem utilizado para gerar comentários estruturados de revisão.
- **Relatório final**: resposta estruturada apresentada ao usuário com descrição do problema, justificativa, sugestão de melhoria e criticidade.

## Fluxo de Funcionamento

O fluxo previsto da aplicação é:

1. O usuário submete um trecho de código JavaScript.
2. O backend recebe o código enviado.
3. O ESLint executa a análise estática.
4. Os alertas encontrados são normalizados.
5. A aplicação recupera informações relevantes na base de conhecimento.
6. Um prompt enriquecido é construído com código, alertas e contexto.
7. O modelo de linguagem gera comentários de revisão.
8. A resposta é estruturada em JSON.
9. O frontend apresenta o relatório ao usuário.
10. O desenvolvedor avalia as sugestões e decide se irá aplicá-las.

## Tecnologias Utilizadas

| Camada/Módulo | Tecnologia/Ferramenta | Finalidade |
|---|---|---|
| Frontend | React | Construção da interface web |
| Backend | Node.js | Orquestração da análise e comunicação entre módulos |
| Análise estática | ESLint | Identificação de problemas no código JavaScript |
| Comunicação | API HTTP/REST | Integração entre frontend e backend |
| Base de conhecimento | JSON ou formato equivalente | Armazenamento de regras, boas práticas e exemplos |
| Modelo de linguagem | API de LLM da família GPT | Geração de comentários de revisão |
| Formato de saída | JSON | Padronização das respostas geradas |
| Versionamento | GitHub | Controle de versão e organização do código |
| Prototipação visual | Figma | Planejamento e refinamento das telas da aplicação |

## Estrutura Esperada do Repositório

A estrutura do projeto poderá ser organizada da seguinte forma:

```text
revisao-codigo-ia-js/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── src/
│   ├── eslint/
│   ├── knowledge-base/
│   └── package.json
│
├── docs/
│   ├── arquitetura/
│   ├── telas/
│   └── exemplos/
│
├── examples/
│   ├── readability/
│   ├── maintainability/
│   ├── async-errors/
│   └── react-node-practices/
│
├── README.md
└── LICENSE