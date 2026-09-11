import { Router } from "express";

import {
  getKnowledgeStatus,
  retrieveKnowledge,
} from "../controllers/knowledgeController.js";

const router = Router();

router.get("/status", getKnowledgeStatus);

router.post("/retrieve", retrieveKnowledge);

export default router;
