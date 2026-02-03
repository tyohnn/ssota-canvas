'use client';

import type { ComponentType } from 'react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Background,
  type Edge,
  type Node,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { cn } from '@workspace/ui/lib/utils';
import { BlockType } from '@/domains/block-management/shared/types/block-types';
import { BLOCK_TYPE_SIZES } from '@/domains/block-management/shared/types/block-types';
import {
  MarkdownBlock,
  ShapeBlock,
  YoutubeBlock,
  ImageBlock,
  LinkBlock,
} from '@/domains/block-management/frontend/components/block/block-type';
import { CanvasMetadataProvider } from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import { CanvasReadOnlyProvider } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';
import { CustomEdge } from '@/domains/canvas-management/frontend/components/react-flow-wrapper/components/custom-edge';
import {
  CanvasModeProvider,
  useCanvasModeContext,
} from '@/domains/canvas-management/frontend/hooks/mode/canvas-mode-context';
import { useMockCanvas } from './core/use-mock-canvas';
import { MockCanvasToolbar } from '../mock-canvas-toolbar';
import { MockViewportControlToolbarConnected } from '../mock-viewport-control-toolbar';
import { MockBlockAddDialog } from '../mock-block-add-dialog';
import { MockShadowBlock } from './components/mock-shadow-block';
import { MockViewportNavigationProvider } from './core/mock-viewport-navigation-context';
import { TutorialStartOverlay } from '../common/tutorial-start-overlay';
import { TutorialStepOverlay } from '../common/tutorial-step-overlay';
import { InteractionGuard } from '../common/interaction-guard';
import { useTutorialDialogContext } from '../tutorial-dialog/core/context';
import type { NodeProps } from '@xyflow/react';

/**
 * Wraps a block node so the step overlay can target it with [data-tutorial="block-node"].
 * Highlight/card show on the block itself (same as select step).
 */
function withBlockNodeGuard<P extends NodeProps>(NodeComponent: ComponentType<P>) {
  return function BlockNodeWithGuard(props: P) {
    return (
      <InteractionGuard selector="block-node">
        <NodeComponent {...props} />
      </InteractionGuard>
    );
  };
}

/**
 * MockCanvas Node Types (5 types only)
 *
 * Reuses actual block components from the app; each is wrapped so step overlay can target block-node.
 */
const MOCK_CANVAS_NODE_TYPES = {
  [BlockType.MARKDOWN]: withBlockNodeGuard(MarkdownBlock),
  [BlockType.SHAPE]: withBlockNodeGuard(ShapeBlock),
  [BlockType.YOUTUBE]: withBlockNodeGuard(YoutubeBlock),
  [BlockType.IMAGE]: withBlockNodeGuard(ImageBlock),
  [BlockType.LINK]: withBlockNodeGuard(LinkBlock),
};

/** Tutorial mock canvas metadata (no real API). Used so blocks (DataBlock, etc.) can use useCanvasMetadata. */
const MOCK_CANVAS_METADATA = {
  pageId: 'tutorial',
  orgId: 'tutorial',
  workspaceId: 'tutorial',
} as const;

/**
 * Runs fitView when nodes are present so the placed block stays in view with padding.
 * Renders nothing.
 */
function FitViewEffect({ nodeCount }: { nodeCount: number }) {
  const { fitView } = useReactFlow();
  useEffect(() => {
    if (nodeCount > 0) {
      fitView({ duration: 500, padding: 0.2, maxZoom: 0.9 });
    }
  }, [nodeCount, fitView]);
  return null;
}

interface MockCanvasInnerProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
}

