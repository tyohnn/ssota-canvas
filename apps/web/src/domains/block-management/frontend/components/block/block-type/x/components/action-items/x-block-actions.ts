/**
 * X Block Actions (Non-Hook Version)
 * AI Agent가 호출하는 순수 함수 버전
 */
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { extractSummaryAction } from '@/domains/source-management/frontend/components/extract-summary-action/core/extract-summary-action.business';

export interface ActionResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

export async function executeAction(
  blockData: BlockNodeData,
  action: string,
  params: Record<string, any>
): Promise<ActionResult> {
  if (action === 'summarize') {
    const workspaceId = params?.workspaceId as string | undefined;
    const language = (params?.language as string | undefined) || 'ko';

    if (!workspaceId) {
      return {
        success: false,
        error: 'workspaceId is required for summarize',
      };
    }

    const blockId = blockData.blockId;
    const result = await extractSummaryAction(
      workspaceId,
      blockId,
      blockData,
      language
    );

    if (result.success) {
      return {
        success: true,
        message: result.alreadyExists
          ? `Summary already exists for ${language}`
          : `Summary extraction started for ${language}`,
        data: { alreadyExists: result.alreadyExists },
      };
    }
    return {
      success: false,
      error: result.error || 'Failed to extract summary',
    };
  }

  return {
    success: false,
    error: `Unknown action for x block: ${action}`,
  };
}
