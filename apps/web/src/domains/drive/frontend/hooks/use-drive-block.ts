'use client';

import { useQuery } from '@tanstack/react-query';
import type { GetDriveBlockResult } from '@/domains/drive/actions/get-drive-block.action';
import { getDriveBlockAction } from '@/domains/drive/actions/get-drive-block.action';
import type { DriveBlockData } from '@/domains/drive/shared/map-drive-block-result';
import { mapDriveBlockResultToData } from '@/domains/drive/shared/map-drive-block-result';

export type { DriveBlockData };

export function useDriveBlock(
  orgId: string | undefined,
  blockId: string | undefined,
  options?: { initialData?: DriveBlockData }
) {
  return useQuery({
    queryKey: ['drive', 'block', orgId, blockId],
    queryFn: async () => {
      if (!orgId || !blockId) throw new Error('Missing orgId or blockId');
      const result = await getDriveBlockAction({ organizationId: orgId, blockId });
      if (!result.success) throw new Error(result.error ?? 'Failed to load block');
      return mapDriveBlockResultToData(result.data);
    },
    enabled: Boolean(orgId && blockId),
    initialData: options?.initialData,
  });
}
