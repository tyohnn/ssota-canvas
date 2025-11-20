/**
 * Markdown Block Actions Hooks
 * Markdown 블럭의 액션 로직을 훅으로 추출
 */

import { useCallback } from 'react';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

/**
 * 마크다운 복사
 */
export function useMarkdownCopy(blockId: string, blockData: BlockNodeData) {
  return useCallback(() => {
    const content = (blockData.properties as any)?.content || '';
    console.log('[TODO] 마크다운 복사:', { blockId, content });
    // TODO: 마크다운 복사 로직 구현
    // 1. 클립보드에 복사
    // 2. 토스트 알림
  }, [blockId, blockData]);
}

/**
 * 마크다운 요약
 */
export function useMarkdownSummarize(
  blockId: string,
  blockData: BlockNodeData
) {
  return useCallback(() => {
    const content = (blockData.properties as any)?.content || '';
    console.log('[TODO] 마크다운 요약:', { blockId, content });
    // TODO: 마크다운 요약 로직 구현
    // 1. LLM으로 요약 생성
    // 2. 새로운 마크다운 블록 생성
  }, [blockId, blockData]);
}
