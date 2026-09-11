import { z } from "zod";

export const knowledgeDocumentSchema = z.object({
  id: z.string().min(1),

  documentType: z.string().min(1),

  technology: z.string().min(1),

  ruleId: z.string().nullable(),

  environment: z.array(z.enum(["node", "react"])).min(1),

  category: z.object({
    id: z.string().min(1),
    label: z.string().min(1),
  }),

  title: z.string().min(1),

  summary: z.string().min(1),

  technicalReason: z.string().min(1),

  recommendation: z.string().min(1),

  severitySuggestion: z.enum(["low", "medium", "high"]).nullable(),

  source: z.object({
    provider: z.string().min(1),
    document: z.string().min(1),
    official: z.boolean(),
    retrievedAt: z.string().min(1),
    sourceLanguage: z.string().min(1),
  }),

  tags: z.array(z.string()).default([]),

  content: z.string().min(1),
});
