'use client';

import { useStore } from '@xyflow/react';
import { useCallback } from 'react';

export function useCanvasSelection() {
  // React Flow Store에서 선택 상태 읽기
  const selectedNodes = useStore(state =>
    state.nodes.filter(node => node.selected)
  );

  const nodeLookup = useStore(state => state.nodeLookup);

  // 상태 읽기 메서드들
  const getSelectedBlocks = useCallback(() => {
    return selectedNodes.map(node => node.id);
  }, [selectedNodes]);

  const isSelected = useCallback(
    (blockId: string) => {
      return selectedNodes.some(node => node.id === blockId);
    },
    [selectedNodes]
  );

  const getSelectionCount = useCallback(() => {
    return selectedNodes.length;
  }, [selectedNodes]);

  return {
    getSelectedBlocks,
    isSelected,
    getSelectionCount,
    selectedNodes, // 추가: 선택된 노드 객체들도 제공
  };
}
