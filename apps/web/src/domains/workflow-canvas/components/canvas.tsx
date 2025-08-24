"use client";

import React, { useMemo } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Controls,
  Background,
  MiniMap,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// Blocks
import {
  AgentBlock,
  ArtifactClassBlock,
  ArtifactTemplateBlock,
  ChecklistBlock,
  ConditionBlock,
  DataBlock,
  EndBlock,
  StartBlock,
  TaskBlock,
  WorkflowBlock,
} from "./blocks";
// Edges
import {
  CustomEdge,
  ContainsEdge,
  NextEdge,
  OutputEdge,
  InputEdge,
  AccessesEdge,
  UsedByEdge,
} from "./edges";
import { CanvasStatus } from "./canvas-control/canvas-status";
import { Plus } from "lucide-react";
import { Button } from "@workspace/ui/components/ui/button";
import { useCanvas } from "../contexts/CanvasContext";

function ViewportController() {
  const { setCenter, getNodes } = useReactFlow();
  const { displayBlocks, viewportAction, selectedBlocks } = useCanvas();

  // 재시도 상태 플래그
  const [retryCount, setRetryCount] = React.useState(0);

  // displayBlocks가 변경되면 중앙으로 이동하는 로직
  React.useEffect(() => {
    if (displayBlocks.length > 0) {
      const reactFlowNodes = getNodes();

      // React Flow 노드가 아직 렌더링되지 않은 경우 재시도
      if (reactFlowNodes.length === 0 && displayBlocks.length > 0) {
        if (retryCount < 10) {
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 100);
        }
        return;
      }

      if (reactFlowNodes.length > 0) {
        // 매칭 확인
        let matchedCount = 0;
        const unmatchedDisplayBlocks: string[] = [];

        if (viewportAction === "center") {
          displayBlocks.forEach((block) => {
            const reactFlowNode = reactFlowNodes.find(
              (node) => node.id === block.id
            );

            if (reactFlowNode) {
              matchedCount++;
            } else {
              unmatchedDisplayBlocks.push(block.id);
            }
          });
          // React Flow에만 있는 노드들 찾기
          const onlyInReactFlow = reactFlowNodes.filter(
            (rfNode) => !displayBlocks.some((dBlock) => dBlock.id === rfNode.id)
          );
          // 완전한 매칭 확인
          const isPerfectMatch =
            matchedCount === displayBlocks.length &&
            onlyInReactFlow.length === 0;
          // 매칭이 완료되지 않았다면 재시도
          if (!isPerfectMatch) {
            // 최대 10번까지 재시도
            if (retryCount < 10) {
              setTimeout(() => {
                setRetryCount((prev) => prev + 1);
              }, 100);
            }
            return;
          }
          if (isPerfectMatch) {
            const reactFlowNodeCenters = reactFlowNodes.map((node) => {
              return {
                x: node.position.x + ((node.data?.width as number) || 150) / 2,
                y: node.position.y + ((node.data?.height as number) || 50) / 2,
              };
            });

            const totalX = reactFlowNodeCenters.reduce(
              (sum, center) => sum + center.x,
              0
            );
            const totalY = reactFlowNodeCenters.reduce(
              (sum, center) => sum + center.y,
              0
            );
            const averageCenter = {
              x: totalX / reactFlowNodeCenters.length,
              y: totalY / reactFlowNodeCenters.length,
            };

            setCenter(averageCenter.x, averageCenter.y, {
              zoom: 1,
              duration: 600,
            });
            setRetryCount(0);
          }
        } else if (viewportAction === "select") {
          const selectedBlock = displayBlocks.find(
            (block) => block.id === selectedBlocks[0]
          );
          const reactFlowNode = reactFlowNodes.find(
            (node) => node.id === selectedBlocks[0]
          );
          if (selectedBlock && reactFlowNode) {
            const selectedBlockPosition = {
              x: reactFlowNode.position.x,
              y: reactFlowNode.position.y,
            };
            setCenter(
              selectedBlockPosition.x + 475,
              selectedBlockPosition.y + 175,
              {
                zoom: 1,
                duration: 600,
              }
            );
            setRetryCount(0);
          }
        }
      }
    }
  }, [displayBlocks, retryCount, viewportAction, selectedBlocks]);

  return null;
}

