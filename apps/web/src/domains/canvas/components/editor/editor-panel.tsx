"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@workspace/ui/components/ui/button";
import { Input } from "@workspace/ui/components/ui/input";
import { Badge } from "@workspace/ui/components/ui/badge";
import { useCanvasData } from "@/domains/canvas/contexts/CanvasDataContext";
import { useCanvasSelection } from "@/domains/canvas/contexts/CanvasSelectionContext";
import { useUiLayout } from "@/domains/canvas/contexts/UiLayoutContext";
import { useCanvasCommandsContext } from "@/domains/canvas/contexts/CanvasCommandsContext";
import { useEditorControlContext } from "@/domains/canvas/contexts/EditorControlContext";
import { PropertySection } from "./property-section";
import {
  Expand,
  Share2,
  MoreHorizontal,
  ChevronsRight,
  Component,
  Unlink,
} from "lucide-react";
import { ContentSection } from "./content-section";
import {
  isComponentInstance,
  isComponentDefinition,
  type ComponentDefinition,
  type ComponentInstance,
} from "@/domains/canvas/types/component";

interface EditorPanelProps {
  className?: string;
}

/**
 * Editor Panel - positioned relative to ResizablePanel
 * Notion-like interface with PropertySection
 */
export function EditorPanel({ className }: EditorPanelProps) {
  const { blocksById } = useCanvasData();
  const { pageId, componentId, nodeIds } = useCanvasSelection();
  const { showEditorPanel, selectedBlockIdForEditor } = useUiLayout();
  const { closeEditor } = useEditorControlContext();
  const { selectComponent, setNodeSelection } = useCanvasSelection();

  // Get workspace ID from the first block (assuming all blocks have the same workspace)
  const workspaceId =
    (Object.values(blocksById)[0]?.workspace_id as string) || "";

  const { updateBlock, detachComponentInstance } = useCanvasCommandsContext();

  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const activeBlockId =
    selectedBlockIdForEditor ||
    (nodeIds && nodeIds[0] ? nodeIds[0] : componentId || pageId);

  const block = activeBlockId ? blocksById[activeBlockId] : null;

  // 컴포넌트 모드인지 확인
  const isComponentMode = !!componentId;

  // 컴포넌트 정보 확인
  const componentInfo = React.useMemo(() => {
    if (!block) return null;

    if (isComponentInstance(block)) {
      const componentId = block.metadata.component_id as string;
      const definition = blocksById[componentId] as ComponentDefinition;

      return {
        type: "instance" as const,
        instance: block,
        definition,
        hasStyleOverrides: !!(
          block.metadata.node_ui &&
          Object.keys(block.metadata.node_ui).length > 0
        ),
      };
    }

    if (isComponentDefinition(block)) {
      return {
        type: "definition" as const,
        definition: block,
      };
    }

    return null;
  }, [block, blocksById]);

  // 제목 상태 동기화
  useEffect(() => {
    if (block) {
      setTitle(block.name);
    }
  }, [block?.name]);

  // 편집 완료
  const handleTitleSave = async () => {
    if (block && title.trim() !== block.name) {
      const newTitle = title.trim();

      const result = await updateBlock(block.id, { name: newTitle });

      if (!result.ok) {
        console.error("Failed to update block:", result.error);
        // Reset title to original value on error
        setTitle(block.name);
      }
    }
  };

  // Enter 키로 저장
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSave();
    } else if (e.key === "Escape") {
      setTitle(block?.name || "");
    }
  };

  // 포커스 아웃 시 저장
  const handleBlur = () => {
    handleTitleSave();
  };

  useEffect(() => {
    if (showEditorPanel) {
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
  }, [showEditorPanel]);

  if (!shouldRender) return null;

  return (
    <div
      className={`absolute bottom-0 right-0 z-50 w-[45%] h-[90%] bg-background/70 backdrop-blur-md border-l border-t border-border shadow-2xl rounded-tl-lg transition-all duration-300 ease-out ${
        isAnimating ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      } ${className || ""}`}
    >
      <div className="flex flex-col h-full">
        {/* Modal Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 transition-all duration-200 hover:bg-accent/50 hover:scale-105 active:scale-95 group"
              onClick={closeEditor}
            >
              <ChevronsRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => {
                console.log("Expand modal");
              }}
            >
              <Expand className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => {
                console.log("Share");
              }}
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => {
                console.log("More options");
              }}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {/* Title Section */}
          <div className="p-4">
            {/* Component Info */}
            {componentInfo && (
              <div className="mb-3 space-y-2">
                {componentInfo.type === "instance" && (
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="text-xs flex items-center gap-1"
                    >
                      <Component className="w-3 h-3" />
                      Component Instance
                    </Badge>
                    {componentInfo.definition && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => {
                            // 컴포넌트 모드로 전환하고 정의 블록 선택
                            selectComponent(componentInfo.definition!.id);
                            setNodeSelection([componentInfo.definition!.id]);
                          }}
                        >
                          {componentInfo.definition.name}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={async () => {
                            if (componentInfo.instance) {
                              const result = await detachComponentInstance(
                                componentInfo.instance.id
                              );
                              if (!result.ok) {
                                console.error(
                                  "Failed to detach component:",
                                  result.error
                                );
                              }
                            }
                          }}
                        >
                          <Unlink className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                )}
                {componentInfo.type === "definition" && (
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="default"
                      className="text-xs flex items-center gap-1"
                    >
                      <Component className="w-3 h-3" />
                      Component Definition
                    </Badge>
                  </div>
                )}
              </div>
            )}
            {/* Regular Component Mode Badge */}
            {isComponentMode && !componentInfo && (
              <div className="mb-2">
                <Badge variant="secondary" className="text-xs">
                  Component
                </Badge>
              </div>
            )}
            <Input
              ref={inputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className="h-10 px-0 text-2xl md:text-3xl font-semibold border-none bg-transparent focus-visible:ring-0 shadow-none"
              placeholder="제목 없음"
              maxLength={100}
            />
          </div>

          {/* Property Section */}
          <div className="border-b px-1">
            <PropertySection />
          </div>

          {/* Comments Section */}
          {/* <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <span className="text-xs">👤</span>
              </div>
              <div className="flex-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    console.log("Add comment");
                  }}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  댓글 추가
                </Button>
              </div>
            </div>
          </div> */}

          {/* Content Section */}
          {/* <ContentSection /> */}
        </div>
      </div>
    </div>
  );
}
