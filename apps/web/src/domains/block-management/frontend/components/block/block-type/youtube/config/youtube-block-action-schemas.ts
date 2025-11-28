import { z } from 'zod';

export const YoutubeBlockActionSchemas = {
  extractScript: z.object({}),
  summarize: z.object({}),
};
