"use client";

import React from "react";
import { useEditorPanelContext } from "../context";
import { Label } from "@workspace/ui/components/label";
import { Block, Edge } from "@/db/schema";

// 타입 가드 함수들
function isBlock(item: Block | Edge): item is Block {
  return "block_type" in item;
}

function isEdge(item: Block | Edge): item is Edge {
  return "edge_type" in item;
}

export function MetadataTab() {
  const { state } = useEditorPanelContext();
  const { selectedItem } = state;

  if (!selectedItem) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>No item selected</p>
        <p className="text-xs mt-2">
          Please select a block or edge to view metadata.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Common Metadata */}
      <div>
        <h3 className="text-md font-medium text-foreground mb-4">
          {isBlock(selectedItem) ? "Block" : "Edge"} Metadata
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Label className="text-muted-foreground/70 text-xs font-light">
              {isBlock(selectedItem) ? "Block" : "Edge"} Type
            </Label>
            <p className="font-medium capitalize text-foreground">
              {isBlock(selectedItem)
                ? selectedItem.block_type
                : isEdge(selectedItem)
                  ? selectedItem.edge_type
                  : "Unknown"}
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground/70 text-xs font-light">
              {isBlock(selectedItem) ? "Block" : "Edge"} ID
            </Label>
            <p className="font-mono text-xs text-foreground">
              {selectedItem.id}
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground/70 text-xs font-light">
              Created At
            </Label>
            <p className="text-foreground">
              {selectedItem.created_at
                ? new Date(selectedItem.created_at).toLocaleDateString()
                : "Not available"}
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground/70 text-xs font-light">
              Updated At
            </Label>
            <p className="text-foreground">
              {selectedItem.updated_at
                ? new Date(selectedItem.updated_at).toLocaleDateString()
                : "Not available"}
            </p>
          </div>

          {/* Block-specific fields */}
          {isBlock(selectedItem) && (
            <>
              <div>
                <Label className="text-muted-foreground/70 text-xs font-light">
                  Name
                </Label>
                <p className="text-foreground">
                  {selectedItem.name || "Not available"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground/70 text-xs font-light">
                  Slug
                </Label>
                <p className="text-foreground">
                  {selectedItem.slug || "Not available"}
                </p>
              </div>
            </>
          )}

          {/* Edge-specific fields */}
          {isEdge(selectedItem) && (
            <>
              <div>
                <Label className="text-muted-foreground/70 text-xs font-light">
                  Source Block ID
                </Label>
                <p className="font-mono text-xs text-foreground">
                  {selectedItem.source_block_id}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground/70 text-xs font-light">
                  Target Block ID
                </Label>
                <p className="font-mono text-xs text-foreground">
                  {selectedItem.target_block_id}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Raw Data */}
      <div className="border-t border-border/70 pt-6">
        <h3 className="text-md font-medium text-foreground mb-4">
          Raw {isBlock(selectedItem) ? "Block" : "Edge"} Data
        </h3>
        <div className="bg-primary/10 rounded-lg p-4">
          <pre className="text-xs text-muted-foreground overflow-auto whitespace-pre-wrap">
            {JSON.stringify(selectedItem, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
