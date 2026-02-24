/**
 * searchGroup Tool
 *
 * Schema + execution in one place.
 */

import { z } from 'zod';
import type { ConnectionSearchRepository } from '@/domains/ai-management/backend/repositories/interfaces/connection-search.repository.interface';
import { executeSearchGroup } from './search-group.service';

export type { SearchGroupFinal, SearchGroupArgs, SearchGroupEntry } from './search-group.service';

const searchGroupArgsSchema = z.object({
  groupBlockMountId: z.string().uuid().describe('Parent group/zone block mount ID'),
  pageId: z.string().uuid().optional().describe('Page scope (default: current page from context)'),
});

export function createSearchGroupTool(
  connectionSearchRepo: ConnectionSearchRepository,
  options?: { pageId?: string }
) {
  return {
    description: `Find blocks inside a group or zone (blocks whose parent is the given group block mount).

Use when: "What is inside this group?", "List blocks in this zone."

Returns: blockMountIds and metadata (blockType, title) of direct children.`,
    inputSchema: searchGroupArgsSchema,
    execute: (args: z.infer<typeof searchGroupArgsSchema>) =>
      executeSearchGroup(connectionSearchRepo, args, { pageId: options?.pageId }),
  };
}
