"use client";

import React from "react";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Plus } from "lucide-react";

interface CanvasToolbarProps {
  connectionMode: "add" | "edit" | "delete";
  onConnectionModeChange: (mode: "add" | "edit" | "delete") => void;
  selectedNodes: string[];
  selectedEdges: string[];
  onClearSelection: () => void;
  onAddCanvasElement?: () => void;
}

export function CanvasToolbar({
  connectionMode,
  onConnectionModeChange,
  selectedNodes,
  selectedEdges,
  onClearSelection,
  onAddCanvasElement,
}: CanvasToolbarProps) {
  return (
    <div className="flex items-center gap-2 bg-background backdrop-blur-sm rounded-lg p-2 shadow-md">
      {/* Add Canvas Element Button */}
      <Button
        size="sm"
        onClick={onAddCanvasElement}
        title="Add Canvas Element"
      >
        <Plus className="h-4 w-4 mr-1" />
        Add Element
      </Button>
      
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
