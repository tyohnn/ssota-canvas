'use client';

import { useCallback } from 'react';

import type { Node } from '@xyflow/react';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { softDeleteBlockMountAction } from '@/domains/canvas-management/actions/block-mount/soft-delete-block-mount.action';
import {
  type SoftDeleteBlockMountRequestInput,
  SoftDeleteBlockMountRequestSchema,
} from '@/domains/canvas-management/shared/dtos/requests';
import { isFailure } from '@/lib';

export type UseSyncNodeDeleteParams = {
  pageId: string; // fallback용
};

export type UseSyncNodeDeleteResult = {
  syncNodeDelete: (deletedNodes: Node[]) => Promise<void>;
};

/**
 * React Flow onNodesDelete 콜백용 서버 동기화 훅
 *
 * 주의: React Flow의 onNodesDelete는 이미 노드를 제거한 후 호출되므로,
 * optimistic update가 필요 없습니다. 서버 동기화만 수행합니다.
 *
 * - Server Action 백그라운드 동기화
 * - pageId는 deletedNodes의 data에서 추출 (fallback으로 params.pageId 사용)
 */
export function useSyncNodeDelete(
  params: UseSyncNodeDeleteParams
): UseSyncNodeDeleteResult {
  const { pageId } = params;

  const syncNodeDelete = useCallback(
    async (deletedNodes: Node[]) => {
      // 삭제할 노드 ID들 추출 (phantom 노드는 호출 전에 필터링되어 있어야 함)
      const blockMountIds = deletedNodes.map(node => node.id);

      if (blockMountIds.length === 0) {
        return;
      }

      // pageId는 첫 번째 노드의 데이터에서 추출 (모든 노드는 같은 페이지에 있어야 함)
      const firstNode = deletedNodes[0];
      const nodeData = firstNode?.data as BlockNodeData | undefined;
      const extractedPageId = nodeData?.pageId || pageId;

      // Validation
      const rawRequest: SoftDeleteBlockMountRequestInput = {
        blockMountIds,
        pageId: extractedPageId,
      };

      const parseResult =
        SoftDeleteBlockMountRequestSchema.safeParse(rawRequest);
      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        console.error('Failed to sync node delete:', firstError?.message);
        return;
      }

      // Server Action
      const result = await softDeleteBlockMountAction(parseResult.data);
      if (isFailure(result)) {
        console.error('Failed to sync node delete:', result.error);
      }
    },
    [pageId]
  );

  return {
    syncNodeDelete,
  };
}
