'use client';

import { type Node, useStore } from '@xyflow/react';
import { useCallback } from 'react';

// Custom equality function for comparing arrays of nodes by their IDs
// This prevents re-renders when the array reference changes but the content is the same
const areSelectedNodesEqual = (a: Node[], b: Node[]): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i]?.id !== b[i]?.id) return false;
  }
  return true;
};

export function useCanvasSelection() {
  // React Flow Store에서 선택 상태 읽기
  // Fix: Use custom equality function to avoid infinite re-renders caused by filter() creating new array references
  const selectedNodes = useStore(
    state => state.nodes.filter(node => node.selected),
    areSelectedNodesEqual
  );

  const nodeLookup = useStore(state => state.nodeLookup);

  // 상태 읽기 메서드들
  const getSelectedBlocks = useCallback(() => {
    const blockIds = selectedNodes.map(node => node.id);
    return blockIds;
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
