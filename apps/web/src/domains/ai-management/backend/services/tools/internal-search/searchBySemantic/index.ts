/**
 * searchBySemantic Tool
 *
 * Schema + execution in one place.
 */

import { z } from 'zod';
import { executeSearchBySemantic } from './search-by-semantic.service';

export type { SearchBySemanticFinal, SearchBySemanticArgs, SearchBySemanticEntry } from './search-by-semantic.service';

const searchBySemanticArgsSchema = z.object({
  query: z.string().describe('Natural language query describing what to find'),
  topK: z.number().min(1).max(20).default(10).optional().describe('Max results (default: 10, max: 20)'),
  blockTypes: z.array(z.string()).optional().describe('Filter by block types (e.g. ["markdown", "text"])'),
  pageId: z.string().uuid().optional().describe('Page scope (default: current page from context)'),
});

export function createSearchBySemanticTool(options?: { pageId?: string }) {
  return {
    description: `Find contextually relevant blocks using semantic similarity to a natural language query.

Use when: finding blocks related to a concept or topic, discovering similar content with different wording.

MVP: May return stub message or simple text-based similarity. Full embedding-based search is planned.`,
    inputSchema: searchBySemanticArgsSchema,
    execute: (args: z.infer<typeof searchBySemanticArgsSchema>) =>
      executeSearchBySemantic(args, { pageId: options?.pageId }),
  };
}
