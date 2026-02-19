/**
 * Extract Script Action - Business Logic
 *
 * AI Agent용 순수 함수. extractSourceContentAction을 호출하여
 * YouTube 스크립트 추출 (sources.raw_content + videos.script dual-write)
 */
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { extractSourceContentAction } from '@/domains/source-management/actions/source/extract-source-content.action';

export interface ExtractScriptResult {
  success: boolean;
  error?: string;
}

export async function extractScriptAction(
  workspaceId: string,
  blockId: string,
  _blockData: BlockNodeData
): Promise<ExtractScriptResult> {
  try {
    const result = await extractSourceContentAction({
      workspaceId,
      blockId,
    });

    if (result.success) {
      return { success: true };
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
