'use client';

import type { InfiniteData } from '@tanstack/react-query';
import { useInfiniteQuery } from '@tanstack/react-query';

import {
  getDriveBlocksQueryOptions,
  parseTypeFilterFromSearch,
  type DriveTypeFilter,
} from './drive-blocks-query';

export interface DriveBlockListParams {
  orgId: string;
  folderId?: string | null;
  typeFilter?: DriveTypeFilter | string | null;
  search?: string | null;
  /** First page from server (Next.js RSC). */
  initialPage?: { items: DriveBlockListItem[]; nextCursor: string | null } | null;
}

export interface DriveBlockListItem {
  id: string;
  title: string | null;
  blockType: string;
  workspaceId: string;
  properties?: Record<string, unknown>;
  content?: unknown;
}

export interface DriveBlockListPage {
  items: DriveBlockListItem[];
  nextCursor: string | null;
}

export function useDriveBlockList(params: DriveBlockListParams) {
  const { orgId, typeFilter, initialPage } = params;
  const filter = parseTypeFilterFromSearch(
    typeFilter != null ? String(typeFilter) : undefined
  );

  const options = getDriveBlocksQueryOptions(orgId, filter);

  return useInfiniteQuery({
    ...options,
    ...(initialPage != null && {
      initialData: {
        pages: [initialPage],
        pageParams: [undefined],
      } satisfies InfiniteData<DriveBlockListPage>,
    }),
    staleTime: 60 * 1000,
  });
}
