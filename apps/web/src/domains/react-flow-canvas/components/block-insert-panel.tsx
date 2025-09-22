"use client";

import React, { useState, useEffect } from "react";
import { useReactFlow } from "@xyflow/react";
import { useCanvasData } from "@/domains/canvas/contexts/CanvasDataContext";
import { usePanel } from "@/domains/react-flow-canvas/contexts/PanelContext";
import { useReactFlowCommandsContext } from "@/domains/react-flow-canvas/contexts/ReactFlowCommandsContext";
import { getBlockAdditionPolicy } from "@/domains/react-flow-canvas/policy/node-addition-policy";
import { Button } from "@workspace/ui/components/ui/button";
import { Card } from "@workspace/ui/components/ui/card";
import { Badge } from "@workspace/ui/components/ui/badge";
import { Input } from "@workspace/ui/components/ui/input";
import { ChevronsRight, Blocks, Search, Plus, Component } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import { BlockOption } from "@/domains/react-flow-canvas/policy/node-addition-policy";

export function BlockInsertPanel() {
  const data = useCanvasData();
  const panel = usePanel();
  const commands = useReactFlowCommandsContext();
  const reactFlow = useReactFlow();

  // Get selected page block from data
  const { selectedPageBlock, componentBlocks } = data;
  const { closeBlockInsertPanel, showBlockInsertPanel } = panel;

  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Handle block insertion
  const handleBlockInsert = async (blockOption: BlockOption) => {
    const lastNode = reactFlow.getNodes().at(-1);
    let newNodePosition = { x: 0, y: 0 };
    if (lastNode) {
      const lastNodePosition = lastNode.position;
      newNodePosition = {
        x: lastNodePosition.x + 200,
        y: lastNodePosition.y + 200,
      };
    }
    
    const pageId = selectedPageBlock?.id as string | undefined;
    if (!pageId) return;

    if (blockOption.isComponent) {
      // Create component instance
      await commands.componentCommands.createComponentInstance(
        blockOption.id,
        newNodePosition,
        blockOption.title
      );
    } else {
      // Create regular block
      const res = await commands.nodeCommands.createNode(
        pageId,
        blockOption.kind,
        newNodePosition
      );
      console.log("createNode res", res);
    }
    closeBlockInsertPanel();
  };


  useEffect(() => {
    if (showBlockInsertPanel) {
      // Show: Start rendering and trigger slide-in animation
      setShouldRender(true);
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      // Hide: Start slide-out animation
      setIsAnimating(false);
      // Wait for animation to complete before removing from DOM
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [showBlockInsertPanel]);


  // ESC 키로 패널 닫기
  useEffect(() => {
    if (!showBlockInsertPanel) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeBlockInsertPanel();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [showBlockInsertPanel, closeBlockInsertPanel]);


  if (!shouldRender) return null;

  const availableBlockOptions = getBlockAdditionPolicy(
    selectedPageBlock,
    componentBlocks
  );

  // Filter blocks based on search query
  const filteredBlocks = availableBlockOptions.filter(
    (blockOption) =>
      blockOption.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (blockOption.description &&
        blockOption.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group blocks by category
  const groupedBlocks = filteredBlocks.reduce(
    (acc, blockOption) => {
      const category = blockOption.isComponent
        ? "Components"
        : getBlockCategory(blockOption.kind);
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(blockOption);
      return acc;
    },
    {} as Record<string, typeof availableBlockOptions>
  );

  return (
    <div
      className={`absolute bottom-0 right-0 z-50 w-[400px] h-[90%] bg-background/95 backdrop-blur-md border-l border-t border-border shadow-2xl rounded-tl-lg transition-all duration-300 ease-out ${
        isAnimating ? "translate-x-0 opacity-100 blur-none" : "translate-x-full opacity-0 blur-md"
      }`}
      style={{
        transition:
          "opacity 200ms ease-out-in, transform 200ms ease-out-in, filter 200ms ease-out-in",
      }}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-border/50">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-md"
                onClick={closeBlockInsertPanel}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <Blocks className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Add Block</h2>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              {filteredBlocks.length} blocks
            </Badge>
          </div>

          {/* Search */}
          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search blocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm bg-muted/50 border-border/50 focus:bg-background"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {Object.entries(groupedBlocks).map(([category, blockOptions]) => (
            <div
              key={category}
              className="p-4 border-b border-border/30 last:border-b-0"
            >
              <div className="mb-3">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {category}
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {blockOptions.map((blockOption) => (
                  <Card
                    key={blockOption.id}
                    className="group cursor-pointer border border-border/50 hover:border-border hover:bg-muted/30 transition-all duration-200 p-3 hover:shadow-sm"
                    onClick={() => handleBlockInsert(blockOption)}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        "application/x-canvas-kind",
                        blockOption.kind
                      );
                      e.dataTransfer.effectAllowed = "move";
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-md ${
                          blockOption.isComponent
                            ? "bg-gradient-to-br from-purple-100 to-purple-50 border border-purple-200"
                            : "bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
                        } flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}
                      >
                        {blockOption.isComponent ? (
                          <Component className="h-4 w-4 text-purple-600" />
                        ) : (
                          <DynamicIcon name={(blockOption.icon_name || "HelpCircle") as any} className="h-4 w-4 text-primary" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium truncate">
                            {blockOption.title}
                          </h4>
                          {blockOption.isComponent && (
                            <Badge
                              variant="secondary"
                              className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700"
                            >
                              <Component className="w-3 h-3 mr-1" />
                              Component
                            </Badge>
                          )}
                        </div>
                        {blockOption.description && (
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {blockOption.description}
                          </p>
                        )}
                      </div>

                      {/* Add button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {filteredBlocks.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Blocks className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground mb-1">
                No blocks found
              </p>
              <p className="text-xs text-muted-foreground/70">
                Try adjusting your search
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to get block category
function getBlockCategory(kind: string): string {
  switch (kind) {
    case "text":
    case "basic_text":
    case "shape":
      return "Basic Elements";
    case "image":
    case "video":
    case "youtube":
      return "Media";
    case "webview":
    case "twitter_preview":
      return "Embedded Content";
    case "math_formula":
      return "Advanced";
    case "file":
      return "Files";
    default:
      return "Other";
  }
}


