"use client";

import React from "react";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";

interface CanvasToolbarProps {
  connectionMode: "add" | "edit" | "delete";
  onConnectionModeChange: (mode: "add" | "edit" | "delete") => void;
  selectedNodes: string[];
  selectedEdges: string[];
  onClearSelection: () => void;
}

export function CanvasToolbar({
  connectionMode,
  onConnectionModeChange,
  selectedNodes,
  selectedEdges,
  onClearSelection,
}: CanvasToolbarProps) {
  return (
    <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-md">
      {/* Connection Mode */}
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant={connectionMode === "add" ? "default" : "outline"}
          onClick={() => onConnectionModeChange("add")}
        >
          Add
        </Button>
        <Button
          size="sm"
          variant={connectionMode === "edit" ? "default" : "outline"}
          onClick={() => onConnectionModeChange("edit")}
        >
          Edit
        </Button>
        <Button
          size="sm"
          variant={connectionMode === "delete" ? "destructive" : "outline"}
          onClick={() => onConnectionModeChange("delete")}
        >
          Delete
        </Button>
      </div>

      {/* Selection Info */}
      {(selectedNodes.length > 0 || selectedEdges.length > 0) && (
        <div className="flex items-center gap-2 ml-4">
          <Badge variant="secondary">
            {selectedNodes.length} node{selectedNodes.length !== 1 ? "s" : ""}
          </Badge>
          <Badge variant="secondary">
            {selectedEdges.length} edge{selectedEdges.length !== 1 ? "s" : ""}
          </Badge>
          <Button size="sm" variant="outline" onClick={onClearSelection}>
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