function MockCanvasInnerWithFlow({
  initialNodes = [],
  initialEdges = [],
}: MockCanvasInnerProps) {
  const {
    showBlockMenu,
    hasBlock,
    handleAddBlockClick,
    handleCloseDialog,
    handleSelectBlockType,
    handleBlockPlaced,
  } = useMockCanvas();

  const {
    currentTutorial,
    currentStepIndex,
    currentStep,
    startTutorial,
    completeCurrentStep,
    updateTutorialState,
  } = useTutorialDialogContext();

  const {
    isBlockCreationMode,
    getCurrentMode,
    exitToDefaultMode,
    enterBlockCreationMode,
    enterSingleSelectionMode,
  } = useCanvasModeContext();

  const reactFlow = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const defaultViewport = useMemo(() => ({ x: 0, y: 0, zoom: 1 }), []);

  const nodeTypes = useMemo(() => MOCK_CANVAS_NODE_TYPES, []);

  const edgeTypes = useMemo(
    () => ({
      custom: CustomEdge,
    }),
    []
  );

  const handlePaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (!isBlockCreationMode()) return;
      const mode = getCurrentMode();
      if (mode.type !== 'block-creation' || !mode.blockType) return;

      const target = event.target as HTMLElement;
      const isPane =
        target.classList.contains('react-flow__pane') ||
        target.classList.contains('react-flow__background') ||
        target.closest('.react-flow__pane') ||
        target.closest('.react-flow__background');
      if (!isPane) return;

      const blockType = mode.blockType;
      const blockSize = BLOCK_TYPE_SIZES[blockType] ?? BLOCK_TYPE_SIZES['text'];
      const position = reactFlow.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const adjustedPosition = {
        x: position.x - (blockSize?.width ?? 200) / 2,
        y: position.y - (blockSize?.height ?? 150) / 2,
      };

      const nodeId = `tutorial-block-${Date.now()}`;
      const nodeData = {
        blockId: nodeId,
        blockMountId: nodeId,
        blockType,
        title: '',
        viewMode: 'original' as const,
        properties: {},
        customProperties: [],
      };
      setNodes((prev) => [
        ...prev,
        {
          id: nodeId,
          type: blockType,
          position: adjustedPosition,
          data: nodeData,
          draggable: false,
          selectable: false,
          style: {
            width: blockSize?.width ?? 200,
            height: blockSize?.height ?? 150,
          },
        } as Node,
      ]);

      exitToDefaultMode();
      updateTutorialState({ lastPlacedNodeId: nodeId });
      handleBlockPlaced?.();
      setTimeout(() => completeCurrentStep(), 300);
    },
    [
      isBlockCreationMode,
      getCurrentMode,
      reactFlow,
      setNodes,
      exitToDefaultMode,
      updateTutorialState,
      handleBlockPlaced,
      completeCurrentStep,
    ]
  );

  useEffect(() => {
    if (!isBlockCreationMode()) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exitToDefaultMode();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBlockCreationMode, exitToDefaultMode]);

  const isBlockNodeStep =
    currentStep?.targetSelector === 'block-node' ||
    currentStep?.interactableSelectors?.includes('block-node');

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const blockNodeInteractable =
        currentStep?.targetSelector === 'block-node' ||
        currentStep?.interactableSelectors?.includes('block-node');
      if (!currentStep || !blockNodeInteractable) return;
      setNodes((nodes) =>
        nodes.map((n) => ({ ...n, selected: n.id === node.id }))
      );
      enterSingleSelectionMode(node.id);
      if (currentStep.action === 'click') {
        setTimeout(() => completeCurrentStep(), 300);
      }
    },
    [currentStep, setNodes, enterSingleSelectionMode, completeCurrentStep]
  );

  const showStartOverlay = currentStepIndex === -1;
  const showStepOverlay = currentStepIndex >= 0;
  const isBlockCreation = isBlockCreationMode();
  const canvasWrapperRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={canvasWrapperRef}
      className="h-full w-full relative"
      data-tutorial="canvas-pane"
    >
      {/* Tutorial Start Overlay */}
      {showStartOverlay && currentTutorial && (
        <TutorialStartOverlay
          title={currentTutorial.name}
          description={currentTutorial.description}
          onStart={startTutorial}
        />
      )}

      {/* Tutorial Step Overlay: in-place absolute (no portal), card keyed for instant step change */}
      {showStepOverlay && (
        <TutorialStepOverlay containerRef={canvasWrapperRef} />
      )}

      {/* Block-creation mode styles (match real app) */}
      {isBlockCreation && (
        <style>{`
          .react-flow.mock-canvas-block-creation .react-flow__node {
            opacity: 0.4 !important;
            pointer-events: auto !important;
          }
          .react-flow.mock-canvas-block-creation .react-flow__node > * {
            pointer-events: none !important;
          }
          .react-flow.mock-canvas-block-creation,
          .react-flow.mock-canvas-block-creation .react-flow__pane,
          .react-flow.mock-canvas-block-creation .react-flow__node,
          .react-flow.mock-canvas-block-creation .react-flow__node * {
            cursor: crosshair !important;
          }
          .react-flow.mock-canvas-block-creation .react-flow__edge {
            opacity: 0.3 !important;
            pointer-events: none !important;
          }
        `}</style>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onPaneClick={handlePaneClick}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultViewport={defaultViewport}
        minZoom={0.5}
        maxZoom={1.5}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={!isBlockCreation || isBlockNodeStep}
        panOnDrag={isBlockCreation}
        panOnScroll={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        proOptions={{ hideAttribution: true }}
        className={cn(
          'bg-muted/30',
          isBlockCreation && 'mock-canvas-block-creation'
        )}
      >
        <Background gap={20} size={1} />
        <FitViewEffect nodeCount={nodes.length} />
        <MockViewportNavigationProvider />

        {isBlockCreation && <MockShadowBlock />}

        {/* Canvas Toolbar - Top Center (above step overlay so it stays clickable) */}
        <Panel position="top-center" className="mt-4! pointer-events-auto! z-50">
          <MockCanvasToolbar onAddBlockClick={handleAddBlockClick} />
        </Panel>

        {/* Viewport Control Toolbar - Bottom Right (above step overlay so it stays clickable) */}
        <Panel position="bottom-right" className="mr-4! mb-4! pointer-events-auto! z-50">
          <MockViewportControlToolbarConnected />
        </Panel>
      </ReactFlow>

      {/* Block Add Dialog (outside ReactFlow, same as real app) */}
      <MockBlockAddDialog
        isOpen={showBlockMenu}
        onClose={handleCloseDialog}
        onSelectBlockType={handleSelectBlockType}
        enterBlockCreationMode={enterBlockCreationMode}
      />
    </div>
  );
}

/**
 * Mock Canvas Props
 */
export interface MockCanvasProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
}

/**
 * Mock Canvas (Container)
 *
 * Tutorial-specific ReactFlow canvas with:
 * - 5 block types (Markdown, Shape, YouTube, Image, Link)
 * - CustomEdge support
 * - Mode context (block-creation)
 * - Tutorial-specific initial nodes/edges
 */
export function MockCanvas({ initialNodes, initialEdges }: MockCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasMetadataProvider value={MOCK_CANVAS_METADATA}>
        <CanvasReadOnlyProvider readonly={false}>
          <CanvasModeProvider>
            <MockCanvasInnerWithFlow
              initialNodes={initialNodes}
              initialEdges={initialEdges}
            />
          </CanvasModeProvider>
        </CanvasReadOnlyProvider>
      </CanvasMetadataProvider>
    </ReactFlowProvider>
  );
}
