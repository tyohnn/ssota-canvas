'use client';

import React, { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  SelectionMode,
  type OnConnect,
  type Node,
  type Edge,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Type imports
import type { CustomNodeType } from '../acl/react-flow.acl';

// Canvas Management Hooks
import { useCanvasMode } from '../hooks/use-canvas-mode';
import { useCanvasSelection } from '../hooks/use-canvas-selection';
import { useCanvasViewport } from '../hooks/use-canvas-viewport';

// Canvas Management Components
import { CanvasToolbar } from './canvas-toolbar';
import { ViewportControls } from './viewport-controls';
import { SkeletonBlock } from './skeleton-block';
import { BlockMountToolbar } from './block-mount-toolbar';
import { BlockAddDialog } from './block-add-dialog';
import { BasicBlockNode } from './basic-block-node';

interface CanvasReactFlowWrapperProps {
  pageId: string;
  orgId: string;
  workspaceId: string;
  initialNodes: Node[];
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
  // React Flow 상태 관리 (SSOT)
  const [nodes, setNode, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdge, onEdgesChange] = useEdgesState(initialEdges);

  // Canvas Management Hooks (읽기 전용 버전)
  const canvasMode = useCanvasMode();
  const canvasSelection = useCanvasSelection();
  const canvasViewport = useCanvasViewport();

  // BlockAddDialog 상태 관리
  const [showAddDialog, setShowAddDialog] = React.useState(false);

  // 노드 타입 정의
  const nodeTypes = React.useMemo(
    () => ({
      basic: BasicBlockNode,
      // 다른 블록 타입들도 여기에 추가 가능
    }),
    []
  );

  // 블럭 타입 선택 핸들러
  const handleSelectBlockType = React.useCallback(
    (blockType: string) => {
      setShowAddDialog(false);
      // 선택된 블럭 타입으로 생성 모드 진입
      canvasMode.enterBlockCreationMode(blockType);
    },
    [canvasMode]
  );

  // 트랙패드 제스처 최적화 설정 (피그마 스타일)
  // - 핀치 제스처: 줌인/줌아웃
  // - 두 손가락 스크롤: 캔버스 패닝

  return (
    <div className="h-full w-full relative">
      {/* 캔버스 상단 툴바 */}
      <CanvasToolbar
        pageId={pageId}
        onAddBlockClick={() => setShowAddDialog(true)}
      />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        // 기본 설정
        fitView
        minZoom={0.1}
        maxZoom={2}
        // 상호작용 설정
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        selectionOnDrag={true}
        selectionMode={SelectionMode.Partial}
        // 트랙패드 제스처 설정 (피그마 스타일)
        panOnDrag={[1]} // 마우스 왼쪽 버튼으로 패닝
        panOnScroll={true} // 두 손가락 스크롤로 패닝
        zoomOnScroll={false} // 스크롤로 줌 비활성화
        zoomOnPinch={true} // 핀치 제스처로 줌 활성화
        className="bg-gray-50"
      >
        <Background />
        <Controls />

        {/* 우측 하단 뷰포트 컨트롤 */}
        <ViewportControls />

        {/* 블럭 생성 모드에서 표시되는 스켈레톤 블럭 */}
        <SkeletonBlock
          pageId={pageId}
          orgId={orgId}
          workspaceId={workspaceId}
        />

        {/* 선택된 블럭의 컨텍스트 툴바 */}
        <BlockMountToolbar
          pageId={pageId}
          orgId={orgId}
          workspaceId={workspaceId}
        />
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
