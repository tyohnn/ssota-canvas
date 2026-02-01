"use client";

/**
 * StructureReactFlow
 *
 * Structure 탭 전용 ReactFlow 컴포넌트.
 * MockYoutubeBlock + MockShapeBlock (Argument Map).
 */

import { useEffect, useMemo } from "react";
import {
  Background,
  type Node,
  type Edge,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { MockYoutubeBlock, type MockYoutubeBlockData } from "./block/youtube/MockYoutubeBlock";
import { MockShapeBlock, type MockShapeBlockData } from "./block/shape/MockShapeBlock";
import { MockMarkdownBlock, type MockMarkdownBlockData } from "./block/markdown/MockMarkdownBlock";
import { MockGroupBlock, type MockGroupBlockData } from "./block/group/MockGroupBlock";
import { MockCustomEdge } from "../../../../../mocks/components/MockCustomEdge";
import { useLandingViewportAdjustment } from "../../../../../mocks/use-landing-viewport-adjustment";
import {
  ARGUMENT_MAP_NODES,
  ARGUMENT_MAP_EDGES,
  BLOCK_RENDERING_ORDER,
  EDGE_RENDERING_ORDER,
  GROUP_NODE_ID,
  GROUP_POSITION,
  GROUP_SIZE,
  ARGUMENT_MAP_LAYOUT_RELATIVE,
} from "./mock-argument-map-data";

const YOUTUBE_NODE_TYPE = "structure-youtube";
const SHAPE_NODE_TYPE = "structure-shape";
const MARKDOWN_NODE_TYPE = "structure-markdown";
const GROUP_NODE_TYPE = "structure-group";
const BLOCK_MOUNT_ID = "landing-youtube-structure";
const THESIS_NODE_ID = "thesis_main";

const COLOR_HEX_MAP: Record<string, string> = {
  red: "#ef4444",
  orange: "#f97316",
  amber: "#eab308",
  green: "#10b981",
  blue: "#3b82f6",
  purple: "#a855f7",
  pink: "#ec4899",
  gray: "#9ca3af",
};

interface StructureReactFlowProps {
  step: number;
}

function FitViewEffect({ step }: { step: number }) {
  const { fitView, getViewport, setViewport } = useReactFlow();

  useEffect(() => {
    // Step 4: Zoom out wide when editor panel closes and status window shows
    if (step === 4) {
      fitView({ duration: 800, padding: 0.2, maxZoom: 0.5 });
      // viewport를 오른쪽으로 이동해 유튜브 블록이 더 왼쪽에 보이도록
      const t = setTimeout(() => {
        const vp = getViewport();
        setViewport({ x: vp.x - 380, y: vp.y - 200, zoom: vp.zoom }, { duration: 800 });
      }, 850);
      return () => clearTimeout(t);
    }
  }, [step, fitView, getViewport, setViewport]);

  return null;
}

function ViewportAdjustmentEffect({ isOpen, targetBlockId }: { isOpen: boolean; targetBlockId: string }) {
  useLandingViewportAdjustment(targetBlockId, isOpen);
  return null;
}

function StructureReactFlowInner({ step }: StructureReactFlowProps) {
  const initialNodes: Node[] = useMemo(
    () => [
      {
        id: BLOCK_MOUNT_ID,
        type: YOUTUBE_NODE_TYPE,
        position: { x: 100, y: 80 },
        data: { step: 0 } as MockYoutubeBlockData,
        draggable: false,
        selectable: true,
        style: { width: 400, height: 260 },
      },
    ],
    []
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Step 1-3: YouTube editor panel open, Step 4+: Closed
  // Step 7: Shape editor panel open (마지막 스텝)
  const isYouTubeEditorPanelOpen = step >= 1 && step <= 3;
  const isShapeEditorPanelOpen = step >= 19;
  const isEditorPanelOpen = isYouTubeEditorPanelOpen || isShapeEditorPanelOpen;

  // YouTube block is selected step 1-3
  const isYouTubeBlockSelected = step >= 1 && step <= 3;

  // Step 기반 블록/엣지 렌더링 (timeout 없음)
  // step 5: group, 6: +counterpoint, ... 15: all blocks, 16: edges
  const BLOCK_STEP_START = 5;
  const EDGE_STEP = 16;
  const visibleBlocksCount =
    step < BLOCK_STEP_START
      ? 0
      : Math.min(step - BLOCK_STEP_START + 1, BLOCK_RENDERING_ORDER.length);
  const visibleEdgesCount =
    step >= EDGE_STEP ? ARGUMENT_MAP_EDGES.length : 0;

  // YouTube 노드 step 업데이트
  useEffect(() => {
    setNodes((nds) =>
      nds
        .filter((n) => n.type === YOUTUBE_NODE_TYPE)
        .map((n) => ({
          ...n,
          selected: isYouTubeBlockSelected,
          data: { ...(n.data ?? {}), step } as MockYoutubeBlockData,
        }))
    );
  }, [step, isYouTubeBlockSelected, setNodes]);

  // Group 노드 먼저, Shape/Markdown 노드 추가 (parentId=GROUP, 상대 좌표)
  useEffect(() => {
    const blockIds = BLOCK_RENDERING_ORDER.slice(0, visibleBlocksCount);
    const showGroup = blockIds.includes(GROUP_NODE_ID);
    const contentBlockIds = blockIds.filter((id) => id !== GROUP_NODE_ID);

    setNodes((nds) => {
      const youtubeNodes = nds.filter((n) => n.type === YOUTUBE_NODE_TYPE);

      const groupNode: Node | null = showGroup
        ? {
          id: GROUP_NODE_ID,
          type: GROUP_NODE_TYPE,
          position: GROUP_POSITION,
          data: { step } as MockGroupBlockData,
          draggable: false,
          selectable: false,
          style: { width: GROUP_SIZE.width, height: GROUP_SIZE.height },
          zIndex: 0,
        }
        : null;

      const newContentNodes: Node[] = contentBlockIds
        .map((blockId) => {
          const nodeData = ARGUMENT_MAP_NODES.find((n) => n.id === blockId);
          if (!nodeData) return null;

          const relLayout = ARGUMENT_MAP_LAYOUT_RELATIVE[blockId] || { x: 0, y: 0 };

          // action_plan은 markdown 블록
          if (nodeData.type === "markdown") {
            return {
              id: blockId,
              type: MARKDOWN_NODE_TYPE,
              position: relLayout,
              parentId: GROUP_NODE_ID,
              extent: "parent" as const,
              data: {
                title: nodeData.title,
                content: nodeData.content,
                step,
              } as MockMarkdownBlockData,
              draggable: false,
              selectable: false,
              style: { width: 280, height: 400 },
            } as Node;
          }

          // Shape 블록
          const isSelected = step >= 18 && blockId === THESIS_NODE_ID;
          const width =
            nodeData.shapeType === "ellipse" ? 200 : nodeData.shapeType === "diamond" ? 160 : 180;
          const height =
            nodeData.shapeType === "ellipse" ? 120 : nodeData.shapeType === "diamond" ? 100 : 100;

          return {
            id: blockId,
            type: SHAPE_NODE_TYPE,
            position: relLayout,
            parentId: GROUP_NODE_ID,
            extent: "parent" as const,
            data: {
              nodeData,
              step,
            } as MockShapeBlockData,
            draggable: false,
            selectable: true,
            selected: isSelected,
            style: { width, height },
          } as Node;
        })
        .filter((n): n is Node => n !== null);

      const groupNodes = groupNode ? [groupNode] : [];
      return [...youtubeNodes, ...groupNodes, ...newContentNodes];
    });
  }, [visibleBlocksCount, step, setNodes]);

  // Edge 추가/삭제
  useEffect(() => {
    const edgeIds = EDGE_RENDERING_ORDER.slice(0, visibleEdgesCount);
    const newEdges = edgeIds
      .map((edgeId) => {
        const edgeData = ARGUMENT_MAP_EDGES.find((e) => e.id === edgeId);
        if (!edgeData) return null;

        return {
          id: edgeData.id,
          source: edgeData.source,
          target: edgeData.target,
          sourceHandle: edgeData.sourceHandle ?? undefined,
          targetHandle: edgeData.targetHandle ?? undefined,
          type: "custom" as const,
          label: edgeData.label,
          style: {
            stroke: COLOR_HEX_MAP[edgeData.stroke] || COLOR_HEX_MAP.gray,
            strokeWidth: 2,
          },
          markerEnd: {
            type: "arrowclosed" as const,
            width: 20,
            height: 20,
            color: COLOR_HEX_MAP[edgeData.stroke] || COLOR_HEX_MAP.gray,
          },
          data: {
            actualEdgeShape: edgeData.shape || "smoothstep",
            markerEndType: "arrowclosed",
          },
        };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null);

    setEdges(newEdges);
  }, [visibleEdgesCount, setEdges]);

  const defaultViewport = useMemo(() => ({ x: 0, y: 0, zoom: 0.9 }), []);

  const nodeTypes = useMemo(
    () => ({
      [YOUTUBE_NODE_TYPE]: MockYoutubeBlock,
      [SHAPE_NODE_TYPE]: MockShapeBlock,
      [MARKDOWN_NODE_TYPE]: MockMarkdownBlock,
      [GROUP_NODE_TYPE]: MockGroupBlock,
    }),
    []
  );

  const edgeTypes = useMemo(
    () => ({
      custom: MockCustomEdge,
    }),
    []
  );

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultViewport={defaultViewport}
        minZoom={0.3}
        maxZoom={1.5}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        panOnScroll={false}
        zoomOnScroll={false}
        zoomOnPinch={true}
        proOptions={{ hideAttribution: true }}
        className="bg-muted/30"
      >
        <Background gap={20} size={1} />
        <FitViewEffect step={step} />
        {/* YouTube 패널: YouTube 블록 기준, Shape 패널: Thesis 블록 기준 */}
        {isYouTubeEditorPanelOpen && (
          <ViewportAdjustmentEffect isOpen={true} targetBlockId={BLOCK_MOUNT_ID} />
        )}
        {isShapeEditorPanelOpen && (
          <ViewportAdjustmentEffect isOpen={true} targetBlockId={THESIS_NODE_ID} />
        )}
      </ReactFlow>
    </div>
  );
}

export function StructureReactFlow({ step }: StructureReactFlowProps) {
  return (
    <ReactFlowProvider>
      <StructureReactFlowInner step={step} />
    </ReactFlowProvider>
  );
}
