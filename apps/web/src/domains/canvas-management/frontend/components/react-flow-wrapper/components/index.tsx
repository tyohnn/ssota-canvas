import React from 'react';

import {
  Background,
  ConnectionMode,
  type Edge,
  type Node,
  Panel,
  ReactFlow,
  SelectionMode,
} from '@xyflow/react';

import { AIAgentRunner } from '@/domains/ai-management/frontend/components/ai-agent-runner';
import type { BlockType } from '@/domains/block-management/shared/types/block-types';

import { MultiSelectionToolbar } from './multi-select/multi-selection-toolbar';
import { SelectionBoundingBox } from './multi-select/selection-bounding-box';
import { ReactFlowStyles } from './react-flow-styles';
import { ShadowBlockContainer } from './shadow-block';
import { SnapGuidelines } from './snap/snap-guidelines';
import { BlockAddDialog } from './toolbar/block-add-dialog';
import { CanvasToolbar } from './toolbar/canvas-toolbar';
import { ViewportControlToolbar } from './toolbar/viewport-control-toolbar';

/**
 * React Flow View Props
 */
export interface ReactFlowViewProps {
  // React Flow state
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  nodeTypes: Record<string, React.ComponentType<any>>;
  edgeTypes: Record<string, React.ComponentType<any>>;

  // Viewport
  defaultViewport: { x: number; y: number; zoom: number };
  onMove: (
    event: unknown,
    viewport: { x: number; y: number; zoom: number }
  ) => void;

  // Theme
  colorMode: 'light' | 'dark';

  // Interaction settings
  panOnScrollEnabled: boolean;
  panOnDragEnabled: boolean;
  isBlockCreationMode: boolean;
  isPanningMode: boolean; // Used for key prop to force re-render

  // Event handlers - Drag
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
  onNodeDragStop: (
    event: React.MouseEvent,
    node: Node,
    draggedNodes: Node[]
  ) => Promise<void>;

  // Event handlers - Selection
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onSelectionChange: ({ nodes }: { nodes: Node[] }) => void;
  onPaneClick: (event: React.MouseEvent) => void;

  // Event handlers - Edge
  onConnect: (connection: any) => void | Promise<void>;
  onReconnect: (oldEdge: Edge, newConnection: any) => void | Promise<boolean>;
  onReconnectStart: () => void;
  onReconnectEnd: (event: MouseEvent | TouchEvent, edge: Edge) => Promise<void>;

  // Event handlers - Delete
  onNodesDelete: (deletedNodes: Node[]) => Promise<void>;
  onEdgesDelete: (deletedEdges: Edge[]) => Promise<void>;

  // Custom wheel handler
  onWheel: (event: React.WheelEvent<HTMLDivElement>) => void;

  // Guidelines
  guidelines: any[];

  // Block Add Dialog
  showAddDialog: boolean;
  onAddBlockClick: () => void;
  onCloseAddDialog: () => void;
  onSelectBlockType: (blockType: BlockType) => void;

  // Feature flags
  showAIAgent?: boolean;
  showBlockCreation?: boolean;
}

/**
 * React Flow View Component
 *
 * Presentational 컴포넌트 - ReactFlow JSX와 Panel 컴포넌트들을 렌더링
 */
