import { Router } from "express";

import {
  createReview,
  createEvidencePreview,
  createPromptPreview,
  createGenerationPreview,
} from "../controllers/reviewController.js";

const router = Router();

router.post("/", createReview);

router.post("/evidence", createEvidencePreview);

router.post("/prompt-preview", createPromptPreview);

router.post("/generate-preview", createGenerationPreview);
export default router;
