/**
 * Python Block Action Schemas
 */

import { z } from 'zod';

export const PythonActionSchemas = {
  formatCode: z.object({}),

  refactor: z.object({
    style: z.enum(['functional', 'object-oriented', 'clean']),
  }),

  addComments: z.object({}),

  execute: z.object({}),
};
