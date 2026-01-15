/**
 * Extract Script Action Business Logic
 *
 * 순수 함수로 추출된 비즈니스 로직
 * - Hook과 executeAction 모두에서 사용 가능
 */
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { YoutubeBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';
import { extractVideoScriptAction } from '@/domains/youtube-app-space/actions/video/extract-video-script.action';

export interface ExtractScriptResult {
  success: boolean;
  error?: string;
}

/**
 * YouTube 스크립트 추출 비즈니스 로직
 *
 * @param blockId - 블록 ID
 * @param blockData - 블록 데이터
 * @returns 추출 결과
 */
export async function extractScriptAction(
  blockId: string,
  blockData: BlockNodeData
): Promise<ExtractScriptResult> {
  const properties = blockData.properties as YoutubeBlockProperties;
  const youtubeId = properties.youtubeId;

  if (!youtubeId) {
    return {
      success: false,
      error: 'YouTube ID not found',
    };
  }

  try {
    const result = await extractVideoScriptAction({
      blockId,
      youtubeId,
    });

    if (result.success) {
      return {
        success: true,
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to extract script',
      };
    }
  } catch (error) {
    console.error('[extractScriptAction] Error extracting script:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
