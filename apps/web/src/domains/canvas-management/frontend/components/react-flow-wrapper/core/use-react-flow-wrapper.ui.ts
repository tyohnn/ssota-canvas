import { useCallback, useMemo, useRef, useState } from 'react';

import type { Node } from '@xyflow/react';

import type {
  BlockNodeData,
  CanvasModeDependencies,
  ReactFlowDependencies,
  SnapGuidesDependencies,
} from './types';

/**
 * UI State Hook for React Flow Wrapper
 *
 * UI 상태 관리 및 UI 관련 callbacks 핸들러
 */
export interface ReactFlowWrapperUIState {
  // UI 상태
  showAddDialog: boolean;
  setShowAddDialog: (show: boolean) => void;

  // Callbacks - Drag 관련
  onNodeDragStart: (
    event: React.MouseEvent,
    node: Node,
    draggedNodes: Node[]
  ) => void;
  onNodeDrag: (
    event: React.MouseEvent,
    node: Node,
    draggedNodes: Node[]
  ) => void;
  handleNodeDragStopUI: (
    event: React.MouseEvent,
    node: Node,
    draggedNodes: Node[]
  ) => void;

  // Callbacks - Selection 관련
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onSelectionChange: ({ nodes }: { nodes: Node[] }) => void;
  onPaneClick: (event: React.MouseEvent) => void;

  // Callbacks - Wheel 관련
  onWheel: (event: React.WheelEvent<HTMLDivElement>) => void;
}

export interface ReactFlowWrapperUIDependencies {
  canvasMode: CanvasModeDependencies;
  reactFlow: ReactFlowDependencies;
  snapGuides: SnapGuidesDependencies;
}