export function ReactFlowView({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  nodeTypes,
  edgeTypes,
  defaultViewport,
  onMove,
  colorMode,
  panOnScrollEnabled,
  panOnDragEnabled,
  isBlockCreationMode,
  isPanningMode,
  onNodeDragStart,
  onNodeDrag,
  onNodeDragStop,
  onNodeClick,
  onSelectionChange,
  onPaneClick,
  onConnect,
  onReconnect,
  onReconnectStart,
  onReconnectEnd,
  onNodesDelete,
  onEdgesDelete,
  onWheel,
  guidelines,
  showAddDialog,
  onAddBlockClick,
  onCloseAddDialog,
  onSelectBlockType,
  showAIAgent = true,
  showBlockCreation = true,
}: ReactFlowViewProps) {

  return (
    <main className="flex-1 relative overflow-hidden">
      <div className="h-full w-full relative" onWheel={onWheel}>
        {/* React Flow 기본 선택 박스 스타일링 */}
        <ReactFlowStyles />

        <ReactFlow
          // key prop으로 panOnDrag 변경 시 강제 리렌더링 (React Flow 내부 상태 초기화)
          // panOnDrag가 동적으로 변경될 때 내부 이벤트 핸들러가 즉시 반영되지 않는 React Flow 이슈 해결
          key={isPanningMode ? 'panning-mode' : 'default-mode'}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          // 기본 설정
          defaultViewport={defaultViewport}
          minZoom={0.1}
          maxZoom={2}
          // 테마 설정
          colorMode={colorMode}
          // 상호작용 설정
          nodesDraggable={!panOnDragEnabled && !isBlockCreationMode} // readonly일 때 panOnDragEnabled=true이므로 드래그 비활성화
          nodesConnectable={!panOnDragEnabled && !isBlockCreationMode} // readonly일 때 연결 비활성화
          elementsSelectable={!isBlockCreationMode} // 블록 생성 모드에서는 선택 비활성화 (readonly 모드에서는 isBlockCreationMode가 항상 false이므로 선택 가능)
          selectionOnDrag={!isBlockCreationMode} // readonly 모드와 일반 모드에서 드래그 선택 가능 (panOnDrag와 함께 사용 가능)
          selectionMode={SelectionMode.Partial}
          connectionMode={ConnectionMode.Loose} // source/target 구분 없이 양방향 연결 허용
          // 트랙패드 제스처 설정 (피그마 스타일)
          panOnDrag={panOnDragEnabled} // 패닝 모드에서는 드래그로 패닝
          panOnScroll={panOnScrollEnabled} // 두 손가락 스크롤로 패닝 (textarea 편집 중 비활성화)
          zoomOnScroll={false} // 스크롤로 줌 비활성화
          zoomOnPinch={true} // 핀치 제스처로 줌 활성화
          // 이벤트 핸들러 (CM-003, CM-007 추가) - 블록 생성 모드용 override
          onNodeClick={onNodeClick}
          onSelectionChange={onSelectionChange}
          onPaneClick={onPaneClick}
          onNodeDragStart={onNodeDragStart}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDragStop}
          onConnect={onConnect}
          onReconnect={onReconnect}
          onReconnectStart={onReconnectStart}
          onReconnectEnd={onReconnectEnd}
          onNodesDelete={onNodesDelete}
          onEdgesDelete={onEdgesDelete}
          onMove={onMove}
          // onKeyDown은 전역 리스너로 처리 (포커스 문제 우회)
          deleteKeyCode={['Delete', 'Backspace']}
          className={`bg-muted/30 ${panOnDragEnabled ? 'panning-mode' : ''} ${isBlockCreationMode ? 'block-creation-mode' : ''}`}
        >
          <Background />

          {/* 캔버스 상단 툴바 - Panel로 ReactFlow 내부로 이동 */}
          {/* z-index: 블럭(0) < canvas-toolbar(10) < multi-selection-toolbar(50) */}
          <Panel
            position="top-center"
            className="m-0! pointer-events-auto! z-10"
          >
            <CanvasToolbar onAddBlockClick={onAddBlockClick} />
          </Panel>

          {/* 모드별 컴포넌트 렌더링 */}
          {isBlockCreationMode && <ShadowBlockContainer />}

          {/* Multi-selection 모드 컴포넌트는 canvasMode를 통해 자체적으로 체크 */}
          <MultiSelectionToolbar />
          <SelectionBoundingBox />

          {/* 항상 렌더링하고 내부에서 조건 체크 (상태 업데이트 타이밍 이슈 방지) */}
          <SnapGuidelines guidelines={guidelines} />

          {/* 좌측 하단 AI Agent Runner - Panel로 감싸서 React Flow 이벤트 시스템 통합 */}
          {showAIAgent && (
            <Panel
              position="bottom-left"
              className="ml-4! mb-4! pointer-events-auto!"
            >
              <AIAgentRunner />
            </Panel>
          )}

          {/* 우측 하단 뷰포트 컨트롤 - Panel로 감싸서 React Flow 이벤트 시스템 통합 */}
          <Panel
            position="bottom-right"
            className="mr-4! mb-4! pointer-events-auto!"
          >
            <ViewportControlToolbar />
          </Panel>
        </ReactFlow>

        {/* Block Add Dialog (캔버스 밖에 위치) */}
        {showBlockCreation && (
          <BlockAddDialog
            isOpen={showAddDialog}
            onClose={onCloseAddDialog}
            onSelectBlockType={onSelectBlockType}
          />
        )}
      </div>
    </main>
  );
}
