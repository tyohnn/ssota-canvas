import { CanvasToolMode } from "@/domains/react-flow-canvas/components/canvas-toolbar";
import { ComponentCanvasToolMode } from "@/domains/react-flow-canvas/components/component-canvas-toolbar";
import type { Node, Edge, ReactFlowInstance } from "@xyflow/react";

// React Flow Canvas 도메인의 핵심 타입들
export interface ReactFlowCanvasConfig {
  // 기본 설정
  nodeTypes?: Record<string, React.ComponentType<any>>;
  minZoom?: number;
  maxZoom?: number;
  fitView?: boolean;
  
  // 상호작용 설정
  nodesDraggable?: boolean;
  elementsSelectable?: boolean;
  selectionOnDrag?: boolean;
  panOnDrag?: number[];
  
  // 선택 설정
  enableMultiSelection?: boolean;
  enableDragSelection?: boolean;
  
  // UI 설정
  showControls?: boolean;
  showMiniMap?: boolean;
  showBackground?: boolean;
}

// React Flow Canvas 상태
export interface ReactFlowCanvasState {
  // 빈 상태 (뷰포트와 툴 모드는 ControlContext로 이동)
}

// React Flow Canvas 이벤트
export interface ReactFlowCanvasEvents {
  // 노드 이벤트
  onNodeClick?: (node: Node, event: React.MouseEvent) => void;
  onNodeDoubleClick?: (node: Node, event: React.MouseEvent) => void;
  onNodeDragStart?: (node: Node, event: React.MouseEvent) => void;
  onNodeDragStop?: (node: Node, event: React.MouseEvent) => void;
  
  // 엣지 이벤트
  onEdgeClick?: (edge: Edge, event: React.MouseEvent) => void;
  onEdgeDoubleClick?: (edge: Edge, event: React.MouseEvent) => void;
  
  // 캔버스 이벤트
  onPaneClick?: (event: React.MouseEvent) => void;
  onPaneContextMenu?: (event: React.MouseEvent) => void;
  
  // 선택 이벤트
  onSelectionChange?: (selectedNodes: Node[], selectedEdges: Edge[]) => void;
  
  // 드래그 선택 이벤트
  onDragSelectionStart?: (startPos: { x: number; y: number }) => void;
  onDragSelectionUpdate?: (currentPos: { x: number; y: number }) => void;
  onDragSelectionEnd?: (selectedNodeIds: string[]) => void;
  
  // 연결 이벤트
  onConnect?: (connection: any) => void;
  onConnectStart?: (event: React.MouseEvent) => void;
  onConnectEnd?: (event: React.MouseEvent) => void;
  
  // 뷰포트 이벤트
  onMove?: (event: any, viewport: any) => void;
  onMoveStart?: (event: any, viewport: any) => void;
  onMoveEnd?: (event: any, viewport: any) => void;
  
  // 줌 이벤트
  onZoom?: (event: any, viewport: any) => void;
  onZoomStart?: (event: any, viewport: any) => void;
  onZoomEnd?: (event: any, viewport: any) => void;
  
  // 노드 변경 이벤트 (Canvas 도메인 동기화용)
  onNodeDimensionsChange?: (changes: any[]) => void;
  onNodeDataChange?: (changes: any[]) => void;
  onNodePositionChange?: (changes: any[]) => void;
  
  // 키보드 이벤트
  onEscape?: () => void;
  onClearSelection?: () => void;
  
  // 툴바 렌더링 플래그
  renderCanvasToolbar?: boolean;
  renderComponentToolbar?: boolean;
  renderViewToolbar?: boolean;
  
  // Canvas 툴바 콜백들
  isAddOpen?: boolean;
  toggleAdd?: () => void;
  isEditOpen?: boolean;
  toggleEdit?: () => void;
  isPageSelected?: boolean;
  isPageEditorOpen?: boolean;
  
  // Component 툴바 콜백들
  onBackToPage?: () => void;
  componentName?: string | null;
  
  // Context 메뉴
  renderContextMenu?: (menuState: { id: string; x: number; y: number } | null) => React.ReactNode;
}

// React Flow Canvas 명령
export interface ReactFlowCanvasCommands {
  // 노드 명령
  updateNodePosition: (nodeId: string, position: { x: number; y: number }) => void;
  updateNodeData: (nodeId: string, data: any) => void;
  deleteNodes: (nodeIds: string[]) => void;
  
  // 엣지 명령
  updateEdgeData: (edgeId: string, data: any) => void;
  deleteEdges: (edgeIds: string[]) => void;
  

  
  // 뷰포트 명령
  fitView: (options?: { padding?: number; duration?: number }) => void;
  zoomTo: (zoom: number) => void;
}

// React Flow Canvas 컨텍스트
export interface ReactFlowCanvasContextValue {
  // 상태
  state: ReactFlowCanvasState;
  
  // 명령
  commands: ReactFlowCanvasCommands;
  
  // 이벤트
  events: ReactFlowCanvasEvents;
  
  // 설정
  config: ReactFlowCanvasConfig;
  
  // React Flow 인스턴스
  rfInstance: ReactFlowInstance | null;
  setRfInstance: (instance: ReactFlowInstance | null) => void;
  
  // React Flow 내장 상태
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: any[]) => void;
  onEdgesChange: (changes: any[]) => void;
}
