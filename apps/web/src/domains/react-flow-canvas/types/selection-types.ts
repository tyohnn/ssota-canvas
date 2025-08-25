// React Flow Canvas 선택 관련 타입들

// 선택 박스 타입
export interface SelectionBox {
  start: { x: number; y: number };
  current: { x: number; y: number };
}

// 드래그 선택 상태
export interface DragSelectionState {
  isDragging: boolean;
  selectionBox: SelectionBox | null;
  isCtrlPressed: boolean;
  tempSelectedIds: string[];
}

// 선택 변경 이벤트
export interface SelectionChangeEvent {
  selectedNodes: string[];
  selectedEdges: string[];
  source: 'click' | 'drag' | 'keyboard' | 'programmatic';
}

// 선택 정책
export interface SelectionPolicy {
  // 다중 선택 허용 여부
  allowMultiSelection: boolean;
  
  // 드래그 선택 허용 여부
  allowDragSelection: boolean;
  
  // Ctrl/Cmd 키 필요 여부
  requireCtrlForMultiSelection: boolean;
  
  // 선택 해제 허용 여부
  allowDeselection: boolean;
  
  // 선택 박스 포함 기준
  selectionBoxInclusion: 'overlap' | 'fullContainment';
}

// 선택 유틸리티 함수 타입
export interface SelectionUtils {
  // 선택 박스 내 노드 계산
  getNodesInSelectionBox: (
    box: SelectionBox,
    nodes: any[],
    rfInstance?: any
  ) => string[];
  
  // 노드 선택 상태 확인
  isNodeSelected: (nodeId: string, selectedIds: string[]) => boolean;
  
  // 선택 박스 계산
  calculateSelectionBox: (
    start: { x: number; y: number },
    current: { x: number; y: number }
  ) => SelectionBox;
}
