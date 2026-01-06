import { type RefObject, useMemo, useRef } from 'react';

import type {
  NodeWithSize,
  ToolbarPosition,
  UIStateDependencies,
} from './types';

/**
 * UI State Hook for Multi Selection Toolbar
 *
 * 디자이너가 Storybook/노코드 툴에서 사용할 수 있는 순수 UI 로직
 * - 비즈니스 로직 없음 (API 호출, 데이터 검증 등)
 * - 로컬 상태 관리만 담당
 * - 노코드 환경에서 독립적으로 테스트 가능
 */

const PADDING = 0;
const TOOLBAR_OFFSET = 12; // 툴바와 선택 박스 사이의 간격

export interface MultiSelectionToolbarUIState {
  // UI 상태
  toolbarPosition: ToolbarPosition | null;
  toolbarRef: RefObject<HTMLDivElement | null>;
}

export function useMultiSelectionToolbarUI({
  selectedNodes,
  viewport,
}: UIStateDependencies): MultiSelectionToolbarUIState {
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Measure the actual size of each node from the DOM (only when selection changes)
  const nodesWithSize = useMemo<NodeWithSize[]>(() => {
    if (selectedNodes.length === 0) {
      return [];
    }

    return selectedNodes.map(node => {
      const element = document.querySelector(`[data-id="${node.id}"]`);
      let width = 0;
      let height = 0;

      if (element) {
        // React Flow 노드 구조: Handle을 제외한 실제 컨텐츠 요소 찾기
        const children = Array.from(element.children);
        const contentElement = children.find(
          child => !child.classList.contains('react-flow__handle')
        ) as HTMLElement | undefined;

        if (contentElement) {
          width = contentElement.offsetWidth;
          height = contentElement.offsetHeight;
        }
      }

      // Fallback: measured 또는 node.width 사용
      if (!width || !height) {
        width =
          node.measured?.width ||
          node.width ||
          (node.style?.width as number) ||
          200;
        height =
          node.measured?.height ||
          node.height ||
          (node.style?.height as number) ||
          150;
      }

      return {
        id: node.id,
        position: node.position,
        actualWidth: width,
        actualHeight: height,
      };
    });
  }, [selectedNodes]);

  // Calculate the boundary of selected nodes (considering viewport coordinate system)
  const toolbarPosition = useMemo<ToolbarPosition | null>(() => {
    if (nodesWithSize.length === 0) {
      return null;
    }

    // Flow 좌표계에서 경계 계산
    const minX = Math.min(...nodesWithSize.map(n => n.position.x));
    const minY = Math.min(...nodesWithSize.map(n => n.position.y));
    const maxX = Math.max(
      ...nodesWithSize.map(n => n.position.x + n.actualWidth)
    );

    // Flow 좌표계에서 중앙 X와 상단 Y 계산
    const centerX = (minX + maxX) / 2;
    const topY = minY - PADDING;

    // Screen 좌표계로 변환 (viewport 적용)
    return {
      left: centerX * viewport.zoom + viewport.x,
      top: topY * viewport.zoom + viewport.y - TOOLBAR_OFFSET,
    };
  }, [nodesWithSize, viewport]);

  return {
    toolbarPosition,
    toolbarRef,
  };
}
