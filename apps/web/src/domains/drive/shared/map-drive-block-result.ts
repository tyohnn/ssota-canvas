import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { BlockType } from '@/domains/block-management/shared/types/block-types';
import type { GetDriveBlockResult } from '@/domains/drive/actions/get-drive-block.action';

export type DriveBlockData = BlockNodeData & {
  workspaceId: string;
  blockSlug?: string;
};

/**
 * Maps GetDriveBlockResult (server) to DriveBlockData (client).
 * Shared for server page and client hook.
 */
export function mapDriveBlockResultToData(
  data: GetDriveBlockResult
): DriveBlockData {
  return {
    blockMountId: data.id,
    blockId: data.id,
    blockType: data.blockType as BlockType,
    title: data.title,
    viewMode: 'original',
    properties: data.properties as BlockNodeData['properties'],
    customProperties: data.customProperties as unknown as BlockNodeData['customProperties'],
    content: data.content,
    contentVersion: data.contentVersion,
    sourceId: data.sourceId ?? undefined,
    blockSlug: data.blockSlug,
    createdByProfile: data.createdByProfile,
    workspaceId: data.workspaceId,
  } as DriveBlockData;
}
