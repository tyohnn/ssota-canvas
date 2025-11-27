import { z } from 'zod';

export const LinkBlockActionSchemas = {
  fetchMetadata: z.object({}),
  summarize: z.object({}),
};
