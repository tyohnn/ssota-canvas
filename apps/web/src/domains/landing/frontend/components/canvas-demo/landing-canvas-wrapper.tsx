/**
 * Landing Canvas Wrapper
 *
 * Read-only Canvas wrapper for landing page demos
 * - All interactions disabled
 * - Externally controlled state
 * - No database updates
 * - Uses original Canvas UI components
 */

'use client';

import React, { useEffect, useMemo } from 'react';

import { useTheme } from 'next-themes';

import {
  Background,
  type Edge,
  type Node,
  Panel,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FileText, type LucideIcon, Rocket } from 'lucide-react';

import { AIAgentRunner } from '@/domains/ai-management/frontend/components/ai-agent-runner';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
// Canvas management
import { CustomEdge } from '@/domains/canvas-management/frontend/components/react-flow-wrapper/components/custom-edge';
// Original Canvas components
import { CanvasToolbar } from '@/domains/canvas-management/frontend/components/react-flow-wrapper/components/toolbar/canvas-toolbar';
import { ViewportControlToolbar } from '@/domains/canvas-management/frontend/components/react-flow-wrapper/components/toolbar/viewport-control-toolbar';
import { CANVAS_NODE_TYPES } from '@/domains/canvas-management/frontend/config/node-types.config';
import {
  type CanvasMode,
  useCanvasModeContext,
} from '@/domains/canvas-management/frontend/hooks/mode/canvas-mode-context';

import { ShowcaseCanvasHeader } from './showcase-canvas-header';

interface LandingCanvasWrapperProps {
  nodes: Node[];
  edges: Edge[];
  viewport?: { x: number; y: number; zoom: number };
  selectedNodeId?: string;
  canvasMode?: CanvasMode['type'];
  onAnimationComplete?: () => void;
  // Demo props (read-only)
  pageId?: string;
  orgId?: string;
  workspaceId?: string;
  // Showcase header props
  subPhase?: number;
  workspaceName?: string;
  workspaceIcon?: LucideIcon;
  pageName?: string;
  pageIcon?: LucideIcon;
  // Animation config
  viewportAnimationDuration?: number; // viewport 애니메이션 duration (ms)
}

