import { Router } from "express";

import {
  createReview,
  createEvidencePreview,
} from "../controllers/reviewController.js";

const router = Router();

router.post("/", createReview);

router.post("/evidence", createEvidencePreview);

export default router;
