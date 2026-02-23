import { z } from 'zod';

import { SOURCE_TYPES } from '../../value-objects/source-type.vo';
import { SUPPORTED_LANGUAGES } from '../../value-objects/language-code.vo';

/** Block slug (8–10 hex). Used by secure-action with findByWorkspaceIdAndSlug. */
export const BlockSlugParamSchema = z
  .string()
  .min(8, 'Block slug must be at least 8 characters')
  .max(10, 'Block slug must be at most 10 characters')
  .regex(/^[0-9a-f]{8,10}$/i, 'Block slug must be 8-10 hex characters');

const SourceTypeSchema = z.enum(SOURCE_TYPES as unknown as [string, ...string[]]);
const LanguageSchema = z.enum(SUPPORTED_LANGUAGES as unknown as [string, ...string[]]);

export const CreateSourceRequestSchema = z.object({
  url: z.url({ message: 'Invalid URL' }).min(1, 'URL is required'),
  sourceType: SourceTypeSchema,
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
  contentLanguage: z.string().length(2).optional().nullable(),
  rawContent: z.string().optional(),
});

export type CreateSourceRequest = z.output<typeof CreateSourceRequestSchema>;
export type CreateSourceRequestInput = z.input<typeof CreateSourceRequestSchema>;

export const FindOrCreateSourceRequestSchema = CreateSourceRequestSchema;
export type FindOrCreateSourceRequest = z.output<typeof FindOrCreateSourceRequestSchema>;

export const UpdateSourceRawContentRequestSchema = z.object({
  sourceId: z.uuid({ message: 'Invalid source ID' }),
  rawContent: z.string(),
  extractedAt: z.coerce.date(),
  structuredPayload: z.unknown().optional(),
});

export type UpdateSourceRawContentRequest = z.output<
  typeof UpdateSourceRawContentRequestSchema
>;

export const ExtractSourceContentRequestSchema = z.object({
  sourceId: z.uuid({ message: 'Invalid source ID' }),
  url: z.string().url(),
  sourceType: SourceTypeSchema,
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type ExtractSourceContentRequest = z.output<
  typeof ExtractSourceContentRequestSchema
>;

export const GetSourceContentRequestSchema = z.object({
  sourceId: z.uuid({ message: 'Invalid source ID' }),
});

export type GetSourceContentRequest = z.output<
  typeof GetSourceContentRequestSchema
>;

export const GetSourceContentByBlockRequestSchema = z.object({
  workspaceId: z.uuid(),
  blockId: BlockSlugParamSchema,
});

export type GetSourceContentByBlockRequest = z.output<
  typeof GetSourceContentByBlockRequestSchema
>;
