/**
 * Link Block Actions Hooks
 * Link 블럭의 액션 로직을 훅으로 추출
 */

import { useCallback } from 'react';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

/**
 * 링크 요약
 */
export function useLinkSummarize(blockId: string, blockData: BlockNodeData) {
  return useCallback(() => {
    const url = (blockData.properties as any)?.url || '';
    console.log('[TODO] 링크 요약:', { blockId, url });
    // TODO: 링크 요약 로직 구현
    // 1. 웹 페이지 크롤링
    // 2. LLM을 통한 요약 생성
    // 3. 새로운 마크다운 블록으로 생성
  }, [blockId, blockData]);
}
