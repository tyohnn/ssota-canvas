/**
 * Audio Block Actions Hooks
 * Audio 블럭의 액션 로직을 훅으로 추출
 */

import { useCallback } from 'react';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

/**
 * 오디오 전사 (Transcription)
 */
export function useAudioTranscribe(blockId: string, blockData: BlockNodeData) {
  return useCallback(() => {
    const url = (blockData.properties as any)?.url || '';
    console.log('[TODO] 오디오 전사:', { blockId, url });
    // TODO: 오디오 전사 로직 구현
    // 1. Whisper API로 음성 → 텍스트 변환
    // 2. 새로운 텍스트/마크다운 블록 생성
  }, [blockId, blockData]);
}
