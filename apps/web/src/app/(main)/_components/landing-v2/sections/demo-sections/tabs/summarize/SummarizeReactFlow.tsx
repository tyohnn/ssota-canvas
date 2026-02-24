"use client";

/**
 * SummarizeReactFlow
 *
 * Summarize 탭 전용 ReactFlow 컴포넌트.
 * SummarizeYoutubeBlock만 렌더링.
 */

import { useEffect, useMemo } from "react";
import { useTheme } from "next-themes";
import {
  Background,
  type Node,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { SummarizeYoutubeBlock, type SummarizeYoutubeBlockData } from "./block/SummarizeYoutubeBlock";
import { useLandingViewportAdjustment } from "../../../../../mocks/use-landing-viewport-adjustment";

const YOUTUBE_NODE_TYPE = "summarize-youtube";
const BLOCK_MOUNT_ID = "landing-youtube-summarize";

interface SummarizeReactFlowProps {
  step: number;
}

function FitViewEffect({ step }: { step: number }) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (step === 0) {
      fitView({ duration: 500, padding: 0.2, maxZoom: 0.8 });
    }
  }, [step, fitView]);

  return null;
}

function ViewportAdjustmentEffect({ isOpen }: { isOpen: boolean }) {
  useLandingViewportAdjustment(BLOCK_MOUNT_ID, isOpen);
  return null;
}

function SummarizeReactFlowInner({ step }: SummarizeReactFlowProps) {
  const { resolvedTheme } = useTheme();
  const initialNodes: Node[] = useMemo(
    () => [
      {
        id: BLOCK_MOUNT_ID,
        type: YOUTUBE_NODE_TYPE,
        position: { x: 100, y: 80 },
        data: { step: 0 } as SummarizeYoutubeBlockData,
        draggable: false,
        selectable: true,
        style: { width: 400, height: 260 },
      },
    ],
    []
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);

  const isEditorPanelOpen = step >= 4;
  const isBlockSelected = step >= 2; // step 1: unselected (first step), step 2+: selected (after click)

  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        selected: isBlockSelected,
        data: { ...(n.data ?? {}), step } as SummarizeYoutubeBlockData,
      }))
    );
  }, [step, isBlockSelected, setNodes]);

  const defaultViewport = useMemo(() => ({ x: 0, y: 0, zoom: 0.9 }), []);

  const nodeTypes = useMemo(
    () => ({
      [YOUTUBE_NODE_TYPE]: SummarizeYoutubeBlock,
    }),
    []
  );

  return (
    <div className="w-full h-full">
      <style jsx global>{`
        /* Override xyflow dark mode: use theme background via --xy-background-color */
        .summarize-react-flow.react-flow,
        .summarize-react-flow.react-flow.dark {
          --xy-background-color-default: var(--background) !important;
          --xy-background-color: var(--background) !important;
          background-color: var(--background) !important;
        }
        .summarize-react-flow .react-flow__background {
          background-color: var(--background) !important;
        }
      `}</style>
      <ReactFlow
        nodes={nodes}
        edges={[]}
        onNodesChange={onNodesChange}
        nodeTypes={nodeTypes}
        defaultViewport={defaultViewport}
        colorMode={resolvedTheme === "dark" ? "dark" : "light"}
        minZoom={0.5}
        maxZoom={1.5}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        panOnScroll={false}
        zoomOnScroll={false}
        zoomOnPinch={true}
        proOptions={{ hideAttribution: true }}
        className="summarize-react-flow bg-background h-full w-full"
        style={{ backgroundColor: "var(--background)" }}
      >
        <Background gap={20} size={1} />
        <FitViewEffect step={step} />
        <ViewportAdjustmentEffect isOpen={isEditorPanelOpen} />
      </ReactFlow>
    </div>
  );
}

export function SummarizeReactFlow({ step }: SummarizeReactFlowProps) {
  return (
    <ReactFlowProvider>
      <SummarizeReactFlowInner step={step} />
    </ReactFlowProvider>
  );
}