export function useReactFlowWrapperUI(
  dependencies: ReactFlowWrapperUIDependencies
): ReactFlowWrapperUIState {
  const { canvasMode, reactFlow, snapGuides } = dependencies;

  // UI 상태
  const [showAddDialog, setShowAddDialog] = useState(false);

  // 이전 선택 상태 추적 (무한 루프 방지)
  const previousSelectionRef = useRef<{
    count: number;
    blockId?: string;
  }>({ count: 0 });

  /**
   * 드래그 시작 → 드래그 모드 진입 및 이전 가이드라인 초기화
   */
  const onNodeDragStart = useCallback(
    (event: React.MouseEvent, node: Node, draggedNodes: Node[]) => {
      const draggedIds = draggedNodes.map(n => n.id);

      // 이전 가이드라인 초기화 (새 블럭 드래그 시 깨끗한 상태로 시작)
      snapGuides.hideGuidelines();

      canvasMode.enterDraggingMode(draggedIds);
    },
    [canvasMode, snapGuides]
  );

  /**
   * 드래그 중 → 스냅 가이드라인 실시간 업데이트 (표시만, 스냅은 dragStop에서)
   * React Flow Helper Lines 예제: https://reactflow.dev/examples/interaction/helper-lines
   */
  const onNodeDrag = useCallback(
    (event: React.MouseEvent, node: Node, draggedNodes: Node[]) => {
      // 단일 블럭 드래그 시에만 스냅 가이드라인 표시 (스냅은 적용하지 않음)
      if (draggedNodes.length === 1) {
        const currentNodes = reactFlow.getNodes();
        // 가이드라인만 계산하고 표시 (position은 변경하지 않음)
        snapGuides.calculateSnapGuides(node.id, node.position, currentNodes);
      }
    },
    [reactFlow, snapGuides]
  );

  /**
   * 드래그 종료 → 스냅 적용 및 UI 상태 업데이트 (UI 로직만)
   * 서버 저장은 메인 훅에서 처리
   */
  const handleNodeDragStopUI = useCallback(
    (event: React.MouseEvent, node: Node, draggedNodes: Node[]) => {
      // 1. 단일 블럭인 경우 최종 스냅 위치 계산 및 적용
      // 중요: parentId가 있는 노드(그룹 내 노드)는 스냅을 건너뜀
      // - 그룹 내 노드의 position은 부모 기준 상대좌표
      // - 그룹 간 이동 시 뮤테이션에서 좌표 변환이 별도로 처리됨
      // - 스냅의 setNodes가 뮤테이션의 updateNode를 덮어쓰는 것을 방지
      if (draggedNodes.length === 1 && !node.parentId) {
        const currentNodes = reactFlow.getNodes();
        const snapResult = snapGuides.calculateSnapGuides(
          node.id,
          node.position,
          currentNodes
        );

        // 스냅된 위치로 노드 업데이트
        if (
          snapResult.position.x !== node.position.x ||
          snapResult.position.y !== node.position.y
        ) {
          reactFlow.setNodes(nodes =>
            nodes.map(n =>
              n.id === node.id ? { ...n, position: snapResult.position } : n
            )
          );
        }
      }

      // 2. 가이드라인 즉시 숨김
      snapGuides.hideGuidelines();

      // 3. 이전 모드로 즉시 복귀
      if (draggedNodes.length === 1) {
        canvasMode.enterSingleSelectionMode(draggedNodes[0]!.id);
      } else {
        canvasMode.enterMultiSelectionMode(draggedNodes.map(n => n.id));
      }
    },
    [reactFlow, snapGuides, canvasMode]
  );

  /**
   * 노드 클릭 → React Flow가 자동으로 선택 처리, 여기서는 로그만
   * 실제 모드 전환은 onSelectionChange에서 처리
   * Note: 블록 생성 모드는 canvas-react-flow-wrapper에서 override하여 처리
   */
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      // 블록 생성 모드는 override에서 처리
      if (canvasMode.isBlockCreationMode()) {
        return;
      }

      // React Flow가 자동으로 선택 상태를 관리하므로
      // onSelectionChange에서 모드 전환이 처리됨
    },
    [canvasMode]
  );

  /**
   * 선택 변경 → 모드 전환
   * React Flow가 이미 선택 상태를 관리하므로 모드만 전환
   * 이전 선택과 비교해서 실제로 변경된 경우에만 모드 전환 (무한 루프 방지)
   */
  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[] }) => {
      // 드래그 중에는 선택 모드 전환을 스킵 (드래그 모드 유지)
      if (canvasMode.isDraggingMode()) {
        return;
      }

      const currentCount = selectedNodes.length;
      const previousSelection = previousSelectionRef.current;

      if (currentCount > 1) {
        // 다중 선택: 이전과 다른 경우에만 업데이트
        if (previousSelection.count !== currentCount) {
          previousSelectionRef.current = { count: currentCount };
          canvasMode.enterMultiSelectionMode(selectedNodes.map(n => n.id));
        }
      } else if (currentCount === 1) {
        // 단일 선택: blockId가 변경된 경우에만 업데이트
        const node = selectedNodes[0]!;
        const nodeData = node.data as unknown as BlockNodeData;
        const blockId = nodeData?.blockId || node.id;

        // 이전 선택과 같은 blockId면 스킵
        if (previousSelection.blockId !== blockId) {
          previousSelectionRef.current = { count: 1, blockId };
          // 선택 시에는 single-selection 모드로 진입 (에디터 패널은 별도로 열림)
          canvasMode.enterSingleSelectionMode(blockId);
        }
      } else {
        // 선택 해제: 이전에 선택이 있었던 경우에만 업데이트
        if (previousSelection.count > 0) {
          previousSelectionRef.current = { count: 0 };
          canvasMode.exitToDefaultMode();
        } else {
        }
        // 빈 선택일 때 항상 previousSelectionRef 리셋 (onPaneClick과의 일관성 유지)
        previousSelectionRef.current = { count: 0 };
      }
    },
    [canvasMode]
  );

  /**
   * 빈 영역 클릭 → 기본 모드 복귀
   * Note: 블록 생성 모드는 canvas-react-flow-wrapper에서 override하여 처리
   */
  const onPaneClick = useCallback(
    (_event: React.MouseEvent) => {
      // 블록 생성 모드는 override에서 처리
      if (canvasMode.isBlockCreationMode()) {
        return;
      }

      // React Flow 선택 상태를 명시적으로 해제
      reactFlow.setNodes(nodes =>
        nodes.map(node => ({ ...node, selected: false }))
      );

      // previousSelectionRef 리셋 (중요! - onSelectionChange와의 race condition 방지)
      previousSelectionRef.current = { count: 0 };

      // 기본 모드로 전환
      canvasMode.exitToDefaultMode();
    },
    [canvasMode, reactFlow]
  );

  /**
   * 커스텀 wheel 이벤트 핸들러 (Ctrl/Cmd + Wheel로 줌)
   * 플랫폼별 줌 감도 적용
   */
  // 플랫폼 감지 (Windows vs Mac)
  const isWindows = useMemo(() => {
    if (typeof window === 'undefined') return false;

    // 최신 방법: navigator.userAgentData 사용 (Chrome/Edge)
    if ('userAgentData' in navigator) {
      const uaData = navigator.userAgentData as { platform?: string };
      return uaData.platform?.toLowerCase().includes('win') ?? false;
    }

    // Fallback: navigator.userAgent 사용
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('win') || userAgent.includes('windows');
  }, []);

  // 플랫폼별 줌 감도 설정
  // Windows: 더 높은 감도 (0.36), Mac: 기본 감도 (0.2)
  // 기존 값의 2배로 증가 (반응성 개선)
  const zoomMultiplier = useMemo(() => {
    return isWindows ? 0.36 : 0.01;
  }, [isWindows]);

  const onWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      // Ctrl (Windows) 또는 Cmd (Mac) 키가 눌려있을 때만 줌 활성화
      // 플랫폼 감지 (최신 방법)
      let isMac = false;
      if (typeof navigator !== 'undefined') {
        if ('userAgentData' in navigator) {
          const uaData = navigator.userAgentData as { platform?: string };
          isMac = uaData.platform?.toLowerCase().includes('mac') ?? false;
        } else {
          // Fallback: navigator.userAgent 사용
          const userAgent = navigator.userAgent.toLowerCase();
          isMac = userAgent.includes('mac');
        }
      }
      const isCtrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

      // Ctrl/Cmd가 눌려있지 않으면 기본 동작 (패닝) 허용
      if (!isCtrlOrCmd) {
        return;
      }

      // Input, Textarea, ContentEditable에서는 무시
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // 줌 동작 수행
      event.preventDefault();
      event.stopPropagation();

      const currentViewport = reactFlow.getViewport();
      const currentZoom = currentViewport.zoom;
      const deltaY = event.deltaY;

      // deltaY가 음수면 줌인, 양수면 줌아웃
      // zoomDelta를 플랫폼별 감도로 조절
      let newZoom: number;
      if (deltaY < 0) {
        // 줌인: zoomDelta를 플랫폼별 감도로 조절
        newZoom = Math.min(currentZoom + zoomMultiplier, 2); // maxZoom
      } else {
        // 줌아웃: zoomDelta를 플랫폼별 감도로 조절
        newZoom = Math.max(currentZoom - zoomMultiplier, 0.1); // minZoom
      }

      // viewport 업데이트 (duration: 0으로 즉시 적용)
      reactFlow.setViewport(
        {
          x: currentViewport.x,
          y: currentViewport.y,
          zoom: newZoom,
        },
        { duration: 0 }
      );
    },
    [reactFlow, zoomMultiplier]
  );

  return {
    showAddDialog,
    setShowAddDialog,
    onNodeDragStart,
    onNodeDrag,
    handleNodeDragStopUI,
    onNodeClick,
    onSelectionChange,
    onPaneClick,
    onWheel,
  };
}
