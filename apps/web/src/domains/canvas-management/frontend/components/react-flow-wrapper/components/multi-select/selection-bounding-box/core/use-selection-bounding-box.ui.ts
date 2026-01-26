import { type RefObject, useCallback, useMemo, useRef } from 'react';

import type { Node } from '@xyflow/react';

import type {
  BlockPosition,
  BoundingBoxBounds,
  InitialNodePosition,
  NodeWithSize,
  SelectionBoundingBoxUILogic,
  UIStateDependencies,
} from './types';

/**
 * UI Logic Hook for Selection Bounding Box
 *
 * Pure UI logic that can be used by designers in Storybook/no-code tools
 * - No business logic (API calls, data validation, etc.)
 * - Only handles local state management and calculations
 * - Can be tested independently in no-code environments
 */

const PADDING = 3; // Padding between selected nodes and bounding box

/**
 * Production UI logic
 * Performs actual calculations and state management
 */
export function useSelectionBoundingBoxUILogic({
  selectedNodes,
  viewport,
  getNodes,
}: UIStateDependencies): SelectionBoundingBoxUILogic {
  const boundingBoxRef = useRef<HTMLDivElement>(null);

  // Drag interaction state (UI-only)
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  // Helper: 부모 노드의 절대 위치를 재귀적으로 계산
  const getAbsolutePosition = useCallback(
    (node: Node, allNodes: Node[]): { x: number; y: number } => {
      if (!node.parentId) {
        return { x: node.position.x, y: node.position.y };
      }

      const parentNode = allNodes.find(n => n.id === node.parentId);
      if (!parentNode) {
        // 부모가 없으면 현재 위치를 절대 좌표로 간주
        return { x: node.position.x, y: node.position.y };
      }

      // 부모의 절대 위치를 재귀적으로 계산
      const parentAbsPos = getAbsolutePosition(parentNode, allNodes);
      return {
        x: parentAbsPos.x + node.position.x,
        y: parentAbsPos.y + node.position.y,
      };
    },
    []
  );

  // Measure actual size of each node from DOM (only when selection changes)
  const nodesWithSize = useMemo<NodeWithSize[]>(() => {
    if (selectedNodes.length === 0) {
      return [];
    }

    // 모든 노드 가져오기 (부모 찾기용)
    const allNodes = getNodes();

    return selectedNodes.map(node => {
      const element = document.querySelector(`[data-id="${node.id}"]`);
      let width = 0;
      let height = 0;

      if (element) {
        // React Flow node structure: Find actual content element excluding handles
        const children = Array.from(element.children);
        const contentElement = children.find(
          child => !child.classList.contains('react-flow__handle')
        ) as HTMLElement | undefined;

        if (contentElement) {
          width = contentElement.offsetWidth;
          height = contentElement.offsetHeight;
        }
      }

      // Fallback: Use measured or node.width
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

      // 절대 좌표 계산 (부모가 있으면 부모 위치 더하기)
      const absolutePosition = getAbsolutePosition(node, allNodes);

      return {
        id: node.id,
        position: absolutePosition, // 상대 좌표 대신 절대 좌표 사용
        actualWidth: width,
        actualHeight: height,
      };
    });
  }, [selectedNodes, getNodes, getAbsolutePosition]);

  // Calculate boundary of selected nodes (considering viewport coordinate system)
  const bounds = useMemo<BoundingBoxBounds | null>(() => {
    if (nodesWithSize.length === 0) {
      return null;
    }

    // Calculate boundary in Flow coordinate system
    const minX = Math.min(...nodesWithSize.map(n => n.position.x));
    const minY = Math.min(...nodesWithSize.map(n => n.position.y));
    const maxX = Math.max(
      ...nodesWithSize.map(n => n.position.x + n.actualWidth)
    );
    const maxY = Math.max(
      ...nodesWithSize.map(n => n.position.y + n.actualHeight)
    );

    // Apply padding in Flow coordinate system
    const flowBounds = {
      x: minX - PADDING,
      y: minY - PADDING,
      width: maxX - minX + PADDING * 2,
      height: maxY - minY + PADDING * 2,
    };

    // Convert to Screen coordinate system (apply viewport)
    return {
      left: flowBounds.x * viewport.zoom + viewport.x,
      top: flowBounds.y * viewport.zoom + viewport.y,
      width: flowBounds.width * viewport.zoom,
      height: flowBounds.height * viewport.zoom,
    };
  }, [nodesWithSize, viewport]);

  // Calculate which node positions have changed by comparing initial and current positions
  const calculateChangedPositions = useCallback(
    (initialPositions: InitialNodePosition[]): BlockPosition[] => {
      const currentNodes = getNodes();

      return initialPositions
        .map(initialPos => {
          const currentNode = currentNodes.find(
            (n: Node) => n.id === initialPos.id
          );
          if (
            currentNode &&
            (currentNode.position.x !== initialPos.x ||
              currentNode.position.y !== initialPos.y)
          ) {
            return {
              blockId: currentNode.id,
              position: currentNode.position,
            };
          }
          return null;
        })
        .filter((p): p is BlockPosition => p !== null);
    },
    [getNodes]
  );

  // Start dragging: store initial positions and drag start point
  const startDragging = useCallback(
    (e: React.PointerEvent): InitialNodePosition[] => {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX, y: e.clientY };

      const positions = selectedNodes.map(node => ({
        id: node.id,
        x: node.position.x,
        y: node.position.y,
      }));
      return positions;
    },
    [selectedNodes]
  );

  // Move dragging: calculate updated positions based on mouse movement
  const moveDragging = useCallback(
    (
      e: PointerEvent,
      initialPositions: InitialNodePosition[]
    ): Array<{ id: string; x: number; y: number }> | null => {
      if (!isDraggingRef.current || !dragStartRef.current) return null;

      // Mouse movement distance (screen coordinates)
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      // Convert to Flow coordinate system (considering zoom)
      const flowDeltaX = deltaX / viewport.zoom;
      const flowDeltaY = deltaY / viewport.zoom;

      // Calculate updated positions for all nodes
      const updated = initialPositions.map(initialPos => ({
        id: initialPos.id,
        x: initialPos.x + flowDeltaX,
        y: initialPos.y + flowDeltaY,
      }));
      return updated;
    },
    [viewport.zoom]
  );

  // End dragging: reset state and calculate changed positions
  const endDragging = useCallback(
    (
      e: PointerEvent,
      initialPositions: InitialNodePosition[]
    ): BlockPosition[] | null => {
      if (!isDraggingRef.current) return null;

      isDraggingRef.current = false;
      dragStartRef.current = null;

      // Calculate which positions have changed
      return calculateChangedPositions(initialPositions);
    },
    [calculateChangedPositions]
  );

  return useMemo(
    () => ({
      bounds,
      boundingBoxRef,
      calculateChangedPositions,
      startDragging,
      moveDragging,
      endDragging,
    }),
    [
      bounds,
      boundingBoxRef,
      calculateChangedPositions,
      startDragging,
      moveDragging,
      endDragging,
    ]
  );
}
