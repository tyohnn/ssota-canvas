/**
 * YouTube Block Actions (Non-Hook Version)
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
  const { workspaceId, orgId, pageId } = blockData;

  if (!workspaceId || !orgId || !pageId) {
    return {
      success: false,
      error: 'Missing workspaceId, orgId, or pageId in block data',
    };
  }

  switch (action) {
    case 'extractScript': {
      // TODO: YouTube 자막/스크립트 추출
      return {
        success: false,
        error: 'extractScript action not yet implemented',
      };
    }

    case 'summarize': {
      // TODO: YouTube 비디오 요약
      return {
        success: false,
        error: 'summarize action not yet implemented',
      };
    }

    default:
      return {
        success: false,
        error: `Unknown action for youtube block: ${action}`,
      };
  }
}
