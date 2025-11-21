/**
 * PDF Block Actions Hooks
 * PDF 블럭의 액션 로직을 훅으로 추출
 */

import { useCallback } from 'react';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

/**
 * PDF 콘텐츠 추출
 */
export function usePdfExtractContent(
  blockId: string,
  blockData: BlockNodeData
) {
  return useCallback(() => {
    const url = (blockData.properties as any)?.url || '';
    console.log('[TODO] PDF 콘텐츠 추출:', { blockId, url });
    // TODO: PDF 콘텐츠 추출 로직 구현
    // 1. PDF 파싱 (pdf.js 등)
    // 2. 텍스트 추출
    // 3. 새로운 텍스트/마크다운 블록으로 생성
  }, [blockId, blockData]);
}

/**
 * PDF 요약
 */
export function usePdfSummarize(blockId: string, blockData: BlockNodeData) {
  return useCallback(() => {
    const url = (blockData.properties as any)?.url || '';
    console.log('[TODO] PDF 요약:', { blockId, url });
    // TODO: PDF 요약 로직 구현
    // 1. PDF 콘텐츠 추출 (위 훅 재사용)
    // 2. LLM을 통한 요약 생성
    // 3. 새로운 마크다운 블록으로 생성
  }, [blockId, blockData]);
}
