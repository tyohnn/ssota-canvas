/**
 * Link Block Actions (Non-Hook Version)
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
 * Link 블록의 모든 액션을 처리하는 통합 실행 함수
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
    case 'summarize': {
      // TODO: 링크된 페이지 내용 요약
      return {
        success: false,
        error: 'summarize action not yet implemented',
      };
    }

    case 'fetchMetadata': {
      // TODO: 링크 메타데이터 가져오기
      return {
        success: false,
        error: 'fetchMetadata action not yet implemented',
      };
    }

    default:
      return {
        success: false,
        error: `Unknown action for link block: ${action}`,
      };
  }
}
