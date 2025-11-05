'use client';

import React from 'react';
import {
  ReactFlow,
  Background,
  Panel,
  SelectionMode,
  ConnectionMode,
  type Node,
  type Edge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTheme } from 'next-themes';

// Type imports
import type { CustomNodeType } from '../../acl/react-flow.acl';
import { BlockType } from '@/domains/block-management/shared/types/block-types';

// Canvas Management Hooks
import { useCanvasMode } from '../../hooks/use-canvas-mode';
import { useCanvasSelection } from '../../hooks/use-canvas-selection';
import { useCanvasViewport } from '../../hooks/use-canvas-viewport';
import { useCanvasBlockTransform } from '../../hooks/use-canvas-block-transform';
import { useCanvasSnapGuides } from '../../hooks/use-canvas-snap-guides';
import { useCanvasEdgeManagement } from '../../hooks/use-canvas-edge-management';
import { useCanvasBlockLifecycle } from '../../hooks/use-canvas-block-lifecycle';
import { useCanvasCallbacks } from '../../hooks/use-canvas-callbacks';

// Canvas Management Components
import { CanvasToolbar } from './canvas-toolbar';
import { ViewportControls } from './viewport-controls';
import { ShadowBlockContainer } from '../shadow-block/shadow-block-container';
import { BlockAddDialog } from './block-add-dialog';
import {
  MarkdownBlock,
  YoutubeBlock,
  PythonBlock,
  TextBlock,
  ShapeBlock,
  ImageBlock,
} from '@/domains/block-management/frontend/components/block';
import { SnapGuidelines } from '../snap/snap-guidelines';
import { MultiSelectionToolbar } from '../multi-select/multi-selection-toolbar';
import { BlockMountToolbar } from '@/domains/block-management/frontend/components/block-mount-toolbar';
import { SelectionBoundingBox } from '../multi-select/selection-bounding-box';
import { CustomEdge } from '../edge/custom-edge';

interface CanvasReactFlowWrapperProps {
  pageId: string;
  orgId: string;
  workspaceId: string;
  initialNodes: CustomNodeType[];
  initialEdges: Edge[];
}

/**
 * Canvas React Flow Wrapper (React Flow SSOT)
 *
 * React Flow를 직접 사용하여 캔버스를 렌더링하는 컴포넌트
 * - React Flow State가 SSOT (단일 진실 공급원)
 * - Hook에서 서버 액션 래핑 메서드 제공
 * - 콜백에서 DB 저장만 담당
 */
