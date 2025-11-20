/**
 * Text Block Actions (Non-Hook Version)
 * AI Agent가 호출하는 순수 함수 버전
 */

import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

export interface ActionResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

/**
 * Text 블록의 모든 액션을 처리하는 통합 실행 함수
 *
 * @param callbacks - Hook 콜백들 (선택적, 각 액션에서 필요한 처리를 직접 수행)
 */
export async function executeAction(
  blockData: BlockNodeData,
  action: string,
  params: Record<string, any>,
  callbacks?: any // ActionCallbacks 타입은 필요시 import
): Promise<ActionResult> {
  const { workspaceId, orgId, pageId } = blockData;

  if (!workspaceId || !orgId || !pageId) {
    return {
      success: false,
      error: 'Missing workspaceId, orgId, or pageId in block data',
    };
  }

  switch (action) {
    default:
      return {
        success: false,
        error: `Unknown action for text block: ${action}. Text blocks currently have no special actions.`,
      };
  }
}
