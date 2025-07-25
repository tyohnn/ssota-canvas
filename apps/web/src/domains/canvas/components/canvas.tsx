"use client";

import React, { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useCanvasState } from "../hooks/useCanvasState";
import { useNodeOperations } from "../hooks/useNodeOperations";
import { AgentNode } from "./nodes/agent-node";
import { TaskNode } from "./nodes/task-node";
import { WorkflowNode } from "./nodes/workflow-node";
import { ArtifactTemplateNode } from "./nodes/artifact-template-node";
import { ChecklistNode } from "./nodes/checklist-node";
import { DataNode } from "./nodes/data-node";
import { ArtifactClassNode } from "./nodes/artifact-class-node";
import { CustomEdge } from "./edges/custom-edge";
import { CanvasToolbar } from "./canvas-toolbar";
import { CanvasStatus } from "./canvas-status";

// Node types
const nodeTypes = {
  agent: AgentNode,
  task: TaskNode,
  workflow: WorkflowNode,
  artifact_template: ArtifactTemplateNode,
  checklist: ChecklistNode,
  data: DataNode,
  artifact_class: ArtifactClassNode,
};

// Edge types
const edgeTypes = {
  custom: CustomEdge,
};

interface CanvasProps {
  workspaceId: string;
  className?: string;
}

/**
 * Main Canvas Component
 */
