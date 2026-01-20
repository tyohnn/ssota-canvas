/**
 * Extract Summary Action Business Logic
 *
 * 순수 함수로 추출된 비즈니스 로직
 * - Hook과 executeAction 모두에서 사용 가능
 */
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { YoutubeBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';
import { extractVideoSummaryAction } from '@/domains/youtube-app-space/actions/summary/extract-video-summary.action';

export interface ExtractSummaryResult {
  success: boolean;
  error?: string;
}

/**
 * YouTube 요약 추출 비즈니스 로직
 *
 * @param blockId - 블록 ID
 * @param blockData - 블록 데이터
 * @param language - 언어 코드 (optional, 기본값은 서버에서 결정)
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
    const result = await extractVideoSummaryAction({
      blockId,
      youtubeId,
      language, // 언어 파라미터 전달
    });

    if (result.success) {
      return {
        success: true,
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to extract summary',
      };
    }
  } catch (error) {
    console.error('[extractSummaryAction] Error extracting summary:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
