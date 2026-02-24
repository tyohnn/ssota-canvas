/**
 * hopSearch Tool
 *
 * Schema + execution in one place.
 */

import { z } from 'zod';
import type { ConnectionSearchRepository } from '@/domains/ai-management/backend/repositories/interfaces/connection-search.repository.interface';
import { executeHopSearch } from './hop-search.service';

export type { HopSearchFinal, HopSearchArgs, HopSearchEntry, HopSearchEdgeInfo } from './hop-search.service';

const hopSearchArgsSchema = z.object({
  startBlockMountId: z.string().uuid().describe('Starting block mount ID'),
  hops: z.number().min(1).max(3).default(1).optional().describe('Number of hops (default: 1, max: 3)'),
  direction: z.enum(['out', 'in', 'both']).default('out').optional().describe('Edge direction: out, in, or both'),
  pageId: z.string().uuid().optional().describe('Page scope (default: current page from context)'),
});

export function createHopSearchTool(
  connectionSearchRepo: ConnectionSearchRepository,
  options?: { pageId?: string }
) {
  return {
    description: `Find blocks N-hops away from a starting block via edge connections.

Use when: exploring block relationships, finding connected blocks in a workflow, discovering related blocks through graph traversal.

- hops: 1 = directly connected, 2 = through one intermediary, 3 = max depth.
- direction: "out" (default) = follow outgoing edges, "in" = incoming, "both" = both directions.

Returns: blockMountIds and byHop entries with blockMountId, hop, edges (label, stroke, strokeWidth per connection).`,
    inputSchema: hopSearchArgsSchema,
    execute: (args: z.infer<typeof hopSearchArgsSchema>) =>
      executeHopSearch(connectionSearchRepo, args, { pageId: options?.pageId }),
  };
}
