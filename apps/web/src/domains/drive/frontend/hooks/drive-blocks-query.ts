import type { QueryFunctionContext } from '@tanstack/react-query';
import { listDriveBlocksAction } from '@/domains/drive/actions/list-drive-blocks.action';

import type { DriveBlockListPage } from './use-drive-block-list';

export const DRIVE_BLOCKS_QUERY_KEY = 'drive' as const;

export type DriveTypeFilter =
  | null
  | 'link'
  | 'audio'
  | 'markdown'
  | 'pdf'
  | 'youtube'
  | 'image';

const VALID_TYPE_STRINGS = [
  'link',
  'audio',
  'markdown',
  'pdf',
  'youtube',
  'image',
] as const;

export function parseTypeFilterFromSearch(
  type: string | null | undefined
): DriveTypeFilter {
  if (!type) return null;
  const lower = type.toLowerCase();
  if (VALID_TYPE_STRINGS.includes(lower as (typeof VALID_TYPE_STRINGS)[number])) {
    return lower as DriveTypeFilter;
  }
  return null;
}

export interface DriveBlocksPrefetchParams {
  orgId: string;
  typeFilter: DriveTypeFilter;
}

export function getDriveBlocksQueryKey(
  orgId: string,
  typeFilter: DriveTypeFilter
) {
  return [DRIVE_BLOCKS_QUERY_KEY, 'blocks', orgId, typeFilter ?? null] as const;
}

export function getDriveBlocksQueryOptions(orgId: string, typeFilter: DriveTypeFilter) {
  return {
    queryKey: getDriveBlocksQueryKey(orgId, typeFilter),
    queryFn: async ({ pageParam }: QueryFunctionContext<readonly unknown[], string | undefined>) => {
      const result = await listDriveBlocksAction({
        organizationId: orgId,
        limit: 24,
        cursor: pageParam ?? undefined,
        typeFilter: typeFilter ?? undefined,
      });
      if (!result.success) {
        throw new Error(result.error ?? 'Failed to list drive blocks');
      }
      return result.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: DriveBlockListPage) =>
      lastPage.nextCursor != null ? lastPage.nextCursor : undefined,
  };
}
