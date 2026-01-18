'use client';

import type { Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { CustomNodeType } from '@/domains/canvas-management/frontend/acl/react-flow.acl';

import { ReactFlowView } from './components';
import { useReactFlowWrapper } from './core/use-react-flow-wrapper';

interface CanvasReactFlowWrapperProps {
  initialNodes: CustomNodeType[];
  initialEdges: Edge[];
}

/**
 * Canvas React Flow Wrapper (React Flow SSOT)
 *
 * Container 컴포넌트 - Hook을 호출하고 Props를 View로 전달만 수행
 * - 모든 로직은 useReactFlowWrapper 훅에서 처리
 * - Container/Presentational 패턴 준수
 */
export function CanvasReactFlowWrapper({
  initialNodes,
  initialEdges,
}: CanvasReactFlowWrapperProps) {
  // Hook에서 모든 로직 처리
  const hook = useReactFlowWrapper({
    initialNodes,
    initialEdges,
  });

  // View에 Props 전달
  return (
    <ReactFlowView
      // react flow state
      nodes={hook.nodes}
      edges={hook.edges}
      onNodesChange={hook.onNodesChange}
      onEdgesChange={hook.onEdgesChange}
      nodeTypes={hook.nodeTypes}
      edgeTypes={hook.edgeTypes}
      defaultViewport={hook.defaultViewport}
      colorMode={hook.colorMode}
      // interaction settings
      onMove={hook.onMove}
      panOnScrollEnabled={hook.panOnScrollEnabled}
      panOnDragEnabled={hook.panOnDragEnabled}
      isBlockCreationMode={hook.isBlockCreationMode}
      isPanningMode={hook.isPanningMode}
      onNodeDragStart={hook.onNodeDragStart}
      onNodeDrag={hook.onNodeDrag}
      onNodeDragStop={hook.onNodeDragStop}
      onNodeClick={hook.handleNodeClick}
      onSelectionChange={hook.onSelectionChange}
      onPaneClick={hook.handlePaneClick}
      onConnect={hook.onConnect}
      onReconnect={hook.onReconnect}
      onReconnectStart={hook.onReconnectStart}
      onReconnectEnd={hook.onReconnectEnd}
      onNodesDelete={hook.onNodesDelete}
      onEdgesDelete={hook.onEdgesDelete}
      onWheel={hook.handleWheel}
      guidelines={hook.guidelines}
      showAddDialog={hook.showAddDialog}
      onAddBlockClick={() => hook.setShowAddDialog(true)}
      onCloseAddDialog={() => hook.setShowAddDialog(false)}
      onSelectBlockType={hook.handleSelectBlockType}
      showAIAgent={hook.showAIAgent}
      showBlockCreation={hook.showBlockCreation}
    />
  );
}
