import { useCallback } from 'react';

import type { Node } from '@xyflow/react';

import type {
  AlignmentType,
  BlockDuplicateInfo,
  DomainDependencies,
  DuplicateBlocksParams,
  FlowDependencies,
  MultiSelectionToolbarBusinessLogic,
} from './types';

/**
 * Production 비즈니스 로직
 * 실제 API를 호출하고 도메인 상태를 업데이트
 */
export function useMultiSelectionToolbarBusiness(
  { setNodes, deleteElements }: FlowDependencies,
  {
    alignBlocks: alignBlocksTransform,
    distributeBlocks: distributeBlocksTransform,
    duplicateMultipleBlocksAndMount,
    exitToDefaultMode,
  }: DomainDependencies
): MultiSelectionToolbarBusinessLogic {
  const alignBlocks = useCallback(
    (blockIds: string[], alignmentType: AlignmentType) => {
      alignBlocksTransform(blockIds, alignmentType);
    },
    [alignBlocksTransform]
  );

  const distributeBlocks = useCallback(
    (blockIds: string[], direction: 'horizontal' | 'vertical') => {
      distributeBlocksTransform(blockIds, direction);
    },
    [distributeBlocksTransform]
  );

  const duplicateBlocks = useCallback(
    async (params: DuplicateBlocksParams) => {
      if (params.blockMountIds.length > 0) {
        await duplicateMultipleBlocksAndMount(params.blockMountIds);
      }
    },
    [duplicateMultipleBlocksAndMount]
  );

  const duplicateSelectedBlocks = useCallback(
    async (selectedBlockIds: string[], selectedNodes: Node[]) => {
      // Prepare duplication information for all blocks
      const blocksToDuplicate = selectedBlockIds
        .map((blockId, index) => {
          const selectedNode = selectedNodes.find(node => node.id === blockId);
          if (!selectedNode?.data?.blockMountId) {
            return null;
          }

          // Duplicate each block (block width + 50px + index offset)
          const blockWidth = selectedNode.width || 200; // Default width 200px
          const baseOffsetX = blockWidth + 50; // Base offset: block width + 50px
          const offsetX = baseOffsetX + index * 20; // Additional 20px offset per block
          const offsetY = 20 + index * 20; // Y-axis offset based on index

          return {
            blockMountId: selectedNode.data.blockMountId as string,
            offsetX,
            offsetY,
          };
        })
        .filter((block): block is BlockDuplicateInfo => block !== null);

      if (blocksToDuplicate.length > 0) {
        await duplicateMultipleBlocksAndMount(blocksToDuplicate);
      }
    },
    [duplicateMultipleBlocksAndMount]
  );

  const deleteBlocks = useCallback(
    (blockIds: string[]) => {
      // React Flow에서 즉시 제거 (Optimistic UI)
      deleteElements({
        nodes: blockIds.map(id => ({ id })),
      });
      // 서버 액션은 onNodesDelete 콜백에서 처리됨
    },
    [deleteElements]
  );

  const exitSelection = useCallback(() => {
    // ESC 또는 툴바 외부 클릭 시 선택 해제
    setNodes(nodes => nodes.map(node => ({ ...node, selected: false })));
    exitToDefaultMode();
  }, [setNodes, exitToDefaultMode]);

  return {
    alignBlocks,
    distributeBlocks,
    duplicateBlocks,
    duplicateSelectedBlocks,
    deleteBlocks,
    exitSelection,
  };
}

/**
 * Mock 비즈니스 로직 (노코드 툴용)
 * 실제 API 호출 없이 로컬에서 동작 테스트
 */
export function useMockMultiSelectionToolbarBusiness(): MultiSelectionToolbarBusinessLogic {
  const alignBlocks = useCallback(
    (blockIds: string[], alignmentType: AlignmentType) => {
      console.log('[Mock] Aligning blocks:', blockIds, alignmentType);
    },
    []
  );

  const distributeBlocks = useCallback(
    (blockIds: string[], direction: 'horizontal' | 'vertical') => {
      console.log('[Mock] Distributing blocks:', blockIds, direction);
    },
    []
  );

  const duplicateBlocks = useCallback(async (params: DuplicateBlocksParams) => {
    console.log('[Mock] Duplicating blocks:', params);
    await new Promise(resolve => setTimeout(resolve, 300));
  }, []);

  const duplicateSelectedBlocks = useCallback(
    async (selectedBlockIds: string[], selectedNodes: Node[]) => {
      console.log('[Mock] Duplicating selected blocks:', selectedBlockIds);
      await new Promise(resolve => setTimeout(resolve, 300));
    },
    []
  );

  const deleteBlocks = useCallback((blockIds: string[]) => {
    console.log('[Mock] Deleting blocks:', blockIds);
  }, []);

  const exitSelection = useCallback(() => {
    console.log('[Mock] Exiting selection');
  }, []);

  return {
    alignBlocks,
    distributeBlocks,
    duplicateBlocks,
    duplicateSelectedBlocks,
    deleteBlocks,
    exitSelection,
  };
}