// Node types
const nodeTypes = {
  agent: AgentBlock,
  artifact_class: ArtifactClassBlock,
  artifact_template: ArtifactTemplateBlock,
  checklist: ChecklistBlock,
  condition: ConditionBlock,
  data: DataBlock,
  end: EndBlock,
  start: StartBlock,
  task: TaskBlock,
  workflow: WorkflowBlock,
};

// Edge types
const edgeTypes = {
  custom: CustomEdge,
  contains: ContainsEdge,
  next: NextEdge,
  output: OutputEdge,
  input: InputEdge,
  accesses: AccessesEdge,
  used_by: UsedByEdge,
};

interface CanvasProps {
  className?: string;
}

/**
 * Main Canvas Component
 */
export function Canvas({ className }: CanvasProps) {
  const {
    displayBlocks,
    displayEdges,
    selectedBlocks,
    selectedEdges,
    openBlockInsertPanel,
    // React Flow Event Handlers (from Context)
    onBlockClick,
    onEdgeClick,
    onPaneClick,
    onConnect,
    onBlockDragStart,
    onBlockDragStop,
    onBlockDoubleClick,
    onEdgeDoubleClick,
    onBlocksDelete,
    onEdgesDelete,
    onConnectStart,
    onConnectEnd,
    zoom,
  } = useCanvas();

  // Use React Flow's built-in state management
  const [reactFlowBlocks, setReactFlowBlocks, onBlocksChange] = useNodesState(
    displayBlocks || []
  );

  const [reactFlowEdges, setReactFlowEdges, onEdgesChange] = useEdgesState(
    displayEdges || []
  );

  // Update React Flow state when external nodes/edges change
  React.useEffect(() => {
    setReactFlowBlocks(displayBlocks || []);
  }, [displayBlocks, setReactFlowBlocks]);

  React.useEffect(() => {
    setReactFlowEdges(displayEdges || []);
  }, [displayEdges, setReactFlowEdges]);

  // Memoized React Flow props
  const reactFlowProps = useMemo(
    () => ({
      nodes: reactFlowBlocks,
      edges: reactFlowEdges,
      nodeTypes,
      edgeTypes,
      onNodesChange: onBlocksChange,
      onEdgesChange,
      onNodeClick: onBlockClick,
      onEdgeClick,
      onPaneClick,
      onConnect,
      onNodeDragStart: onBlockDragStart,
      onNodeDragStop: onBlockDragStop,
      onNodeDoubleClick: onBlockDoubleClick,
      onEdgeDoubleClick,
      onNodesDelete: onBlocksDelete,
      onEdgesDelete,
      onConnectStart,
      onConnectEnd,
      fitView: false, // 자동 fitView 비활성화 - 수동 viewport 제어 사용
      fitViewOptions: { padding: 0.2 },
      minZoom: 0.1,
      maxZoom: 2,
      defaultViewport: { x: 0, y: 0, zoom: 1.2 },
      attributionPosition: "bottom-left" as const,
    }),
    [
      reactFlowBlocks,
      reactFlowEdges,
      onBlocksChange,
      onEdgesChange,
      onBlockClick,
      onEdgeClick,
      onPaneClick,
      onConnect,
      onBlockDragStart,
      onBlockDragStop,
      onBlockDoubleClick,
      onEdgeDoubleClick,
      onBlocksDelete,
      onEdgesDelete,
      onConnectStart,
      onConnectEnd,
    ]
  );

  return (
    <div className={`h-full w-full ${className}`}>
      <ReactFlowProvider>
        <ReactFlow {...reactFlowProps}>
          <ViewportController />
          <Controls />
          <Background />
          <MiniMap />
          <Panel position="top-left">
            <Button size="sm" onClick={openBlockInsertPanel} title="Add Block">
              <Plus className="h-4 w-4 mr-1" />
              Add Block
            </Button>
          </Panel>
          <Panel position="bottom-right">
            <CanvasStatus
              nodesCount={reactFlowBlocks.length}
              edgesCount={reactFlowEdges.length}
              selectedNodesCount={selectedBlocks.length}
              selectedEdgesCount={selectedEdges.length}
              isDragging={false}
              isConnecting={false}
              zoom={zoom}
            />
          </Panel>
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
