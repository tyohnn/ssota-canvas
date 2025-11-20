/**
 * Shape Block Actions Hooks
 * Shape 블럭의 액션 로직을 훅으로 추출
 */

import { useCallback } from 'react';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

/**
 * 도형 복제
 */
export function useShapeDuplicate(blockId: string, blockData: BlockNodeData) {
  return useCallback(() => {
    console.log('[TODO] 도형 복제:', { blockId });
    // TODO: 도형 복제 로직 구현
    // 1. 현재 도형 복제
    // 2. 위치 약간 이동하여 생성
  }, [blockId, blockData]);
}
