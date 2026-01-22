/**
 * Smart Summary Action Business Logic
 *
 * 순수 함수로 추출된 비즈니스 로직
 * - Hook과 executeAction 모두에서 사용 가능
 */
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { YoutubeBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';
import { createActionTransactionAction } from '@/domains/youtube-app-space/actions/transaction/create-action-transaction.action';
import { smartSummaryAction } from '@/domains/youtube-app-space/actions/summary/smart-summary.action';
import { isFailure } from '@/lib';

export interface SmartSummaryResult {
  success: boolean;
  error?: string;
  summary?: string;
}

/**
 * YouTube 비디오 스마트 요약 비즈니스 로직
 *
 * @param blockId - 블록 ID
 * @param blockData - 블록 데이터
 * @returns 요약 결과
 */
export async function executeSmartSummaryAction(
  blockId: string,
  blockData: BlockNodeData
): Promise<SmartSummaryResult> {
  const properties = blockData.properties as YoutubeBlockProperties;
  const youtubeId = properties.youtubeId;

  if (!youtubeId) {
    return {
      success: false,
      error: 'YouTube ID not found',
    };
  }

  try {
    // 1. Action Transaction 생성
    const createTransactionResult = await createActionTransactionAction({
      blockId,
      videoId: youtubeId,
      actionType: 'smart_summary',
    });

    if (isFailure(createTransactionResult)) {
      return {
        success: false,
        error:
          createTransactionResult.error ||
          'Failed to create action transaction',
      };
    }

    const transactionId = createTransactionResult.data.transactionId;

    // 2. Smart Summary Action 호출
    const summaryResult = await smartSummaryAction({
      actionTransactionId: transactionId,
      blockId,
    });

    if (isFailure(summaryResult)) {
      return {
        success: false,
        error: summaryResult.error || 'Failed to generate summary',
      };
    }

    return {
      success: true,
      summary: summaryResult.data.summary,
    };
  } catch (error) {
    console.error(
      '[executeSmartSummaryAction] Error summarizing video:',
      error
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
