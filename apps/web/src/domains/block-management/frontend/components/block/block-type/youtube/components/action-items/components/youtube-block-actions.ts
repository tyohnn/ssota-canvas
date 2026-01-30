/**
 * YouTube Block Actions (Non-Hook Version)
 * AI Agent가 호출하는 순수 함수 버전
 */
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

import { extractScriptAction } from './extract-script-action/extract-script-action.business';

export interface ActionResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

/**
 * YouTube 블록의 모든 액션을 처리하는 통합 실행 함수
 *
 * @param callbacks - Hook 콜백들 (선택적, 각 액션에서 필요한 처리를 직접 수행)
 */
export async function executeAction(
  blockData: BlockNodeData,
  action: string,
  params: Record<string, any>,
  callbacks?: any // ActionCallbacks 타입은 필요시 import
): Promise<ActionResult> {
  switch (action) {
    case 'extractScript': {
      // Block ID 추출 (blockData에서 가져오기)
      const blockId = blockData.blockId;

      const result = await extractScriptAction(blockId, blockData);

      if (result.success) {
        return {
          success: true,
          message: 'Script extracted successfully',
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to extract script',
        };
      }
    }

    default: {
      return {
        success: false,
        error: `Unknown action for youtube block: ${action}`,
      };
    }
  }
}
