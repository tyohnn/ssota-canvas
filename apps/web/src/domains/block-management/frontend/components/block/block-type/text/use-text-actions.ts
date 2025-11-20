/**
 * Text Block Actions Hooks
 * Text 블럭의 액션 로직을 훅으로 추출
 */

import { useCallback } from 'react';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

/**
 * 텍스트 복사
 */
export function useTextCopy(blockId: string, blockData: BlockNodeData) {
  return useCallback(() => {
    const content = (blockData.properties as any)?.text || '';
    console.log('[TODO] 텍스트 복사:', { blockId, content });
    // TODO: 텍스트 복사 로직 구현
    // 1. 클립보드에 복사
    // 2. 토스트 알림
  }, [blockId, blockData]);
}
