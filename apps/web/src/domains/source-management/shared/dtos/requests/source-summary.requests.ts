import { z } from 'zod';

import { BlockSlugParamSchema } from './source.requests';
import { SUPPORTED_LANGUAGES } from '../../value-objects/language-code.vo';

const LanguageSchema = z.enum(SUPPORTED_LANGUAGES as unknown as [string, ...string[]]);

export const CreateSourceSummaryRequestSchema = z.object({
  sourceId: z.uuid({ message: 'Invalid source ID' }),
  language: LanguageSchema,
  summary: z.string().min(1, 'Summary is required'),
  keywords: z.array(z.string()).optional().default([]),
});

export type CreateSourceSummaryRequest = z.output<
  typeof CreateSourceSummaryRequestSchema
>;

export const GetSourceSummaryRequestSchema = z.object({
  sourceId: z.uuid({ message: 'Invalid source ID' }),
  language: LanguageSchema,
});

export type GetSourceSummaryRequest = z.output<
  typeof GetSourceSummaryRequestSchema
>;

export const ProcessSourceSummaryRequestSchema = z.object({
  sourceId: z.uuid({ message: 'Invalid source ID' }),
  language: LanguageSchema,
  orgId: z.uuid({ message: 'Invalid org ID' }),
});

export type ProcessSourceSummaryRequest = z.output<
  typeof ProcessSourceSummaryRequestSchema
>;

/** Block-based request for processSourceSummaryAction (secure action resolves block/org/sourceId) */
export const ProcessSourceSummaryByBlockRequestSchema = z.object({
  workspaceId: z.uuid(),
  blockId: BlockSlugParamSchema,
  language: LanguageSchema,
});

export type ProcessSourceSummaryByBlockRequest = z.output<
  typeof ProcessSourceSummaryByBlockRequestSchema
>;

export const EnsureSourceSummaryRequestSchema = z.object({
  sourceId: z.uuid(),
  orgId: z.uuid(),
  language: LanguageSchema,
});

export type EnsureSourceSummaryRequest = z.output<
  typeof EnsureSourceSummaryRequestSchema
>;
