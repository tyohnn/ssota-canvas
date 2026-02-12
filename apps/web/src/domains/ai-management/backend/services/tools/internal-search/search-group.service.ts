/**
 * searchGroup Tool Service
 *
 * Find blocks inside a group/zone by parent_block_mount_id.
 * Uses ConnectionSearchRepository.findBlockMountsWithBlocksByPageId then filters by parent.
 */

import type { ConnectionSearchRepository } from '@/domains/ai-management/backend/repositories/interfaces/connection-search.repository.interface';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';

export interface SearchGroupEntry {
  blockMountId: string;
  blockType: string;
  title: string;
}

export interface SearchGroupFinal {
  blockMountIds: string[];
  blocks: SearchGroupEntry[];
  message: string;
}

export interface SearchGroupArgs {
  groupBlockMountId?: string;
  pageId?: string;
}

export async function executeSearchGroup(
  connectionSearchRepository: ConnectionSearchRepository,
  args: SearchGroupArgs,
  options?: { pageId?: string }
): Promise<SearchGroupFinal> {
  const groupIdStr = args?.groupBlockMountId?.trim();
  const pageIdStr = args?.pageId ?? options?.pageId;

  if (!groupIdStr) {
    return { blockMountIds: [], blocks: [], message: 'groupBlockMountId is required' };
  }
  if (!pageIdStr?.trim()) {
    return { blockMountIds: [], blocks: [], message: 'pageId is required (from context or args)' };
  }

  let pageId: PageId;
  try {
    pageId = new PageId(pageIdStr.trim());
  } catch {
    return { blockMountIds: [], blocks: [], message: 'Invalid pageId' };
  }

  const rows =
    await connectionSearchRepository.findBlockMountsWithBlocksByPageId(pageId);
  const blocks: SearchGroupEntry[] = [];
  for (const { blockMountAggregate, blockAggregate } of rows) {
    const mount = blockMountAggregate.getBlockMount();
    const parentId = mount.parentBlockMountId?.value ?? null;
    if (parentId !== groupIdStr) continue;
    const block = blockAggregate.getBlock();
    const blockMountId = mount.id.value;
    blocks.push({
      blockMountId,
      blockType: block.blockType.value,
      title: block.title,
    });
  }
  const blockMountIds = blocks.map((b) => b.blockMountId);

  return {
    blockMountIds,
    blocks,
    message: `Found ${blocks.length} block(s) in group`,
  };
}
