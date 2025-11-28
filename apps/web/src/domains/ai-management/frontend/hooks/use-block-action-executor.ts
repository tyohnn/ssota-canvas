/**
 * Block Action Executor with Lazy Dynamic Import
 * Dynamic Tool에서 블럭 액션을 실행하는 훅
 *
 * 🎯 AI Agent 전용 Hook
 * - AI Agent의 executeBlockAction tool에서만 사용
 * - block-management 도메인의 action modules를 동적으로 import
 *
 * 성능 최적화:
 * - Lazy Import: 실행 시점에만 필요한 블럭의 훅을 동적으로 import
 * - Code Splitting: 각 블럭이 별도 번들로 분리됨
 * - 캐싱: 한 번 import한 모듈은 브라우저가 자동 캐싱
 *
 * 확장성:
 * - 100개 블럭 × 3개 액션 = 300개 액션도 처리 가능
 * - 초기 번들 크기: ~5KB (Registry만)
 * - 실행 시 오버헤드: 첫 실행 50-100ms (import), 이후 0ms (캐시)
 */

import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { validateActionParams } from '@/domains/block-management/frontend/components/block/block-type/action-schemas-registry';
import type { useCanvasBlockLifecycle } from '@/domains/canvas-management/frontend/hooks/use-canvas-block-lifecycle';
import type { useBlockPropertyUpdate } from '@/domains/block-management/frontend/hooks/use-block-property-update';
import type { useAutoPositionCalculator } from '@/domains/canvas-management/frontend/hooks/use-auto-position-calculator';

/**
 * Block Action Module Map
 * 블럭 타입별 액션 모듈 경로 매핑 (실제 import는 하지 않음)
 */
const BLOCK_ACTION_MODULES: Record<string, string> = {
  youtube: 'youtube',
  pdf: 'pdf',
  image: 'image',
  link: 'link',
  python: 'python',
  audio: 'audio',
  text: 'text',
  markdown: 'markdown',
  shape: 'shape',
};

/**
 * useBlockActionExecutor
 * Dynamic Tool에서 블럭 액션을 실행
 *
 * Layer 2: Action Executor
 * - Layer 3 (pure actions)에서 액션 실행
 * - 각 액션에서 필요한 처리를 직접 수행 (콜백 전달)
 * - 결과를 Layer 1 (AI Agent)에 반환
 *
 * ⚠️ 중요: Action 함수를 직접 import하여 사용
 * Hook은 React 규칙에 따라 컴포넌트 내에서만 호출 가능하므로,
 * 각 블록의 action-items에서 실제 액션 로직을 import합니다.
 */
export function useBlockActionExecutor(executorParams: {
  blockLifecycle: ReturnType<typeof useCanvasBlockLifecycle>;
  blockPropertyUpdate: ReturnType<typeof useBlockPropertyUpdate>;
  positionCalculator: ReturnType<typeof useAutoPositionCalculator>;
}) {
  const { getNode } = useReactFlow();

  const executeAction = useCallback(
    async (params: {
      blockId: string; // blockMountId
      action: string;
      blockType: string;
      params?: Record<string, any>;
    }): Promise<{ success: boolean; message: string; data?: any }> => {
      const { blockId, action, blockType, params: actionParams } = params;

      // 1. React Flow에서 블럭 데이터 조회
      const node = getNode(blockId);
      if (!node) {
        throw new Error(`Block not found: ${blockId}`);
      }

      const blockData = node.data as BlockNodeData;

      // 2. 모듈 존재 확인
      if (!BLOCK_ACTION_MODULES[blockType]) {
        throw new Error(
          `Unsupported block type: ${blockType}\n` +
            `Supported types: ${Object.keys(BLOCK_ACTION_MODULES).join(', ')}`
        );
      }

      // 3. Action params 검증 (통합 Action Schemas Registry 사용)
      if (actionParams) {
        const validationResult = validateActionParams(
          blockType,
          action,
          actionParams
        );

        if (!validationResult.success) {
          throw new Error(validationResult.error);
        }
      }

      try {
        // 4. Convention-based Dynamic Import
        //
        // 규약: 각 블록 타입은 {blockType}-actions.ts 파일을 export
        // 위치: block-type/{blockType}/{blockType}-actions.ts
        // Export: { executeAction: (blockData, action, params) => Promise<ActionResult> }
        //
        // 예시:
        // - block-type/image/image-actions.ts
        // - block-type/markdown/markdown-actions.ts
        // - block-type/pdf/pdf-actions.ts
        //
        // 이렇게 하면 100개 블록 × 3개 액션 = 300개 액션을 모두 처리 가능!
        // 새 블록 추가 시 이 코드 변경 불필요 ✅

        const actionsModule = await import(
          /* webpackChunkName: "block-actions-[request]" */
          `@/domains/block-management/frontend/components/block/block-type/${blockType}/${blockType}-actions`
        );

        // executeAction 함수 확인
        if (
          !actionsModule.executeAction ||
          typeof actionsModule.executeAction !== 'function'
        ) {
          throw new Error(
            `Missing executeAction in ${blockType}-actions.ts\n` +
              `Expected: export async function executeAction(blockData, action, params)\n` +
              `Available: ${Object.keys(actionsModule).join(', ')}`
          );
        }

        // 5. 액션 실행 (Layer 3: Pure Actions)
        // 각 액션에서 필요한 처리를 직접 수행하도록 콜백 전달
        const result = await actionsModule.executeAction(
          blockData,
          action,
          actionParams || {},
          {
            // 각 액션에서 사용할 수 있는 Hook 콜백들
            updateProperties:
              executorParams.blockPropertyUpdate.updateProperties,
            createAndMountBlock:
              executorParams.blockLifecycle.createAndMountBlock,
            calculatePosition:
              executorParams.positionCalculator.calculatePosition,
            blockId, // 현재 블록 ID
          }
        );

        if (!result.success) {
          throw new Error(result.error || 'Action execution failed');
        }

        // 6. 최종 결과 반환 (각 액션에서 이미 처리 완료)
        // result.data를 그대로 전달하여 이미지 리스트 등 액션 결과 데이터 포함
        return {
          success: true,
          message: result.message || `${blockType}.${action} 실행 완료`,
          data: result.data,
        };
      } catch (error) {
        // Import 또는 실행 에러
        if (error instanceof Error) {
          throw error;
        }
        throw new Error(`Failed to execute action: ${String(error)}`);
      }
    },
    [getNode, executorParams]
  );

  return { executeAction };
}
