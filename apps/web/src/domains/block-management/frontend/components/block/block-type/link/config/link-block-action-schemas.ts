import { z } from 'zod';

/** Block Tools inputSchema (요약·추출만 노출, 나머지 숨김) */
export const LinkBlockActionSchemas = {
  fetchMetadata: z.object({}),
  summarize: z.object({
    language: z.enum(['ko', 'en', 'ja', 'zh']).optional().default('ko'),
  }),
  screenshot: z.object({
    fullPage: z.boolean().optional().default(false),
  }),
  extractImages: z.object({}),
  extractDesign: z.object({}),
};
