'use client';

import { useQuery } from '@tanstack/react-query';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { BlockType } from '@/domains/block-management/shared/types/block-types';
import type { GetDriveBlockResult } from '@/domains/drive/actions/get-drive-block.action';
import { getDriveBlockAction } from '@/domains/drive/actions/get-drive-block.action';

export type DriveBlockData = BlockNodeData & {
  workspaceId: string;
  /** 8-10 hex slug for source-management APIs */
  blockSlug?: string;
};

function mapToBlockNodeData(data: GetDriveBlockResult): DriveBlockData {
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

export function useDriveBlock(orgId: string | undefined, blockId: string | undefined) {
  return useQuery({
    queryKey: ['drive', 'block', orgId, blockId],
    queryFn: async () => {
      if (!orgId || !blockId) throw new Error('Missing orgId or blockId');
      const result = await getDriveBlockAction({ organizationId: orgId, blockId });
      if (!result.success) throw new Error(result.error ?? 'Failed to load block');
      return mapToBlockNodeData(result.data);
    },
    enabled: Boolean(orgId && blockId),
  });
}
