import "dotenv/config";

import app from "./app.js";

import { initializeKnowledgeBase } from "./services/knowledgeBaseService.js";

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    const documents = await initializeKnowledgeBase();

    console.log(
      `Base de conhecimento carregada: ${documents.length} documentos`
    );

    app.listen(PORT, () => {
      console.log(`CodeReview AI Backend executando na porta ${PORT}`);
    });
  } catch (error) {
    console.error("Falha ao inicializar a aplicação:", error);

    process.exit(1);
  }
}

startServer();
