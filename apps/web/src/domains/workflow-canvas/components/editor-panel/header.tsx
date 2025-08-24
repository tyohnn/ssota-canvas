"use client";

import React from "react";
import { X, Trash2, Copy } from "lucide-react";
import { Button } from "@workspace/ui/components/ui/button";
import { Badge } from "@workspace/ui/components/ui/badge";
import { useEditorPanelContext } from "./context";
import { getBlockName } from "@/domains/workflow-canvas/policy/block-definition-policy";

export function EditorPanelHeader() {
  const { state, handlers, handleCloseEditorWithCentering } =
    useEditorPanelContext();
  const { selectedItem, selectedBlock, isNode } = state;
  const { handleCopy, handleDelete } = handlers;

  // Get block name from metadata if it's a node
  const displayName =
    isNode && selectedBlock
      ? getBlockName(selectedBlock) || selectedBlock.name || "Untitled"
      : String(selectedItem?.id || "Unknown");

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background rounded-tl-lg">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Badge variant={isNode ? "default" : "secondary"} className="text-xs">
            {isNode ? "Node" : "Edge"}
          </Badge>
          <span className="text-sm font-semibold text-foreground truncate max-w-48">
            {displayName}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopy}
          title="Copy to clipboard"
          className="h-7 w-7 p-0 hover:bg-accent hover:text-accent-foreground"
        >
          <Copy className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={handleDelete}
          title="Delete"
          className="h-7 w-7 p-0 hover:bg-destructive/90"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCloseEditorWithCentering}
          title="Close editor (center block)"
          className="h-7 w-7 p-0 hover:bg-accent hover:text-accent-foreground"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
