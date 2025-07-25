"use client";

import React, { useState, useCallback } from "react";
import { Canvas } from "./canvas";
import { TopToolbox } from "./top-toolbox";
import { NodeExplorer } from "./node-explorer";
import { EditorPanel } from "./editor-panel";
import { useCanvasState } from "../hooks/useCanvasState";
import { useNodeOperations } from "../hooks/useNodeOperations";
import { useAgentCreation } from "../hooks/useAgentCreation";
import { useTemplateCreation } from "../hooks/useTemplateCreation";

interface CanvasPageProps {
  workspaceId: string;
  className?: string;
}

/**
 * Canvas Page Component - Complete canvas layout
 */
export function CanvasPage({ workspaceId, className }: CanvasPageProps) {
  // Canvas state
  const {
    nodes,
    edges,
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

  // Node operations
  const {
    createNodeWithValidation,
    updateNodeWithValidation,
    deleteNodeWithRelationships,
    moveNode,
    validateNodeConnection,
    createNodeConnection,
  } = useNodeOperations();

  // Agent creation
  const {
    createAgentWithNaturalLanguage,
    updateAgentWithNaturalLanguage,
    analyzeAgentEffectiveness,
  } = useAgentCreation();

  // Template creation
  const { createTemplateWithDefinitions, analyzeTemplateComplexity } =
    useTemplateCreation();

  // UI state
  const [showNodeExplorer, setShowNodeExplorer] = useState(true);
  const [showEditorPanel, setShowEditorPanel] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showLayers, setShowLayers] = useState(true);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Selected items for editor panel
  const selectedNode =
    selectedNodes.length === 1
      ? nodes.find((n) => n.id === selectedNodes[0])
      : undefined;
  const selectedEdge =
    selectedEdges.length === 1
      ? edges.find((e) => e.id === selectedEdges[0])
      : undefined;

  // Handle node creation from explorer
  const handleNodeCreate = useCallback(
    async (nodeType: string, template?: string) => {
      try {
        // Generate position for new node (center of viewport)
        const position = { x: 400, y: 300 };

        // Create node based on type
        let nodeData: any = {
          nodeType: nodeType as any,
          slug: `${nodeType}-${Date.now()}`,
          name: template || `New ${nodeType.replace("_", " ")}`,
          metadata: {},
          workspaceId,
          position,
        };

        // Add template-specific data
        if (template) {
          nodeData.name = template;
          nodeData.metadata = {
            template: template,
            createdFromTemplate: true,
          };
        }

        // Add type-specific metadata
        if (nodeType === "agent") {
          nodeData.metadata = {
            ...nodeData.metadata,
            persona: "A helpful AI agent",
            role: "Assist with tasks and workflows",
            capabilities: ["general_assistance"],
            tools: ["basic_tools"],
          };
        } else if (nodeType === "task") {
          nodeData.metadata = {
            ...nodeData.metadata,
            instructions: "Complete the assigned task",
            variables: {},
          };
        } else if (nodeType === "artifact_template") {
          nodeData.metadata = {
            ...nodeData.metadata,
            artifact_format: "markdown",
            definitions: [],
          };
        }

        const result = await createNodeWithValidation(nodeData);

        if (result.success && result.data) {
          // Add node to canvas
          const newNode = {
            id: result.data.id,
            type: nodeType,
            position,
            data: {
              label: nodeData.name,
              slug: nodeData.slug,
              ...nodeData.metadata,
            },
          };

          addNode(newNode);
          selectNode(newNode.id);
          setShowEditorPanel(true);
        } else {
          setError(result.error || "Failed to create node");
        }
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to create node"
        );
      }
    },
    [createNodeWithValidation, addNode, selectNode, setError, workspaceId]
  );

  // Handle node update
  const handleNodeUpdate = useCallback(
    async (nodeId: string, updates: any) => {
      try {
        const result = await updateNodeWithValidation({
          id: nodeId,
          ...updates,
        });

        if (result.success) {
          updateNode(nodeId, updates);
        } else {
          setError(result.error || "Failed to update node");
        }
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to update node"
        );
      }
    },
    [updateNodeWithValidation, updateNode, setError]
  );

  // Handle node delete
  const handleNodeDelete = useCallback(
    async (nodeId: string) => {
      try {
        await deleteNodeWithRelationships(nodeId);
        deleteNode(nodeId);
        setShowEditorPanel(false);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to delete node"
        );
      }
    },
    [deleteNodeWithRelationships, deleteNode, setError]
  );

  // Handle edge update
  const handleEdgeUpdate = useCallback(
    async (edgeId: string, updates: any) => {
      try {
        updateEdge(edgeId, updates);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to update edge"
        );
      }
    },
    [updateEdge, setError]
  );

  // Handle edge delete
  const handleEdgeDelete = useCallback(
    async (edgeId: string) => {
      try {
        deleteEdge(edgeId);
        setShowEditorPanel(false);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to delete edge"
        );
      }
    },
    [deleteEdge, setError]
  );

  // Canvas control handlers
  const handleZoomIn = useCallback(() => {
    setZoom(Math.min(zoom * 1.2, 2));
  }, [zoom, setZoom]);

  const handleZoomOut = useCallback(() => {
    setZoom(Math.max(zoom / 1.2, 0.1));
  }, [zoom, setZoom]);

  const handleZoomReset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [setZoom, setPan]);

  const handleToggleGrid = useCallback(() => {
    setShowGrid(!showGrid);
  }, [showGrid]);

  const handleToggleLayers = useCallback(() => {
    setShowLayers(!showLayers);
  }, [showLayers]);

  const handleToggleTheme = useCallback(() => {
    // Theme toggle logic would be implemented here
    console.log("Toggle theme");
  }, []);

  const handleUndo = useCallback(() => {
    // Undo logic would be implemented here
    console.log("Undo");
  }, []);

  const handleRedo = useCallback(() => {
    // Redo logic would be implemented here
    console.log("Redo");
  }, []);

  const handleSave = useCallback(() => {
    // Save logic would be implemented here
    console.log("Save canvas");
  }, []);

  const handleExport = useCallback(() => {
    // Export logic would be implemented here
    console.log("Export canvas");
  }, []);

  const handleImport = useCallback(() => {
    // Import logic would be implemented here
    console.log("Import canvas");
  }, []);

  // Close editor panel when clicking outside
  const handleEditorClose = useCallback(() => {
    setShowEditorPanel(false);
    clearSelection();
  }, [clearSelection]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-screen ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading canvas...</p>
          <p className="text-sm text-muted-foreground">
            Preparing your workspace
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-screen ${className}`}>
        <div className="text-center">
          <p className="text-lg font-medium text-destructive mb-4">
            Error loading canvas
          </p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col ${className}`}>
      {/* Top Toolbox */}
      <TopToolbox
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSave={handleSave}
        onExport={handleExport}
        onImport={handleImport}
        onNodeCreate={handleNodeCreate}
        onToggleGrid={handleToggleGrid}
        onToggleLayers={handleToggleLayers}
        onToggleTheme={handleToggleTheme}
        showGrid={showGrid}
        showLayers={showLayers}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Node Explorer */}
        {showNodeExplorer && (
          <div className="w-80 border-r bg-white flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Node Explorer</h2>
                <button
                  onClick={() => setShowNodeExplorer(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <NodeExplorer
                onNodeCreate={handleNodeCreate}
                className="h-full"
              />
            </div>
          </div>
        )}

        {/* Main Canvas Area */}
        <div className="flex-1 relative">
          <Canvas workspaceId={workspaceId} className="h-full" />
        </div>

        {/* Right Panel - Editor (when item is selected) */}
        {showEditorPanel && (selectedNode || selectedEdge) && (
          <div className="w-96 border-l bg-white">
            <EditorPanel
              isOpen={showEditorPanel}
              onClose={handleEditorClose}
              selectedNode={selectedNode}
              selectedEdge={selectedEdge}
              onNodeUpdate={handleNodeUpdate}
              onEdgeUpdate={handleEdgeUpdate}
              onNodeDelete={handleNodeDelete}
              onEdgeDelete={handleEdgeDelete}
              className="h-full"
            />
          </div>
        )}
      </div>

      {/* Floating Action Button for Node Explorer */}
      {!showNodeExplorer && (
        <button
          onClick={() => setShowNodeExplorer(true)}
          className="fixed bottom-4 left-4 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors"
          title="Open Node Explorer"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </button>
      )}

      {/* Status Bar */}
      <div className="bg-gray-50 border-t px-4 py-2 text-sm text-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>Nodes: {nodes.length}</span>
            <span>Edges: {edges.length}</span>
            <span>Selected: {selectedNodes.length + selectedEdges.length}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Zoom: {Math.round(zoom * 100)}%</span>
            <span>
              Position: ({Math.round(pan.x)}, {Math.round(pan.y)})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
