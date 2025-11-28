/**
 * YouTube Block Actions Hooks
 * YouTube 블럭의 액션 로직을 훅으로 추출
 */

import { useCallback } from 'react';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

/**
 * YouTube 스크립트 추출
 */
export function useYoutubeExtractScript(
  blockId: string,
  blockData: BlockNodeData
) {
  return useCallback(() => {
    const url = (blockData.properties as any)?.url || '';
    console.log('[TODO] YouTube 스크립트 추출:', { blockId, url });
    // TODO: YouTube 스크립트 추출 로직 구현
    // 1. YouTube Data API 또는 youtube-transcript API 사용
    // 2. 자막/스크립트 추출
    // 3. 새로운 텍스트 블록 또는 마크다운 블록으로 생성
  }, [blockId, blockData]);
}

/**
 * YouTube 요약
 */
export function useYoutubeSummarize(blockId: string, blockData: BlockNodeData) {
  return useCallback(() => {
    const url = (blockData.properties as any)?.url || '';
    console.log('[TODO] YouTube 요약:', { blockId, url });
    // TODO: YouTube 요약 로직 구현
    // 1. 스크립트 추출 (위 훅 재사용 가능)
    // 2. LLM을 통한 요약 생성
    // 3. 새로운 마크다운 블록으로 생성
  }, [blockId, blockData]);
}
