import { useCallback, useMemo } from 'react';

import { useCanvasModeContext } from '@/domains/canvas-management/frontend/hooks';

import { DEFAULT_BLOCK_TYPES } from './block-types';
import type {
  BlockAddDialogProps,
  BlockTypeInfo,
  ModeDependencies,
  UseBlockAddDialogReturn,
} from './types';

/**
 * Combined Hook: Block Add Dialog Logic
 *
 * This hook serves as the single point of entry for all external dependencies.
 */
export function useBlockAddDialog(
  props: BlockAddDialogProps
): UseBlockAddDialogReturn {
  // 1. Gather External Dependencies (The only place where external hooks are called)
  // Domain / Service Hooks
  const canvasMode = useCanvasModeContext();

  // 2. Bundle Dependencies into semantic objects
  const modeDependencies: ModeDependencies = {
    enterBlockCreationMode: canvasMode.enterBlockCreationMode,
  };

  // 3. Compute block types by category
  const blockTypesByCategory = useMemo(
    () => {
      const grouped = DEFAULT_BLOCK_TYPES.reduce(
        (acc, blockTypeInfo) => {
          const category = blockTypeInfo.category;
          if (!category) {
            return acc;
          }
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(blockTypeInfo);
          return acc;
        },
        {} as Record<string, BlockTypeInfo[]>
      );
      
      // Remove 'Code' category from the dialog
      const { Code, ...filtered } = grouped;
      return filtered;
    },
    []
  );

  // 4. Compose handlers
  const handleSelectBlockType = useCallback(
    (blockType: BlockTypeInfo['type']) => {
      // useCanvasMode Hook을 사용하여 블럭 생성 모드 진입
      modeDependencies.enterBlockCreationMode(blockType);

      // 기존 콜백도 호출 (하위 호환성)
      props.onSelectBlockType(blockType);
      props.onClose();
    },
    [modeDependencies, props]
  );

  // 5. Compose and Return
  return {
    blockTypesByCategory,
    handleSelectBlockType,
  };
}
