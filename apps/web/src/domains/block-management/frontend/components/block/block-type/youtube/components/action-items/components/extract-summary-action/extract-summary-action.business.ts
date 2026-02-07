/**
 * Extract Summary Action Business Logic
 *
 * 순수 함수로 추출된 비즈니스 로직
 * - Hook과 executeAction 모두에서 사용 가능
 * - ensureVideoSummaryAction 사용: 이미 요약 있으면 completed, 없으면 queue job (Realtime 추적)
 */
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { YoutubeBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';
import { ensureVideoSummaryAction } from '@/domains/youtube-app-space/actions/summary/ensure-video-summary.action';
import { isFailure } from '@/lib';

export interface ExtractSummaryResult {
  success: boolean;
  error?: string;
}

/**
 * YouTube 요약 확보 비즈니스 로직 (ensure: 있으면 완료 표시, 없으면 큐 등록)
 *
 * @param blockId - 블록 ID
 * @param blockData - 블록 데이터
 * @param language - 언어 코드 (optional, 기본값 en)
 * @returns 추출 결과
 */
export async function extractSummaryAction(
  blockId: string,
  blockData: BlockNodeData,
  language?: string
): Promise<ExtractSummaryResult> {
  const properties = blockData.properties as YoutubeBlockProperties;
  const youtubeId = properties.youtubeId;

  if (!youtubeId) {
    return {
      success: false,
      error: 'YouTube ID not found',
    };
  }

  try {
    const result = await ensureVideoSummaryAction({
      blockId,
      youtubeId,
      language: language || 'en',
    });

    if (isFailure(result)) {
      return {
        success: false,
        error: result.error || 'Failed to ensure summary',
      };
    }
    return { success: true };
  } catch (error) {
    console.error('[extractSummaryAction] Error ensuring summary:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
