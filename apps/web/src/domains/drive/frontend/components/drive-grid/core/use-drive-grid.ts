'use client';

import type { DriveBlockListPage } from '@/domains/drive/frontend/hooks/use-drive-block-list';
import { useDriveBlockList } from '@/domains/drive/frontend/hooks/use-drive-block-list';
import type { DriveTypeFilter } from '@/domains/drive/frontend/hooks/drive-blocks-query';

export interface UseDriveGridParams {
  orgId: string;
  typeFilter: DriveTypeFilter;
  /** First page from server (Next.js RSC). */
  initialPage?: DriveBlockListPage | null;
  /** Type filter used when server fetched initialPage. If different from typeFilter, initialPage is ignored. */
  initialTypeFilter?: DriveTypeFilter;
}

/**
 * Orchestration hook for Drive grid page.
 * Uses domain hook useDriveBlockList; flattens pages to blocks for the view.
 */
export function useDriveGrid({
  orgId,
  typeFilter,
  initialPage,
  initialTypeFilter,
}: UseDriveGridParams) {
  const effectiveInitialPage =
    typeFilter === initialTypeFilter ? initialPage : undefined;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useDriveBlockList({
    orgId,
    folderId: undefined,
    typeFilter: typeFilter ?? undefined,
    search: undefined,
    initialPage: effectiveInitialPage,
  });

  const blocks = data?.pages?.flatMap(page => page.items) ?? [];

  return {
    blocks,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    isLoading,
  };
}
