/**
 * grepBlockContent Tool
 *
 * Schema + execution in one place.
 */

import { z } from 'zod';
import type { BlockSearchRepository } from '@/domains/ai-management/backend/repositories/interfaces/block-search.repository.interface';
import { executeGrepBlockContent } from './grep-block-content.service';

export type {
  GrepBlockContentYield,
  GrepBlockContentFinal,
  GrepBlockContentIntermediate,
  GrepBlockContentArgs,
  GrepBlockResult,
  GrepMatch,
} from './grep-block-content.service';

const grepBlockContentArgsSchema = z.object({
  patterns: z.array(z.string()).min(1).describe('Search patterns. One: ["TODO"]. OR: ["TODO", "FIXME"]. AND: use matchMode "all".'),
  matchMode: z.enum(['any', 'all']).default('any').optional().describe('"any" = line matches if it contains any pattern (OR). "all" = line must contain every pattern (AND).'),
  invert: z.boolean().default(false).optional().describe('If true, return lines that do NOT match the pattern(s) (like grep -v).'),
  targetBlockMountIds: z.array(z.string()).optional().describe('Search only these specific blocks'),
  blockTypes: z.array(z.string()).optional().describe('Filter by block types (e.g. ["markdown", "text"])'),
  pageId: z.string().optional().describe('Search within this page (default: current page)'),
  workspaceId: z.string().optional().describe('Search across entire workspace'),
});

export function createGrepBlockContentTool(
  blockSearchRepo: BlockSearchRepository,
  options?: { pageId?: string }
) {
  return {
    description: `Search for text patterns inside block content. Like terminal grep, but for canvas blocks.

Searches block content_raw, linked source extracted content (e.g. YouTube transcript, PDF text), and linked source AI summary. Returns matching lines with context (5 lines). Use read to fetch more context if needed.

Use when:
- User asks: "Where does this keyword appear?", "Find all blocks mentioning X", "Search for a phrase in content".
- You need context: to understand what's on the page, what the current work state is, or what terms/topics appear in content before acting or answering. Use grep to ground your understanding in actual content.
- patterns: ["TODO"] (single) or ["TODO", "FIXME"] (OR).
- matchMode "all": line must contain every pattern (AND).
- invert: true = return lines that do NOT match (like grep -v).

Scope priority: targetBlockMountIds > pageId > workspaceId. Default scope = current page.

Returns: blockMountId + line number + matching line + surrounding context lines.`,
    inputSchema: grepBlockContentArgsSchema,
    execute: (args: z.infer<typeof grepBlockContentArgsSchema>) =>
      executeGrepBlockContent(blockSearchRepo, args, { pageId: options?.pageId }),
  };
}
