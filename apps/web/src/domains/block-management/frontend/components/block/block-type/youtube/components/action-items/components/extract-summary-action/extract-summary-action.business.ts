/**
 * Extract Summary Action Business Logic
 *
 * sourceId 있을 때만 processSourceSummaryAction 호출.
 */
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { processSourceSummaryAction } from '@/domains/source-management/actions/summary/process-source-summary.action';

export interface ExtractSummaryResult {
  success: boolean;
  alreadyExists?: boolean;
  error?: string;
}

/**
 * YouTube 요약 추출 (source 경로만)
 *
 * @param workspaceId - 워크스페이스 ID (에디터 컨텍스트)
 * @param blockId - 블록 slug
 * @param blockData - 블록 데이터 (sourceId 필요)
 * @param language - 언어 코드 (기본값 en)
 */
export async function extractSummaryAction(
  workspaceId: string,
  blockId: string,
  blockData: BlockNodeData,
  language?: string
): Promise<ExtractSummaryResult> {
  const sourceId = blockData.sourceId;

  if (!sourceId) {
    return {
      success: false,
      error: 'URL을 입력해 메타데이터를 불러온 후 요약을 추출할 수 있습니다.',
    };
  }

  try {
    const result = await processSourceSummaryAction({
      workspaceId,
      blockId,
      language: language || 'en',
    });

    if (result.success) {
      return {
        success: true,
        alreadyExists: result.data?.alreadyExists ?? false,
      };
    }
    return {
      success: false,
      error: result.error || 'Failed to extract summary',
    };
  } catch (error) {
    console.error('[extractSummaryAction] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
