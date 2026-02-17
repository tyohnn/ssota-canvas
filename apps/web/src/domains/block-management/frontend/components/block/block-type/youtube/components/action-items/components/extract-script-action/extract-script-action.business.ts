/**
 * Extract Script Action Business Logic
 *
 * sourceId 있을 때만 extractSourceContentAction 호출.
 */
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { extractSourceContentAction } from '@/domains/source-management/actions/source/extract-source-content.action';

export interface ExtractScriptResult {
  success: boolean;
  alreadyExists?: boolean;
  error?: string;
}

/**
 * YouTube 스크립트 추출 (source 경로만)
 *
 * @param workspaceId - 워크스페이스 ID (에디터 컨텍스트)
 * @param blockId - 블록 slug
 * @param blockData - 블록 데이터 (sourceId 필요)
 */
export async function extractScriptAction(
  workspaceId: string,
  blockId: string,
  blockData: BlockNodeData
): Promise<ExtractScriptResult> {
  const sourceId = blockData.sourceId;

  if (!sourceId) {
    return {
      success: false,
      error: 'URL을 입력해 메타데이터를 불러온 후 스크립트를 추출할 수 있습니다.',
    };
  }

  try {
    const result = await extractSourceContentAction({ workspaceId, blockId });

    if (result.success) {
      return {
        success: true,
        alreadyExists: result.data?.alreadyExists ?? false,
      };
    }
    return {
      success: false,
      error: result.error || 'Failed to extract script',
    };
  } catch (error) {
    console.error('[extractScriptAction] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
