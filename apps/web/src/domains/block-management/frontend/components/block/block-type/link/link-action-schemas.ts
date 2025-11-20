import { z } from 'zod';

export const LinkActionSchemas = {
  fetchMetadata: z.object({}),
  summarize: z.object({}),
};

