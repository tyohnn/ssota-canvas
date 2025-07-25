"use client";

import React from "react";

interface CanvasStatusProps {
  nodesCount: number;
  edgesCount: number;
  selectedNodesCount: number;
  selectedEdgesCount: number;
  isDragging: boolean;
  isConnecting: boolean;
  zoom: number;
}

export function CanvasStatus({
  nodesCount,
  edgesCount,
  selectedNodesCount,
  selectedEdgesCount,
  isDragging,
  isConnecting,
  zoom,
}: CanvasStatusProps) {
  return (
    <div className="flex items-center gap-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-md text-sm">
      {/* Canvas Stats */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Nodes:</span>
        <span className="font-medium">{nodesCount}</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Edges:</span>
        <span className="font-medium">{edgesCount}</span>
      </div>

      {/* Selection Stats */}
      {(selectedNodesCount > 0 || selectedEdgesCount > 0) && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Selected:</span>
          <span className="font-medium">
            {selectedNodesCount + selectedEdgesCount}
          </span>
        </div>
      )}

      {/* Status Indicators */}
      <div className="flex items-center gap-2">
        {isDragging && (
          <span className="text-blue-600 font-medium">Dragging</span>
        )}
        {isConnecting && (
          <span className="text-green-600 font-medium">Connecting</span>
        )}
      </div>

      {/* Zoom Level */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Zoom:</span>
        <span className="font-medium">{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
}
