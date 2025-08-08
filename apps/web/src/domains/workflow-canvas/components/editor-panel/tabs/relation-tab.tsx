"use client";

import React from "react";
import { useEditorPanelContext } from "../context";
import { useCanvas } from "@/domains/workflow-canvas/contexts/CanvasContext";

export function RelationTab() {
  const { state } = useEditorPanelContext();
  const { dbBlocks, dbEdges } = useCanvas();
  const { selectedItem, editorConfig } = state;

  if (!selectedItem) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>No block selected.</p>
        <p className="text-xs mt-2">
          Please select a block to view relationships.
        </p>
      </div>
    );
  }

  // Get connected blocks
  const connectedEdges = dbEdges.filter(
    (edge: any) =>
      edge.source_block_id === selectedItem.id ||
      edge.target_block_id === selectedItem.id
  );

  const connectedBlocks = connectedEdges
    .map((edge: any) => {
      const connectedBlockId =
        edge.source_block_id === selectedItem.id
          ? edge.target_block_id
          : edge.source_block_id;
      const connectedBlock = dbBlocks.find(
        (block: any) => block.id === connectedBlockId
      );
      const isOutgoing = edge.source_block_id === selectedItem.id;

      return {
        block: connectedBlock,
        edge,
        direction: isOutgoing ? "outgoing" : "incoming",
        relationship: edge.type,
      };
    })
    .filter((item: any) => item.block);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-md font-semibold text-foreground">
          Block Relations
        </h3>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Connections and relationships with other blocks
        </p>
      </div>

      {/* Connections */}
      <div className="space-y-4">
        <div className="border border-border/30 rounded-lg p-4 space-y-3">
          <h4 className="text-md font-medium text-foreground">
            Connected Blocks ({connectedBlocks.length})
          </h4>

          {connectedBlocks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground/70">
                No connections found.
              </p>
              <p className="text-xs text-muted-foreground/70 mt-2">
                This block is not connected to any other blocks yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {connectedBlocks.map((connection: any, index: number) => (
                <div
                  key={`${connection.edge.id}-${index}`}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-md border border-border/20"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-xs px-2 py-1 rounded font-medium ${
                          connection.direction === "outgoing"
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                        }`}
                      >
                        {connection.direction === "outgoing"
                          ? "→ Outputs to"
                          : "← Inputs from"}
                      </span>
                      <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 rounded font-medium">
                        {connection.relationship}
                      </span>
                    </div>

                    <div>
                      <p className="font-medium text-sm">
                        {connection.block.data?.label ||
                          connection.block.data?.name ||
                          `${connection.block.type} Block`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Type: {connection.block.type} • ID:{" "}
                        {connection.block.id.slice(0, 8)}...
                      </p>
                      {connection.block.data?.description && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          {connection.block.data.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Connection Visualization Settings */}
      {editorConfig?.connectionVisualization.showConnectedBlocks && (
        <div className="space-y-4">
          <div className="border border-border rounded-lg p-4 space-y-3">
            <h4 className="text-md font-medium text-foreground">
              Visualization Settings
            </h4>

            <div className="text-sm space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Render Mode:</span>
                <span className="capitalize font-medium">
                  {editorConfig.connectionVisualization.renderMode}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Connection Types:</span>
                <div className="text-xs flex gap-1 flex-wrap">
                  {editorConfig.connectionVisualization.connectionTypes.map(
                    (type: string) => (
                      <span key={type} className="px-2 py-1 bg-muted rounded">
                        {type}
                      </span>
                    )
                  )}
                </div>
              </div>

              {editorConfig.connectionVisualization.maxDepth && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Depth:</span>
                  <span className="font-medium">
                    {editorConfig.connectionVisualization.maxDepth}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
