/**
 * React Flow Global Styles
 *
 * React Flow 컴포넌트의 전역 스타일을 정의합니다.
 */
export function ReactFlowStyles() {
  return (
    <style jsx global>{`
      /* ===== 기본 배경 및 Pane ===== */
      .react-flow {
        background-color: hsl(var(--background)) !important;
      }

      .react-flow__pane {
        background-color: transparent !important;
      }

      /* ===== 선택 드래그 프리뷰 박스 ===== */
      .react-flow__selection {
        background: rgba(59, 130, 246, 0.08) !important;
        border: 1px dashed rgb(59, 130, 246) !important;
      }

      .dark .react-flow__selection {
        background: rgba(59, 130, 246, 0.15) !important;
        border: 1px dashed rgb(96, 165, 250) !important;
      }

      /* ===== 선택된 노드 스타일 ===== */
      /* 선택된 노드들을 감싸는 박스는 우리 커스텀 컴포넌트 사용 */
      .react-flow__nodesselection {
        display: none !important;
      }

      /* React Flow 기본 선택 스타일 제거 (우리 커스텀 스타일 사용) */
      .react-flow__node.selected,
      .react-flow__node.selectable:focus,
      .react-flow__node.selectable:focus-visible {
        outline: none !important;
      }

      /* React Flow 기본 호버 스타일 제거 */
      .react-flow__node:hover {
        /* 우리 커스텀 호버 스타일 사용 */
      }

      /* 노드가 add-button 등으로 블록 밖으로 나가는 부분이 잘리지 않도록 */
      .react-flow__node {
        overflow: visible !important;
      }

      /* ===== z-index: edge-label > edge > block ===== */
      .react-flow__node {
        z-index: 0 !important;
      }
      .react-flow__edges,
      .react-flow__edge {
        z-index: 1 !important;
      }
      /* EdgeLabelRenderer 내부 레이어 (엣지 라벨/툴바가 엣지 선보다 위에) */
      .react-flow-edge-label-layer {
        z-index: 2 !important;
        pointer-events: none !important;
      }
      .react-flow-edge-label-layer > * {
        pointer-events: all !important;
      }
      /* 선택된 블록은 항상 최상단 (edge-label 위) */
      .react-flow__node.selected {
        z-index: 3 !important;
      }
      /* 그룹 선택 시 그룹 안의 자식 노드도 같은 레이어 (뒤로 빠지지 않도록) */
      .react-flow__node.react-flow__node--parent-selected {
        z-index: 3 !important;
      }

      /* ===== Background Pattern ===== */
      .dark .react-flow__background-pattern {
        stroke: rgba(255, 255, 255, 0.05) !important;
      }

      .react-flow__background-pattern {
        stroke: rgba(0, 0, 0, 0.1) !important;
      }

      /* ===== 패닝 모드 ===== */
      .react-flow.panning-mode {
        cursor: grab !important;
      }

      .react-flow.panning-mode:active {
        cursor: grabbing !important;
      }

      .react-flow.panning-mode .react-flow__node {
        cursor: grab !important;
      }

      .react-flow.panning-mode .react-flow__pane {
        cursor: grab !important;
      }

      .react-flow.panning-mode .react-flow__pane:active {
        cursor: grabbing !important;
      }

      /* ===== 기본 모드 ===== */
      .react-flow:not(.panning-mode):not(.block-creation-mode) {
        cursor: default !important;
      }

      .react-flow:not(.panning-mode):not(.block-creation-mode)
        .react-flow__pane {
        cursor: default !important;
      }

      /* ===== 블록 생성 모드 ===== */
      /* 기존 블록들을 반투명하게 만들고 상호작용 차단 */
      .react-flow.block-creation-mode .react-flow__node {
        opacity: 0.4 !important;
        transition: opacity 0.2s ease !important;
        /* ✅ 노드 자체는 pointer-events 유지 (클릭 통과) */
        pointer-events: auto !important;
      }

      /* 블록 내부의 모든 요소만 pointer-events 차단 */
      .react-flow.block-creation-mode .react-flow__node > * {
        pointer-events: none !important;
      }

      /* 호버 효과 차단 */
      .react-flow.block-creation-mode .react-flow__node:hover {
        opacity: 0.4 !important;
      }

      /* 블록의 호버 border/outline 제거 */
      .react-flow.block-creation-mode .react-flow__node:hover > * {
        border-color: transparent !important;
        outline: none !important;
      }

      /* 캔버스 전체에 crosshair 커서 */
      .react-flow.block-creation-mode,
      .react-flow.block-creation-mode .react-flow__pane,
      .react-flow.block-creation-mode .react-flow__node,
      .react-flow.block-creation-mode .react-flow__node * {
        cursor: crosshair !important;
      }

      /* 엣지도 투명하게 */
      .react-flow.block-creation-mode .react-flow__edge {
        opacity: 0.3 !important;
        pointer-events: none !important;
      }
    `}</style>
  );
}
