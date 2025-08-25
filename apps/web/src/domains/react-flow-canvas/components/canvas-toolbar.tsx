"use client";

import React from "react";
import { Button } from "@workspace/ui/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/ui/tooltip";
import { Separator } from "@workspace/ui/components/ui/separator";
import {
  Edit3,
  Plus,
  MousePointer,
  Hand,
  Maximize,
  // Square,
  // Circle,
  // Type,
  // Image,
  // Link,
} from "lucide-react";

export type CanvasToolMode = "select" | "hand";

interface CanvasToolbarProps {
  mode: CanvasToolMode;
  setMode: (mode: CanvasToolMode) => void;
  isAddOpen: boolean;
  toggleAdd: () => void;
  isEditOpen: boolean;
  toggleEdit: () => void;
  onFitToView?: () => void;
  // 페이지 편집 전용 props 추가
  isPageSelected?: boolean;
  isPageEditorOpen?: boolean;
}

export function CanvasToolbar({
  mode,
  setMode,
  isAddOpen,
  toggleAdd,
  isEditOpen,
  toggleEdit,
  onFitToView,
  // 페이지 편집 전용 props 추가
  isPageSelected = false,
  isPageEditorOpen = false,
}: CanvasToolbarProps) {
  // Keyboard event handler
  const handleKeyDown = React.useCallback((event: KeyboardEvent) => {
    // Only handle if not typing in an input field
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      (event.target as HTMLElement | null)?.isContentEditable
    ) {
      return;
    }

    // Ignore system shortcuts but allow Shift
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    switch (event.code) {
      case "KeyV":
        event.preventDefault();
        event.stopPropagation();
        setMode("select");
        break;
      case "KeyH":
        event.preventDefault();
        event.stopPropagation();
        setMode("hand");
        break;
      case "KeyF":
        event.preventDefault();
        event.stopPropagation();
        onFitToView?.();
        break;
    }
  }, [setMode, onFitToView]);

  React.useEffect(() => {
    const handleKeyDownWrapper = (event: KeyboardEvent) => {
      handleKeyDown(event);
    };
    
    // Use capture phase to ensure we get the event before React Flow
    document.addEventListener("keydown", handleKeyDownWrapper, true);
    return () => document.removeEventListener("keydown", handleKeyDownWrapper, true);
  }, [handleKeyDown]);

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
      <div className="flex items-center gap-1 px-2 py-1 bg-background/70 backdrop-blur-md border border-border/50 rounded-lg shadow-xl">
        <TooltipProvider>
          {/* Selection Tool */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={mode === "select" ? "default" : "ghost"}
                size="sm"
                className="h-8 w-8 p-0 rounded-md"
                onClick={() => setMode("select")}
              >
                <MousePointer className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Select (V)</p>
            </TooltipContent>
          </Tooltip>

          {/* Hand Tool */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={mode === "hand" ? "default" : "ghost"}
                size="sm"
                className="h-8 w-8 p-0 rounded-md"
                onClick={() => setMode("hand")}
              >
                <Hand className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Hand (H)</p>
            </TooltipContent>
          </Tooltip>
          {/* Fit to View Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onFitToView}
                className="h-8 w-8 p-0 rounded-md"
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Fit to View (F)</p>
            </TooltipContent>
          </Tooltip>

          <Separator
            orientation="vertical"
            className="mx-1 data-[orientation=vertical]:h-4"
          />

          {/* Add Block Button (toggle) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isAddOpen ? "default" : "ghost"}
                size="sm"
                onClick={toggleAdd}
                className="h-8 w-8 p-0 rounded-md"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Add Block</p>
            </TooltipContent>
          </Tooltip>

          {/* Edit Button (toggle) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={
                  isPageSelected && isPageEditorOpen ? "default" : "ghost"
                }
                size="sm"
                onClick={toggleEdit}
                className="h-8 w-8 p-0 rounded-md"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Edit Page</p>
            </TooltipContent>
          </Tooltip>

          {/* Extra tools commented out */}
          {/**
          <Separator orientation="vertical" className="mx-1 h-6" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-md">
                <Square className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Rectangle (R)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-md">
                <Circle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Circle (O)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-md">
                <Type className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Text (T)</TooltipContent>
          </Tooltip>
          */}
        </TooltipProvider>
      </div>
    </div>
  );
}
