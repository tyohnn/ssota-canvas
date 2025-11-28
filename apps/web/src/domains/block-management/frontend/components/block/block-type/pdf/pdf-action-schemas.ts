import { z } from 'zod';

export const PdfActionSchemas = {
  extractContent: z.object({}),
  summarize: z.object({}),
};

