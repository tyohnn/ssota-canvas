"use client";

import React, { useState, useEffect } from "react";
import { useCanvasData } from "@/domains/canvas/contexts/CanvasDataContext";
import { useCanvasSelection } from "@/domains/canvas/contexts/CanvasSelectionContext";
import { usePanel } from "@/domains/react-flow-canvas/contexts/PanelContext";
import { useCanvasCommandsContext } from "@/domains/canvas/contexts/CanvasCommandsContext";
import {
  getBlockAdditionPolicy,
  getDefaultBlockTemplate,
} from "@/domains/canvas/policy/block-addition-policy";
import { Button } from "@workspace/ui/components/ui/button";
import { Card } from "@workspace/ui/components/ui/card";
import { Badge } from "@workspace/ui/components/ui/badge";
import { Input } from "@workspace/ui/components/ui/input";
import { ChevronsRight, Blocks, Search, Plus, Component } from "lucide-react";

type Props = { className?: string };

export function BlockInsertPanel({ className }: Props) {
  const data = useCanvasData();
  const sel = useCanvasSelection();
  const panel = usePanel();
  const commands = useCanvasCommandsContext();

  // Get selected page block from data
  const selectedPageBlock = sel.pageId ? data.blocksById[sel.pageId] : null;
  const { closeBlockInsertPanel, showBlockInsertPanel } = panel;

  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const policy = getBlockAdditionPolicy(
    selectedPageBlock,
    Object.values(data.blocksById)
  );

  // Filter blocks based on search query
  const filteredBlocks = policy.blocks.filter(
    (block) =>
      block.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (block.description &&
        block.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group blocks by category
  const groupedBlocks = filteredBlocks.reduce(
    (acc, block) => {
      const category = block.isComponent
        ? "Components"
        : getBlockCategory(block.kind);
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(block);
      return acc;
    },
    {} as Record<string, typeof policy.blocks>
  );

  return (
    <div
      className={`absolute bottom-0 right-0 z-50 w-[400px] h-[90%] bg-background/95 backdrop-blur-md border-l border-t border-border shadow-2xl rounded-tl-lg transition-all duration-300 ease-out ${
        isAnimating ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      } ${className || ""}`}
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
                <h2 className="text-sm font-semibold">{policy.title}</h2>
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
          {Object.entries(groupedBlocks).map(([category, blocks]) => (
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
                {blocks.map((block) => (
                  <Card
                    key={block.id}
                    className="group cursor-pointer border border-border/50 hover:border-border hover:bg-muted/30 transition-all duration-200 p-3 hover:shadow-sm"
                    onClick={async () => {
                      const pageId = selectedPageBlock?.id as
                        | string
                        | undefined;
                      if (!pageId) return;

                      if (block.isComponent && block.componentDefinition) {
                        // Create component instance
                        await commands.createInstanceInPage(
                          pageId,
                          block.componentDefinition.id
                        );
                      } else {
                        // Create regular block
                        await commands.createBlockInPage(pageId, block.kind);
                      }
                      closeBlockInsertPanel();
                    }}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        "application/x-canvas-kind",
                        block.kind
                      );
                      e.dataTransfer.effectAllowed = "move";
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-md ${
                          block.isComponent
                            ? "bg-gradient-to-br from-purple-100 to-purple-50 border border-purple-200"
                            : "bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
                        } flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}
                      >
                        {block.isComponent ? (
                          <Component className="h-4 w-4 text-purple-600" />
                        ) : (
                          <BlockIcon kind={block.kind} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium truncate">
                            {block.name}
                          </h4>
                          {block.isComponent && (
                            <Badge
                              variant="secondary"
                              className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700"
                            >
                              <Component className="w-3 h-3 mr-1" />
                              Component
                            </Badge>
                          )}
                          {!block.isComponent &&
                            block.kind === "basic_text" && (
                              <Badge
                                variant="outline"
                                className="text-xs px-1.5 py-0.5"
                              >
                                Text
                              </Badge>
                            )}
                        </div>
                        {block.description && (
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {block.description}
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

// Block icon component
function BlockIcon({ kind }: { kind: string }) {
  const iconClass = "h-4 w-4 text-primary";

  switch (kind) {
    case "basic_text":
      return <span className={`${iconClass} font-bold`}>T</span>;
    case "shape":
      return <span className={`${iconClass} font-bold`}>□</span>;
    case "image":
      return <span className={`${iconClass} font-bold`}>🖼</span>;
    case "video":
      return <span className={`${iconClass} font-bold`}>🎥</span>;
    case "webview":
      return <span className={`${iconClass} font-bold`}>🌐</span>;
    case "youtube":
      return <span className={`${iconClass} font-bold`}>📺</span>;
    case "twitter_preview":
      return <span className={`${iconClass} font-bold`}>🐦</span>;
    case "math_formula":
      return <span className={`${iconClass} font-bold`}>∑</span>;
    case "file":
      return <span className={`${iconClass} font-bold`}>📄</span>;
    default:
      return <span className={`${iconClass} font-bold`}>◆</span>;
  }
}
