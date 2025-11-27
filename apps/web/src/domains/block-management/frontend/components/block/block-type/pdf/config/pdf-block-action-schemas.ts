import { z } from 'zod';

export const PdfBlockActionSchemas = {
  extractContent: z.object({}),
  summarize: z.object({}),
};
