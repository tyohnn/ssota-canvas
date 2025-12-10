'use client';

import { useState, useCallback } from 'react';
import { useCanvasBlockLifecycle } from '@/domains/canvas-management/frontend/hooks/use-canvas-block-lifecycle';
import {
  getRecentPagesAction,
  searchPagesAction,
} from '@/domains/workspace-management/actions/workspace-management.actions';
import type { RecentPageDTO } from '@/domains/workspace-management/shared/dtos';
import { toast } from '@workspace/ui/components/ui/sonner';
import { isFailure } from '@/lib/action-result';

export interface PageMoveBusinessLogic {
  fetchPages: () => Promise<RecentPageDTO[]>;
  searchPages: (query: string) => Promise<RecentPageDTO[]>;
  moveBlock: (targetPageId: string) => Promise<void>;
  canMoveTo: (pageId: string) => boolean;
}

export function usePageMoveBusiness(
  blockMountId: string,
  currentPageId: string,
  workspaceId: string,
  orgId: string
): PageMoveBusinessLogic {
  const [pages, setPages] = useState<RecentPageDTO[]>([]);
  const blockLifecycle = useCanvasBlockLifecycle({
    pageId: currentPageId,
    workspaceId,
    orgId,
  });

  const fetchPages = useCallback(async () => {
    const result = await getRecentPagesAction({
      workspaceId,
      limit: 20,
    });

    if (result.success) {
      setPages(result.data.pages);
      return result.data.pages;
    }

    console.error('Failed to fetch pages:', result.error);
    toast.error('페이지 목록을 불러오는데 실패했습니다');
    return [];
  }, [workspaceId]);

  const searchPages = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        return [];
      }

      const result = await searchPagesAction({
        workspaceId,
        orgId, // verifyAccess를 위해 필요
        query: query.trim(),
        limit: 50,
      });

      if (result.success && result.data) {
        return result.data.pages;
      }

      // isFailure 타입 가드 사용
      if (isFailure(result)) {
        console.error('Failed to search pages:', result.error);
        toast.error('페이지 검색에 실패했습니다');
      }

      return [];
    },
    [workspaceId, orgId]
  );

  const moveBlock = useCallback(
    async (targetPageId: string) => {
      try {
        await blockLifecycle.moveBlockToPage(blockMountId, targetPageId);
        toast.success('블록이 이동되었습니다');
      } catch (error) {
        console.error('Failed to move block:', error);
        toast.error('블록 이동에 실패했습니다');
        throw error;
      }
    },
    [blockMountId, blockLifecycle]
  );

  const canMoveTo = useCallback(
    (pageId: string) => {
      return pageId !== currentPageId;
    },
    [currentPageId]
  );

  return {
    fetchPages,
    searchPages,
    moveBlock,
    canMoveTo,
  };
}
