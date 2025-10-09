'use client';

import React from 'react';
import { useReactFlowNodeSelection } from '../contexts/ReactFlowSelectionContext';

/**
 * 선택 상태 표시 컴포넌트
 * 선택된 노드 수와 선택 모드를 표시
 */
export function SelectionStatus() {
  const { count, mode } = useReactFlowNodeSelection();

  if (count === 0) return null;

  return (
    <div className="absolute top-4 right-4 z-50 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium shadow-lg select-none">
      Selected {count}
    </div>
  );
}
