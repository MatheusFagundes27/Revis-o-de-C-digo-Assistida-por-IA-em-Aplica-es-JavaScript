import express from "express";
import cors from "cors";

import reviewRoutes from "./routes/reviewRoutes.js";
import knowledgeRoutes from "./routes/knowledgeRoutes.js";

const app = express();

app.use(cors());

app.use(
  express.json({
    limit: "1mb",
  })
);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "codereview-ai-backend",
  });
});

app.use("/api/reviews", reviewRoutes);

app.use("/api/knowledge", knowledgeRoutes);

export default app;
