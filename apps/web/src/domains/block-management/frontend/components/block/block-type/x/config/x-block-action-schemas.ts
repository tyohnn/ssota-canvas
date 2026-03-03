import { z } from 'zod';

export const XBlockActionSchemas = {
  summarize: z.object({
    language: z
      .enum(['ko', 'en', 'ja', 'zh', 'es', 'fr', 'de', 'it', 'pt', 'ru'])
      .optional()
      .default('ko'),
  }),
};
