import type { Block } from '@/domains/block-management/shared/entities/block.entity';
import type { IBlockRepository } from '@/domains/block-management/backend/repositories/interfaces/block.repository.interface';
import type { OrganizationId } from '@/domains/organization-management/shared/value-objects/ids.vo';
import type { WorkspaceRepository } from '@/domains/workspace-management/backend/repositories/interfaces/workspace.repository.interface';

export interface ListDriveBlocksOptions {
  limit: number;
  cursor?: string | null;
  typeFilter?: string | null;
}

export interface ListDriveBlocksResult {
  items: Array<{
    id: string;
    title: string | null;
    blockType: string;
    workspaceId: string;
    properties?: Record<string, unknown>;
    content?: unknown;
  }>;
  nextCursor: string | null;
}

function blockToItem(block: Block): ListDriveBlocksResult['items'][0] {
  return {
    id: block.id.value,
    title: block.title,
    blockType: block.blockType.value,
    workspaceId: block.workspaceId.value,
    properties: block.properties.toJSON() as Record<string, unknown>,
    content: block.content,
  };
}

/**
 * List blocks for Drive (org scope): workspaces of org → block list with cursor.
 * Filters: block_type IN (link, audio, markdown, pdf, youtube, image, x); typeFilter narrows if provided.
 */
export async function listDriveBlocks(
  orgId: OrganizationId,
  options: ListDriveBlocksOptions,
  blockRepository: IBlockRepository,
  workspaceRepository: WorkspaceRepository
): Promise<ListDriveBlocksResult> {
  const workspaces = await workspaceRepository.findByOrganizationId(orgId);
  const workspaceIds = workspaces.map(w => w.workspaceId.value);

  if (workspaceIds.length === 0) {
    return { items: [], nextCursor: null };
  }

  const { items, nextCursor } = await blockRepository.listByWorkspaceIds(
    workspaceIds,
    {
      limit: options.limit,
      cursor: options.cursor ?? undefined,
      typeFilter: options.typeFilter ?? undefined,
    }
  );

  return { items: items.map(blockToItem), nextCursor };
}
