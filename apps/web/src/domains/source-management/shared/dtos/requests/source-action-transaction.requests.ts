import { z } from 'zod';

import { SUPPORTED_LANGUAGES } from '../../value-objects/language-code.vo';

const LanguageSchema = z.enum(SUPPORTED_LANGUAGES as unknown as [string, ...string[]]);

export const CreateSourceActionTransactionRequestSchema = z.object({
  orgId: z.string().uuid({ message: 'Invalid org ID' }),
  sourceId: z.string().uuid({ message: 'Invalid source ID' }),
  actionType: z.enum(['extract_content', 'extract_summary']),
  language: LanguageSchema.optional().nullable(),
});

export type CreateSourceActionTransactionRequest = z.output<
  typeof CreateSourceActionTransactionRequestSchema
>;

export const CheckSourceActionTransactionRequestSchema = z.object({
  orgId: z.string().uuid(),
  sourceId: z.string().uuid(),
  actionType: z.string(),
  language: LanguageSchema.optional().nullable(),
});

export type CheckSourceActionTransactionRequest = z.output<
  typeof CheckSourceActionTransactionRequestSchema
>;
