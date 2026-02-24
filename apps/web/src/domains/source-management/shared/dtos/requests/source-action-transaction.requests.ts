import { z } from 'zod';

import { SUPPORTED_LANGUAGES } from '../../value-objects/language-code.vo';

const LanguageSchema = z.enum(SUPPORTED_LANGUAGES as unknown as [string, ...string[]]);

export const CreateSourceActionTransactionRequestSchema = z.object({
  orgId: z.uuid({ message: 'Invalid org ID' }),
  sourceId: z.uuid({ message: 'Invalid source ID' }),
  actionType: z.enum(['extract_content', 'extract_summary']),
  language: LanguageSchema.optional().nullable(),
});

export type CreateSourceActionTransactionRequest = z.output<
  typeof CreateSourceActionTransactionRequestSchema
>;

export const CheckSourceActionTransactionRequestSchema = z.object({
  orgId: z.uuid(),
  sourceId: z.uuid(),
  actionType: z.string(),
  language: LanguageSchema.optional().nullable(),
});

export type CheckSourceActionTransactionRequest = z.output<
  typeof CheckSourceActionTransactionRequestSchema
>;