export function Canvas({ workspaceId, className }: CanvasProps) {
  const {
    nodes: canvasNodes,
    edges: canvasEdges,
    selectedNodes,
    selectedEdges,
    isDragging,
    isConnecting,
    connectionMode,
    zoom,
    pan,
    loading,
    error,
    addNode,
    updateNode,
    deleteNode,
    addEdge,
    updateEdge,
    deleteEdge,
    selectNode,
    deselectNode,
    selectEdge,
    deselectEdge,
    clearSelection,
    setDragging,
    setConnecting,
    setConnectionMode,
    setZoom,
    setPan,
    setError,
  } = useCanvasState(workspaceId);

  const {
    createNodeWithValidation,
    updateNodeWithValidation,
    deleteNodeWithRelationships,
    moveNode,
    validateNodeConnection,
    createNodeConnection,
  } = useNodeOperations();

  // Convert canvas state to React Flow format
  const [nodes, setNodes, onNodesChange] = useNodesState(canvasNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(canvasEdges);

  // Update React Flow state when canvas state changes
  React.useEffect(() => {
    setNodes(canvasNodes);
  }, [canvasNodes, setNodes]);

  React.useEffect(() => {
    setEdges(canvasEdges);
  }, [canvasEdges, setEdges]);

  // Handle node selection
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (selectedNodes.includes(node.id)) {
        deselectNode(node.id);
      } else {
        selectNode(node.id);
      }
    },
    [selectedNodes, selectNode, deselectNode]
  );

  // Handle edge selection
  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      if (selectedEdges.includes(edge.id)) {
        deselectEdge(edge.id);
      } else {
        selectEdge(edge.id);
      }
    },
    [selectedEdges, selectEdge, deselectEdge]
  );

  // Handle canvas click (clear selection)
  const onPaneClick = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  // Handle connection creation
  const onConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      // Validate connection
      const validation = await validateNodeConnection(
        connection.source,
        connection.target,
        (connection as Connection & { type?: string }).type || "next"
      );

      if (!validation.valid) {
        setError(
          `Connection validation failed: ${validation.errors.join(", ")}`
        );
        return;
      }

      // Create connection
      const result = await createNodeConnection(
        connection.source,
        connection.target,
        (connection as Connection & { type?: string }).type || "next",
        (connection as Connection & { data?: any }).data
      );

      if (result.success && "data" in result && result.data) {
        // Add edge to React Flow
        const edgeData = result.data as { id: string; metadata?: any };
        const newEdge: Edge = {
          id: edgeData.id,
          source: connection.source,
          target: connection.target,
          type: "custom",
          data: edgeData.metadata || {},
        };
        addEdge(newEdge);
      } else {
        setError(result.error || "Failed to create connection");
      }
    },
    [validateNodeConnection, createNodeConnection, addEdge, setError]
  );

  // Handle node drag
  const onNodeDragStart = useCallback(() => {
    setDragging(true);
  }, [setDragging]);

  const onNodeDragStop = useCallback(
    async (event: React.MouseEvent, node: Node) => {
      setDragging(false);

      // Update node position in database
      if (node.position) {
        await moveNode(node.id, node.position);
      }
    },
    [setDragging, moveNode]
  );

  // Handle node double click (edit)
  const onNodeDoubleClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      // This would open the editor panel
      console.log("Edit node:", node);
    },
    []
  );

  // Handle edge double click (edit)
  const onEdgeDoubleClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      // This would open the edge editor
      console.log("Edit edge:", edge);
    },
    []
  );

  // Handle node deletion
  const onNodesDelete = useCallback(
    async (deletedNodes: Node[]) => {
      for (const node of deletedNodes) {
        await deleteNodeWithRelationships(node.id);
      }
    },
    [deleteNodeWithRelationships]
  );

  // Handle edge deletion
  const onEdgesDelete = useCallback(
    async (deletedEdges: Edge[]) => {
      for (const edge of deletedEdges) {
        await deleteEdge(edge.id);
      }
    },
    [deleteEdge]
  );

  // Handle viewport change
  const onViewportChange = useCallback(
    (viewport: { x: number; y: number; zoom: number }) => {
      setPan({ x: viewport.x, y: viewport.y });
      setZoom(viewport.zoom);
    },
    [setPan, setZoom]
  );

  // Handle connection start
  const onConnectStart = useCallback(() => {
    setConnecting(true);
  }, [setConnecting]);

  // Handle connection end
  const onConnectEnd = useCallback(() => {
    setConnecting(false);
  }, [setConnecting]);

  // Memoized React Flow props
  const reactFlowProps = useMemo(
    () => ({
      nodes,
      edges,
      nodeTypes,
      edgeTypes,
      onNodesChange,
      onEdgesChange,
      onNodeClick,
      onEdgeClick,
      onPaneClick,
      onConnect,
      onNodeDragStart,
      onNodeDragStop,
      onNodeDoubleClick,
      onEdgeDoubleClick,
      onNodesDelete,
      onEdgesDelete,
      onViewportChange,
      onConnectStart,
      onConnectEnd,
      fitView: true,
      fitViewOptions: { padding: 0.2 },
      minZoom: 0.1,
      maxZoom: 2,
      defaultViewport: { x: 0, y: 0, zoom: 1 },
      attributionPosition: "bottom-left" as const,
    }),
    [
      nodes,
      edges,
      onNodesChange,
      onEdgesChange,
      onNodeClick,
      onEdgeClick,
      onPaneClick,
      onConnect,
      onNodeDragStart,
      onNodeDragStop,
      onNodeDoubleClick,
      onEdgeDoubleClick,
      onNodesDelete,
      onEdgesDelete,
      onViewportChange,
      onConnectStart,
      onConnectEnd,
    ]
  );

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading canvas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <p className="text-destructive mb-4">Error loading canvas</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => setError(null)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full w-full ${className}`}>
      <ReactFlowProvider>
        <ReactFlow {...reactFlowProps}>
          {/* Background */}
          <Background color="#aaa" gap={16} />

          {/* Controls */}
          <Controls />

          {/* Mini Map */}
          <MiniMap
            nodeColor={(node) => {
              switch (node.type) {
                case "agent":
                  return "#3b82f6";
                case "task":
                  return "#10b981";
                case "workflow":
                  return "#f59e0b";
                case "artifact_template":
                  return "#8b5cf6";
                case "checklist":
                  return "#ef4444";
                case "data":
                  return "#06b6d4";
                case "artifact_class":
                  return "#84cc16";
                default:
                  return "#6b7280";
              }
            }}
            nodeStrokeWidth={3}
            zoomable
            pannable
          />

          {/* Top Panel - Toolbar */}
          <Panel position="top-left" className="p-4">
            <CanvasToolbar
              connectionMode={connectionMode}
              onConnectionModeChange={setConnectionMode}
              selectedNodes={selectedNodes}
              selectedEdges={selectedEdges}
              onClearSelection={clearSelection}
            />
          </Panel>

          {/* Bottom Panel - Status */}
          <Panel position="bottom-left" className="p-4">
            <CanvasStatus
              nodesCount={nodes.length}
              edgesCount={edges.length}
              selectedNodesCount={selectedNodes.length}
              selectedEdgesCount={selectedEdges.length}
              isDragging={isDragging}
              isConnecting={isConnecting}
              zoom={zoom}
            />
          </Panel>
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
