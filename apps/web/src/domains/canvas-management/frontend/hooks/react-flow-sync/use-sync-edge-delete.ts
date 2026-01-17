'use client';

import { useCallback } from 'react';

import type { Edge } from '@xyflow/react';

import { deleteEdgeAction } from '@/domains/canvas-management/actions/edge/delete-edge.action';
import {
  type DeleteEdgeRequestInput,
  DeleteEdgeRequestSchema,
} from '@/domains/canvas-management/shared/dtos/requests';
import { isFailure } from '@/lib';

export type UseSyncEdgeDeleteResult = {
  syncEdgeDelete: (deletedEdges: Edge[]) => Promise<void>;
};

/**
 * React Flow onEdgesDelete 콜백용 서버 동기화 훅
 *
 * 주의: React Flow의 onEdgesDelete는 이미 엣지를 제거한 후 호출되므로,
 * optimistic update가 필요 없습니다. 서버 동기화만 수행합니다.
 *
 * - Server Action 백그라운드 동기화
 * - 병렬 처리로 여러 엣지 삭제 지원
 */
export function useSyncEdgeDelete(): UseSyncEdgeDeleteResult {
  const syncEdgeDelete = useCallback(async (deletedEdges: Edge[]) => {
    // 삭제할 엣지 ID들 추출
    const edgeIds = deletedEdges.map(edge => edge.id);

    if (edgeIds.length === 0) {
      return;
    }

    // 각 엣지를 삭제 (병렬 처리)
    await Promise.all(
      edgeIds.map(async edgeId => {
        // Validation
        const rawRequest: DeleteEdgeRequestInput = {
          edgeId,
        };

        const parseResult = DeleteEdgeRequestSchema.safeParse(rawRequest);
        if (!parseResult.success) {
          const firstError = parseResult.error.issues[0];
          console.error('Failed to sync edge delete:', firstError?.message);
          return;
        }

        // Server Action
        const result = await deleteEdgeAction(parseResult.data);
        if (isFailure(result)) {
          console.error('Failed to sync edge delete:', result.error);
        }
      })
    );
  }, []);

  return {
    syncEdgeDelete,
  };
}
