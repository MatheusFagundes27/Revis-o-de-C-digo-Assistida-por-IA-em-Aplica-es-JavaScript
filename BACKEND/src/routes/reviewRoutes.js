import { Router } from "express";

import {
  createReview,
  createEvidencePreview,
  createPromptPreview,
} from "../controllers/reviewController.js";

const router = Router();

router.post("/", createReview);

router.post("/evidence", createEvidencePreview);

router.post("/prompt-preview", createPromptPreview);

export default router;
