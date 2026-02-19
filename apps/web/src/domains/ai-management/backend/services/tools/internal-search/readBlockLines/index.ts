/**
 * readBlockLines Tool
 *
 * Schema + execution in one place.
 */

import { z } from 'zod';
import type { BlockSearchRepository } from '@/domains/ai-management/backend/repositories/interfaces/block-search.repository.interface';
import { executeReadBlockLines } from './read-block-lines.service';

export type {
  ReadBlockLinesYield,
  ReadBlockLinesFinal,
  ReadBlockLinesIntermediate,
  ReadBlockLinesArgs,
  ReadBlockLinesSource,
} from './read-block-lines.service';

const readBlockLinesArgsSchema = z.object({
  blockMountId: z.string().describe('The block mount ID to read from'),
  startLine: z.number().min(1).default(1).describe('Starting line number (1-based, default: 1)'),
  endLine: z.number().min(1).optional().describe('Ending line (reads to end if omitted)'),
  source: z
    .enum(['content_raw', 'source_content', 'source_summary'])
    .default('content_raw')
    .optional()
    .describe(
      'Where to read from: block content_raw, linked source extracted content, or linked source summary.'
    ),
  summaryLanguage: z
    .string()
    .optional()
    .describe('When source is source_summary: language code (e.g. "ko", "en").'),
});

export function createReadBlockLinesTool(
  blockSearchRepo: BlockSearchRepository,
  options?: { pageId?: string }
) {
  return {
    description: `Read specific lines from a block's content. Use when you need more detail than the provided context — e.g. when editing, or when you need to verify or inspect block content. Often used after grep to fetch full lines for a matched block. source: content_raw (default), source_content (transcript), source_summary; summaryLanguage selects summary language. Returns line-numbered text.`,
    inputSchema: readBlockLinesArgsSchema,
    execute: (args: z.infer<typeof readBlockLinesArgsSchema>) =>
      executeReadBlockLines(blockSearchRepo, args, { pageId: options?.pageId }),
  };
}
