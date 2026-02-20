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
  blockMountId: z.string().describe('Block mount ID (8-char slug)'),
  startLine: z.number().min(1).default(1).describe('1-based. Next chunk: startLine = actualEnd + 1'),
  endLine: z.number().min(1).optional().describe('Optional end line. Max 50 lines, 5000 chars per read'),
  source: z
    .enum(['note_content', 'source_content', 'source_summary'])
    .default('note_content')
    .optional()
    .describe(
      'Where to read from: block note_content, linked source extracted content (source_content), or linked source summary (source_summary).'
    ),
  summaryLanguage: z
    .string()
    .optional()
    .describe('When source is source_summary: use supported language code.'),
});

export function createReadBlockLinesTool(
  blockSearchRepo: BlockSearchRepository,
  options?: { pageId?: string }
) {
  return {
    description: `Read block lines. Limits: 50 lines, 5000 chars per call (line-by-line, no mid-line cut). Result has actualStart/actualEnd.

Pagination: startLine = actualEnd + 1 for next chunk. If parallel reads leave gaps, fill with additional read(s) before answerin.

source: note_content | source_content | source_summary. Returns { blockMountId, status, totalLines, chars, actualStart, actualEnd, title, content } (content = formatted with line numbers).`,
    inputSchema: readBlockLinesArgsSchema,
    execute: (args: z.infer<typeof readBlockLinesArgsSchema>) =>
      executeReadBlockLines(blockSearchRepo, args, { pageId: options?.pageId }),
  };
}
