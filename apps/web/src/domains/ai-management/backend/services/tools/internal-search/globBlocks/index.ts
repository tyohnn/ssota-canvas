/**
 * globBlocks Tool
 *
 * Schema + execution in one place.
 */

import { z } from 'zod';
import type { BlockSearchRepository } from '@/domains/ai-management/backend/repositories/interfaces/block-search.repository.interface';
import { executeGlobBlocks } from './glob-blocks.service';

export type {
  GlobBlocksYield,
  GlobBlocksFinal,
  GlobBlocksIntermediate,
  GlobBlocksArgs,
  GlobBlockEntry,
} from './glob-blocks.service';

const globBlocksArgsSchema = z.object({
  query: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .describe('Title pattern(s). Single string or array. Case-insensitive substring match.'),
  queryMatchMode: z
    .enum(['any', 'all'])
    .default('any')
    .optional()
    .describe('For multiple query patterns: "any" = OR, "all" = AND.'),
  blockTypes: z.array(z.string()).optional().describe('Filter by block types (e.g. ["markdown", "youtube"])'),
  pageId: z.string().optional().describe('Search within this page (default: current page)'),
  workspaceId: z.string().optional().describe('Search across entire workspace'),
  limit: z.number().min(1).max(100).default(50).optional().describe('Max results (default: 50)'),
});

export function createGlobBlocksTool(
  blockSearchRepo: BlockSearchRepository,
  options?: { pageId?: string }
) {
  return {
    description: `Search blocks by metadata (title, type). Does NOT search inside content — use grepBlockContent for that.

Use when: "List all markdown blocks", "Find blocks titled X", "What blocks exist on this page?".

Scope: pageId (default: current page) or workspaceId.

Returns: blockMountId, blockType, title, parentBlockMountId, timestamps.`,
    inputSchema: globBlocksArgsSchema,
    execute: (args: z.infer<typeof globBlocksArgsSchema>) =>
      executeGlobBlocks(blockSearchRepo, args, { pageId: options?.pageId }),
  };
}
