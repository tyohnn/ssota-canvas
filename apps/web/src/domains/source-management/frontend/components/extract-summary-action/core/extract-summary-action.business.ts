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
  blockUuid?: string;
  error?: string;
}

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
      error: 'Load metadata from URL first, then you can extract the summary.',
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
        blockUuid: result.data?.blockUuid,
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