export function CanvasReactFlowWrapper({
  pageId,
  orgId,
  workspaceId,
  initialNodes,
  initialEdges,
}: CanvasReactFlowWrapperProps) {
  // 노드 데이터에 pageId, orgId, workspaceId 추가
  const enrichedNodes = React.useMemo(
    () =>
      initialNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          pageId,
          orgId,
          workspaceId,
        },
      })),
    [initialNodes, pageId, orgId, workspaceId]
  );

  // 엣지 데이터에 pageId, orgId, workspaceId 추가 (EdgeToolbar에서 사용)
  const enrichedEdges = React.useMemo(
    () =>
      initialEdges.map(edge => ({
        ...edge,
        type: 'custom', // 모든 엣지를 커스텀 엣지로 설정
        data: {
          ...edge.data,
          pageId,
          orgId,
          workspaceId,
          actualEdgeType: edge.type || 'default', // 실제 엣지 타입 저장
        },
      })),
    [initialEdges, pageId, orgId, workspaceId]
  );

  // Theme for React Flow colorMode
  const { theme } = useTheme();

  // React Flow 상태 관리 (SSOT)
  const [nodes, setNode, onNodesChange] = useNodesState(enrichedNodes);
  const [edges, setEdge, onEdgesChange] = useEdgesState(enrichedEdges);
  const reactFlowInstance = useReactFlow();

  // Canvas Management Hooks
  const canvasMode = useCanvasMode();
  const canvasSelection = useCanvasSelection();
  const canvasViewport = useCanvasViewport();

  // PanOnScroll 동적 제어: textarea 편집 중에는 비활성화
  const panOnScrollEnabled = !canvasMode.isTextareaEditing;
  const blockTransform = useCanvasBlockTransform({
    orgId,
    workspaceId,
  });
  const snapGuides = useCanvasSnapGuides();
  const edgeManagement = useCanvasEdgeManagement({
    pageId,
    orgId,
    workspaceId,
  });
  const blockLifecycle = useCanvasBlockLifecycle({
    pageId,
    orgId,
    workspaceId,
  });

  // React Flow Callbacks Hook
  const canvasCallbacks = useCanvasCallbacks({
    pageId,
    orgId,
    workspaceId,
    canvasMode,
    canvasSelection,
    blockTransform,
    snapGuides,
    edgeManagement,
    blockLifecycle,
  });

  // BlockAddDialog 상태 관리
  const [showAddDialog, setShowAddDialog] = React.useState(false);

  // 노드 타입 정의 (타입 안전성 보장)
  const nodeTypes = React.useMemo(
    () => ({
      [BlockType.TEXT]: TextBlock,
      [BlockType.SHAPE]: ShapeBlock,
      [BlockType.IMAGE]: ImageBlock,
      [BlockType.MARKDOWN]: MarkdownBlock,
      [BlockType.YOUTUBE]: YoutubeBlock,
      [BlockType.PYTHON]: PythonBlock,
      // 다른 블록 타입들도 여기에 추가 가능
    }),
    []
  );

  // 엣지 타입 정의
  const edgeTypes = React.useMemo(
    () => ({
      custom: CustomEdge,
      // 다른 엣지 타입들도 여기에 추가 가능
    }),
    []
  );

  // 블럭 타입 선택 핸들러
  const handleSelectBlockType = React.useCallback(
    (blockType: BlockType) => {
      setShowAddDialog(false);
      // useCanvasCallbacks 훅의 핸들러 사용
      canvasCallbacks.handleSelectBlockType(blockType);
    },
    [canvasCallbacks.handleSelectBlockType]
  );

  // 트랙패드 제스처 최적화 설정 (피그마 스타일)
  // - 핀치 제스처: 줌인/줌아웃
  // - 두 손가락 스크롤: 캔버스 패닝

  return (
    <div className="h-full w-full relative">
      {/* React Flow 기본 선택 박스 스타일링 */}
      <style jsx global>{`
        /* 선택 드래그 프리뷰 박스 (파란색 반투명) */
        .react-flow__selection {
          background: rgba(59, 130, 246, 0.08) !important;
          border: 1px dashed rgb(59, 130, 246) !important;
        }

        /* 다크모드: 선택 드래그 프리뷰 박스 */
        .dark .react-flow__selection {
          background: rgba(59, 130, 246, 0.15) !important;
          border: 1px dashed rgb(96, 165, 250) !important;
        }

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

        /* React Flow Background 다크모드 */
        .dark .react-flow__background-pattern {
          stroke: rgba(255, 255, 255, 0.05) !important;
        }
      `}</style>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        // 기본 설정
        fitView
        minZoom={0.1}
        maxZoom={2}
        // 테마 설정
        colorMode={theme === 'dark' ? 'dark' : 'light'}
        // 상호작용 설정
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        selectionOnDrag={true}
        selectionMode={SelectionMode.Full}
        connectionMode={ConnectionMode.Loose} // source/target 구분 없이 양방향 연결 허용
        // 트랙패드 제스처 설정 (피그마 스타일)
        panOnDrag={false} // 드래그는 선택 용도로만 사용
        panOnScroll={panOnScrollEnabled} // 두 손가락 스크롤로 패닝 (textarea 편집 중 비활성화)
        zoomOnScroll={false} // 스크롤로 줌 비활성화
        zoomOnPinch={true} // 핀치 제스처로 줌 활성화
        // 이벤트 핸들러 (CM-003, CM-007 추가)
        onNodeClick={canvasCallbacks.onNodeClick}
        onSelectionChange={canvasCallbacks.onSelectionChange}
        onPaneClick={canvasCallbacks.onPaneClick}
        onNodeDragStart={canvasCallbacks.onNodeDragStart}
        onNodeDrag={canvasCallbacks.onNodeDrag}
        onNodeDragStop={canvasCallbacks.onNodeDragStop}
        onConnect={canvasCallbacks.onConnect}
        onNodesDelete={canvasCallbacks.onNodesDelete}
        onKeyDown={canvasCallbacks.onKeyDown}
        deleteKeyCode={['Delete', 'Backspace']}
        className="bg-muted/30"
      >
        <Background />

        {/* 캔버스 상단 툴바 - Panel로 ReactFlow 내부로 이동 */}
        {/* z-index: 블럭(0) < canvas-toolbar(10) < multi-selection-toolbar(50) */}
        <Panel position="top-center" className="!m-0 !pointer-events-auto z-10">
          <CanvasToolbar
            pageId={pageId}
            onAddBlockClick={() => setShowAddDialog(true)}
          />
        </Panel>

        {/* 모드별 컴포넌트 렌더링 */}
        {canvasMode.isBlockCreationMode() && (
          <ShadowBlockContainer
            pageId={pageId}
            orgId={orgId}
            workspaceId={workspaceId}
          />
        )}

        {canvasMode.isMultiSelectionMode() && (
          <>
            <MultiSelectionToolbar
              pageId={pageId}
              orgId={orgId}
              workspaceId={workspaceId}
            />
            <SelectionBoundingBox orgId={orgId} workspaceId={workspaceId} />
          </>
        )}

        {/* 항상 렌더링하고 내부에서 조건 체크 (상태 업데이트 타이밍 이슈 방지) */}
        <SnapGuidelines guidelines={snapGuides.guidelines} />

        {/* 우측 하단 뷰포트 컨트롤 - Panel로 감싸서 React Flow 이벤트 시스템 통합 */}
        <Panel
          position="bottom-right"
          className="!mr-4 !mb-4 !pointer-events-auto"
        >
          <ViewportControls />
        </Panel>
      </ReactFlow>

      {/* Block Add Dialog (캔버스 밖에 위치) */}
      <BlockAddDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSelectBlockType={handleSelectBlockType}
        workspaceId={workspaceId}
      />
    </div>
  );
}
