'use client';

import { memo, useMemo, useCallback, useRef } from 'react';
import { useStore, useViewport, useReactFlow } from '@xyflow/react';
import { useCanvasMode } from '@/domains/canvas-management/frontend/hooks/use-canvas-mode';
import { useCanvasSelection } from '@/domains/canvas-management/frontend/hooks/use-canvas-selection';
import { useCanvasBlockTransform } from '@/domains/canvas-management/frontend/hooks/use-canvas-block-transform';
import { usePreventPinchZoom } from '@/domains/canvas-management/frontend/hooks/use-prevent-pinch-zoom';

const PADDING = 3; // 선택된 노드들과의 여백 제거

interface SelectionBoundingBoxProps {
  orgId: string;
  workspaceId: string;
}

/**
 * SelectionBoundingBox 컴포넌트
 *
 * 렌더링 조건: isMultiSelectionMode() === true && getSelectionCount() >= 2
 * 다중 선택된 블럭들을 감싸는 커스텀 바운딩 박스 렌더링
 */
export const SelectionBoundingBox = memo(function SelectionBoundingBox({
  orgId,
  workspaceId,
}: SelectionBoundingBoxProps) {
  const { isMultiSelectionMode } = useCanvasMode();
  const { getSelectionCount } = useCanvasSelection();
  const viewport = useViewport();
  const reactFlowInstance = useReactFlow();
  const { setNodes } = reactFlowInstance;
  const { saveBlockPositions } = useCanvasBlockTransform({
    orgId,
    workspaceId,
  });

  // 드래그 상태 관리
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const initialPositionsRef = useRef<
    Array<{ id: string; x: number; y: number }>
  >([]);
  const boundingBoxRef = useRef<HTMLDivElement>(null);

  // 선택된 노드들의 정보 가져오기
  const selectedNodes = useStore(state =>
    state.nodes.filter(node => node.selected)
  );

  // 각 노드의 실제 크기를 DOM에서 측정 (선택이 바뀔 때만)
  const nodesWithSize = useMemo(() => {
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

  // 선택된 노드들의 경계 계산 (viewport 좌표계 고려)
  const bounds = useMemo(() => {
    if (nodesWithSize.length === 0) {
      return null;
    }

    // Flow 좌표계에서 경계 계산
    const minX = Math.min(...nodesWithSize.map(n => n.position.x));
    const minY = Math.min(...nodesWithSize.map(n => n.position.y));
    const maxX = Math.max(
      ...nodesWithSize.map(n => n.position.x + n.actualWidth)
    );
    const maxY = Math.max(
      ...nodesWithSize.map(n => n.position.y + n.actualHeight)
    );

    // Flow 좌표계에서 padding 적용
    const flowBounds = {
      x: minX - PADDING,
      y: minY - PADDING,
      width: maxX - minX + PADDING * 2,
      height: maxY - minY + PADDING * 2,
    };

    // Screen 좌표계로 변환 (viewport 적용)
    return {
      left: flowBounds.x * viewport.zoom + viewport.x,
      top: flowBounds.y * viewport.zoom + viewport.y,
      width: flowBounds.width * viewport.zoom,
      height: flowBounds.height * viewport.zoom,
    };
  }, [nodesWithSize, viewport]);

  // 드래그 중
  const handleMouseMove = useCallback(
    (e: PointerEvent) => {
      if (!isDraggingRef.current || !dragStartRef.current) return;

      e.preventDefault();

      // 마우스 이동 거리 (screen 좌표)
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      // Flow 좌표계로 변환 (zoom 고려)
      const flowDeltaX = deltaX / viewport.zoom;
      const flowDeltaY = deltaY / viewport.zoom;

      // 모든 선택된 노드 이동
      setNodes(nodes =>
        nodes.map(node => {
          const initialPos = initialPositionsRef.current.find(
            p => p.id === node.id
          );
          if (initialPos) {
            return {
              ...node,
              position: {
                x: initialPos.x + flowDeltaX,
                y: initialPos.y + flowDeltaY,
              },
            };
          }
          return node;
        })
      );
    },
    [viewport.zoom, setNodes]
  );

  // 드래그 종료
  const handleMouseUp = useCallback(
    async (e: PointerEvent) => {
      e.preventDefault();

      isDraggingRef.current = false;
      dragStartRef.current = null;

      // Document 리스너 제거
      document.removeEventListener('pointermove', handleMouseMove);
      document.removeEventListener('pointerup', handleMouseUp);

      // 서버에 위치 배치 저장 (백그라운드로 실행)
      if (initialPositionsRef.current.length > 0) {
        const currentNodes = reactFlowInstance.getNodes();

        // 위치가 변경된 노드만 필터링
        const changedPositions = initialPositionsRef.current
          .map(initialPos => {
            const currentNode = currentNodes.find(
              (n: { id: string }) => n.id === initialPos.id
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
          .filter(
            (p): p is { blockId: string; position: { x: number; y: number } } =>
              p !== null
          );

        // 변경된 노드가 있으면 배치로 저장
        if (changedPositions.length > 0) {
          saveBlockPositions(changedPositions).catch(err => {
            console.error(
              '[SelectionBoundingBox] Failed to save positions:',
              err
            );
          });
        }
      }

      initialPositionsRef.current = [];
    },
    [handleMouseMove, saveBlockPositions, reactFlowInstance]
  );

  // 드래그 시작
  const handleMouseDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();

      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX, y: e.clientY };

      // 모든 선택된 노드의 초기 위치 저장
      initialPositionsRef.current = selectedNodes.map(node => ({
        id: node.id,
        x: node.position.x,
        y: node.position.y,
      }));

      // Document에 pointermove, pointerup 리스너 추가
      document.addEventListener('pointermove', handleMouseMove);
      document.addEventListener('pointerup', handleMouseUp);
    },
    [selectedNodes, handleMouseMove, handleMouseUp]
  );

  // 트랙패드 핀치 줌 방지
  usePreventPinchZoom(boundingBoxRef);

  // 다중 선택 모드가 아니거나 2개 미만 선택 시 렌더링하지 않음
  if (!isMultiSelectionMode() || getSelectionCount() < 2 || !bounds) {
    return null;
  }

  return (
    <div
      ref={boundingBoxRef}
      className="absolute cursor-move select-none"
      onPointerDown={handleMouseDown}
      onWheel={e => e.stopPropagation()}
      style={{
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height,
        border: '2px solid rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        borderRadius: '4px',
        zIndex: 100, // 노드보다 위에 렌더링
        willChange: 'transform', // 성능 최적화
        pointerEvents: 'auto', // 드래그 가능하게
        touchAction: 'none', // 터치 이벤트 차단 (핀치 줌 방지)
      }}
    />
  );
});
