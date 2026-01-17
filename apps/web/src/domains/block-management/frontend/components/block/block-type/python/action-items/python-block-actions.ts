/**
 * Python Block Actions (Non-Hook Version)
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
 * Python 블록의 모든 액션을 처리하는 통합 실행 함수
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
    case 'execute': {
      // TODO: Python 코드 실행
      return {
        success: false,
        error: 'execute action not yet implemented',
      };
    }

    case 'lint': {
      // TODO: Python 코드 린트
      return {
        success: false,
        error: 'lint action not yet implemented',
      };
    }

    case 'format': {
      // TODO: Python 코드 포맷
      return {
        success: false,
        error: 'format action not yet implemented',
      };
    }

    default:
      return {
        success: false,
        error: `Unknown action for python block: ${action}`,
      };
  }
}
