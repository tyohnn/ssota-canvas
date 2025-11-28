/**
 * Markdown Block Action Schemas
 *
 * Markdown 블럭의 액션 파라미터 Zod 스키마
 * use-block-action-executor에서 런타임 검증에 사용
 */

import { z } from 'zod';

export const MarkdownBlockActionSchemas = {
  summarize: z.object({}),

  translate: z.object({
    targetLanguage: z
      .string()
      .describe('Target language code (e.g., "ko", "en", "ja")'),
  }),
};