export function LandingCanvasWrapper({
  nodes,
  edges,
  viewport,
  selectedNodeId,
  canvasMode = 'default',
  onAnimationComplete,
  pageId = 'demo-page',
  orgId = 'demo-org',
  workspaceId = 'demo-workspace',
  subPhase = 0,
  workspaceName = 'Workspace',
  workspaceIcon = Rocket,
  pageName = 'Page',
  pageIcon = FileText,
  viewportAnimationDuration = 600,
}: LandingCanvasWrapperProps) {
  const { theme } = useTheme();
  const reactFlow = useReactFlow();
  const canvasModeContext = useCanvasModeContext();

  // Enrich edges with metadata (same as canvas-react-flow-wrapper.tsx)
  const enrichedEdges = useMemo(
    () =>
      edges.map(edge => ({
        ...edge,
        type: edge.type || 'custom', // 기존 타입 보존
        data: {
          ...edge.data,
          pageId,
          orgId,
          workspaceId,
          actualEdgeShape: edge.data?.actualEdgeShape || 'default', // 기존 값 보존
        },
      })),
    [edges, pageId, orgId, workspaceId]
  );

  // Internal state (controlled externally)
  const [internalNodes, setNodes, onNodesChange] = useNodesState(nodes);
  const [internalEdges, setEdges, onEdgesChange] = useEdgesState(enrichedEdges);

  // External control: edges
  useEffect(() => {
    setEdges(enrichedEdges);
  }, [enrichedEdges, setEdges]);

  // Use shared node types configuration (PDF 포함)
  const nodeTypes = useMemo(() => CANVAS_NODE_TYPES, []);

  // Edge types
  const edgeTypes = useMemo(
    () => ({
      custom: CustomEdge,
    }),
    []
  );

  // External control: nodes (with selection)
  useEffect(() => {
    const updatedNodes = nodes.map(node => ({
      ...node,
      selected: node.id === selectedNodeId,
    }));
    setNodes(updatedNodes);
  }, [nodes, selectedNodeId, setNodes]);

  // External control: viewport
  useEffect(() => {
    if (viewport) {
      reactFlow.setViewport(viewport, {
        duration: viewportAnimationDuration,
      });

      // Call onAnimationComplete after animation
      if (onAnimationComplete) {
        setTimeout(onAnimationComplete, viewportAnimationDuration);
      }
    }
  }, [viewport, reactFlow, onAnimationComplete, viewportAnimationDuration]);

  // External control: canvas mode
  useEffect(() => {
    if (canvasMode === 'single-selection' && selectedNodeId) {
      canvasModeContext.enterSingleSelectionMode(selectedNodeId);
    } else if (canvasMode === 'block-editing' && selectedNodeId) {
      // selectedNodeId는 blockMountId이므로, 노드에서 blockId를 가져와야 함
      const selectedNode = nodes.find(node => node.id === selectedNodeId);
      const blockId =
        (selectedNode?.data as BlockNodeData)?.blockId || selectedNodeId; // fallback to selectedNodeId
      canvasModeContext.enterBlockEditingMode(blockId, selectedNodeId);
    } else if (canvasMode === 'default') {
      canvasModeContext.exitToDefaultMode();
    }
  }, [canvasMode, selectedNodeId, nodes, canvasModeContext]); // canvasModeContext 제거하여 무한 루프 방지

  return (
    <div className="h-full w-full relative flex flex-col">
      {/* Showcase Canvas Header */}
      {subPhase !== undefined && (
        <ShowcaseCanvasHeader
          workspaceName={workspaceName}
          workspaceIcon={workspaceIcon}
          pageName={pageName}
          pageIcon={pageIcon}
          subPhase={subPhase}
        />
      )}

      {/* Canvas Container */}
      <div className="flex-1 relative">
        {/* React Flow styles */}
        <style jsx global>{`
          /* Override xyflow dark mode: use theme background via --xy-background-color */
          .react-flow,
          .react-flow.dark {
            --xy-background-color-default: var(--background) !important;
            --xy-background-color: var(--background) !important;
            background-color: var(--background) !important;
          }
          .react-flow__background {
            background-color: var(--background) !important;
          }
          .react-flow__pane {
            background-color: transparent !important;
          }

          .react-flow__node.selected,
          .react-flow__node.selectable:focus,
          .react-flow__node.selectable:focus-visible {
            outline: none !important;
          }

          .dark .react-flow__background-pattern {
            stroke: rgba(255, 255, 255, 0.05) !important;
          }

          .react-flow__background-pattern {
            stroke: rgba(0, 0, 0, 0.1) !important;
          }
        `}</style>

        <ReactFlow
          nodes={internalNodes}
          edges={internalEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          colorMode={theme === 'dark' ? 'dark' : 'light'}
          // 🔒 All interactions disabled for landing page
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={false}
          panOnScroll={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          selectNodesOnDrag={false}
          // No event handlers (read-only mode)
          minZoom={0.1}
          maxZoom={2}
          className="bg-background h-full w-full"
          style={{ backgroundColor: 'var(--background)' }}
        >
          <Background />

          {/* 캔버스 상단 툴바 - 원래 컴포넌트 사용 (클릭 불가, 헤더 아래 배치) */}
          <Panel
            position="center-left"
            className="m-0! pointer-events-none! z-10"
          >
            <CanvasToolbar
              onAddBlockTypeClick={() => {}} // 비활성화
            />
          </Panel>

          {/* 좌측 하단 AI Agent Runner - 원래 컴포넌트 사용 (클릭 불가) */}
          <Panel position="bottom-left" className="pointer-events-none!">
            <AIAgentRunner />
          </Panel>

          {/* 우측 하단 뷰포트 컨트롤 - 원래 컴포넌트 사용 (클릭 불가) */}
          <Panel position="bottom-right" className="pointer-events-none!">
            <ViewportControlToolbar />
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}
