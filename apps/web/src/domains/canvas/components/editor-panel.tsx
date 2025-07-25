"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Trash2, Copy, ExternalLink } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Separator } from "@workspace/ui/components/separator";
import { NodeEditor } from "./editors/node-editor";
import { EdgeEditor } from "./editors/edge-editor";
import { useNodeOperations } from "../hooks/useNodeOperations";
import { useAgentCreation } from "../hooks/useAgentCreation";
import { useTemplateCreation } from "../hooks/useTemplateCreation";

interface EditorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNode?: any;
  selectedEdge?: any;
  onNodeUpdate?: (nodeId: string, updates: any) => void;
  onEdgeUpdate?: (edgeId: string, updates: any) => void;
  onNodeDelete?: (nodeId: string) => void;
  onEdgeDelete?: (edgeId: string) => void;
  className?: string;
}

/**
 * Editor Panel Overlay System
 */
export function EditorPanel({
  isOpen,
  onClose,
  selectedNode,
  selectedEdge,
  onNodeUpdate,
  onEdgeUpdate,
  onNodeDelete,
  onEdgeDelete,
  className,
}: EditorPanelProps) {
  const [activeTab, setActiveTab] = useState<
    "properties" | "metadata" | "relationships" | "history"
  >("properties");
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const {
    updateNodeWithValidation,
    deleteNodeWithRelationships,
    validateNodeData,
  } = useNodeOperations();

  const { updateAgentWithNaturalLanguage, analyzeAgentEffectiveness } =
    useAgentCreation();

  const { analyzeTemplateComplexity } = useTemplateCreation();

  // Reset state when selection changes
  useEffect(() => {
    setIsEditing(false);
    setHasChanges(false);
    setActiveTab("properties");
  }, [selectedNode?.id, selectedEdge?.id]);

  // Handle save
  const handleSave = async () => {
    if (!selectedNode && !selectedEdge) return;

    try {
      setIsEditing(false);
      setHasChanges(false);

      if (selectedNode) {
        // Node save logic would be implemented here
        console.log("Saving node:", selectedNode);
      } else if (selectedEdge) {
        // Edge save logic would be implemented here
        console.log("Saving edge:", selectedEdge);
      }
    } catch (error) {
      console.error("Error saving:", error);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedNode && !selectedEdge) return;

    try {
      if (selectedNode) {
        await deleteNodeWithRelationships(selectedNode.id);
        onNodeDelete?.(selectedNode.id);
      } else if (selectedEdge) {
        onEdgeDelete?.(selectedEdge.id);
      }
      onClose();
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  // Handle copy
  const handleCopy = () => {
    if (selectedNode) {
      navigator.clipboard.writeText(JSON.stringify(selectedNode, null, 2));
    } else if (selectedEdge) {
      navigator.clipboard.writeText(JSON.stringify(selectedEdge, null, 2));
    }
  };

  if (!isOpen) return null;

  const selectedItem = selectedNode || selectedEdge;
  const isNode = !!selectedNode;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className={`w-full max-w-2xl max-h-[90vh] bg-white rounded-lg shadow-xl flex flex-col ${className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Badge variant={isNode ? "default" : "secondary"}>
                {isNode ? "Node" : "Edge"}
              </Badge>
              <span className="font-semibold">
                {selectedItem?.data?.label || selectedItem?.id}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              title="Copy to clipboard"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                window.open(`/api/nodes/${selectedItem?.id}`, "_blank")
              }
              title="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDelete}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex">
            {/* Tabs */}
            <div className="w-64 border-r bg-gray-50">
              <div className="p-4">
                <nav className="space-y-1">
                  <button
                    onClick={() => setActiveTab("properties")}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                      activeTab === "properties"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    Properties
                  </button>
                  <button
                    onClick={() => setActiveTab("metadata")}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                      activeTab === "metadata"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    Metadata
                  </button>
                  <button
                    onClick={() => setActiveTab("relationships")}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                      activeTab === "relationships"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    Relationships
                  </button>
                  <button
                    onClick={() => setActiveTab("history")}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                      activeTab === "history"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    History
                  </button>
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto">
              <div className="p-6">
                {activeTab === "properties" && (
                  <PropertiesTab
                    selectedNode={selectedNode}
                    selectedEdge={selectedEdge}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    setHasChanges={setHasChanges}
                    onNodeUpdate={onNodeUpdate}
                    onEdgeUpdate={onEdgeUpdate}
                  />
                )}

                {activeTab === "metadata" && (
                  <MetadataTab
                    selectedNode={selectedNode}
                    selectedEdge={selectedEdge}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    setHasChanges={setHasChanges}
                  />
                )}

                {activeTab === "relationships" && (
                  <RelationshipsTab
                    selectedNode={selectedNode}
                    selectedEdge={selectedEdge}
                  />
                )}

                {activeTab === "history" && (
                  <HistoryTab
                    selectedNode={selectedNode}
                    selectedEdge={selectedEdge}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {hasChanges && "You have unsaved changes"}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {hasChanges && (
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Properties Tab Component
interface PropertiesTabProps {
  selectedNode?: any;
  selectedEdge?: any;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  setHasChanges: (hasChanges: boolean) => void;
  onNodeUpdate?: (nodeId: string, updates: any) => void;
  onEdgeUpdate?: (edgeId: string, updates: any) => void;
}

function PropertiesTab({
  selectedNode,
  selectedEdge,
  isEditing,
  setIsEditing,
  setHasChanges,
  onNodeUpdate,
  onEdgeUpdate,
}: PropertiesTabProps) {
  if (selectedNode) {
    return (
      <NodeEditor
        node={selectedNode}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        setHasChanges={setHasChanges}
        onUpdate={onNodeUpdate}
      />
    );
  }

  if (selectedEdge) {
    return (
      <EdgeEditor
        edge={selectedEdge}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        setHasChanges={setHasChanges}
        onUpdate={onEdgeUpdate}
      />
    );
  }

  return <div>No item selected</div>;
}

// Metadata Tab Component
interface MetadataTabProps {
  selectedNode?: any;
  selectedEdge?: any;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  setHasChanges: (hasChanges: boolean) => void;
}

function MetadataTab({
  selectedNode,
  selectedEdge,
  isEditing,
  setIsEditing,
  setHasChanges,
}: MetadataTabProps) {
  const item = selectedNode || selectedEdge;
  const metadata = item?.data?.metadata || {};

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Metadata</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? "View" : "Edit"}
        </Button>
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <textarea
            className="w-full h-64 p-3 border rounded-md font-mono text-sm"
            value={JSON.stringify(metadata, null, 2)}
            onChange={(e) => {
              try {
                const newMetadata = JSON.parse(e.target.value);
                setHasChanges(true);
              } catch (error) {
                // Invalid JSON, ignore
              }
            }}
            placeholder="Enter JSON metadata..."
          />
        </div>
      ) : (
        <div className="space-y-2">
          {Object.keys(metadata).length === 0 ? (
            <p className="text-gray-500">No metadata available</p>
          ) : (
            <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-auto">
              {JSON.stringify(metadata, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

// Relationships Tab Component
interface RelationshipsTabProps {
  selectedNode?: any;
  selectedEdge?: any;
}

function RelationshipsTab({
  selectedNode,
  selectedEdge,
}: RelationshipsTabProps) {
  if (selectedNode) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Node Relationships</h3>
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Incoming Connections</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">No incoming connections</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Outgoing Connections</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">No outgoing connections</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (selectedEdge) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Edge Relationships</h3>
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Source Node</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{selectedEdge.source}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Target Node</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{selectedEdge.target}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <div>No item selected</div>;
}

// History Tab Component
interface HistoryTabProps {
  selectedNode?: any;
  selectedEdge?: any;
}

function HistoryTab({ selectedNode, selectedEdge }: HistoryTabProps) {
  const item = selectedNode || selectedEdge;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">History</h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
          <div>
            <p className="text-sm font-medium">Created</p>
            <p className="text-xs text-gray-600">
              {item?.created_at
                ? new Date(item.created_at).toLocaleString()
                : "Unknown"}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
          <div>
            <p className="text-sm font-medium">Last Modified</p>
            <p className="text-xs text-gray-600">
              {item?.updated_at
                ? new Date(item.updated_at).toLocaleString()
                : "Unknown"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
